import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createFilmForUser,
  getFilmUsageHistoryForUser,
  reduceFilmCountForUser,
  softDeleteFilmForUser,
  spoolBulkFilmForUser,
  updateFilmForUser,
} from "../films/service.js";
import { formatDimensions } from "../films/schema.js";
import type { Film, FilmUsage } from "../films/types.js";
import type {
  FilmToolHandlers,
  MCPToolResult,
  ToolArgumentsByName,
} from "./tool-types.js";

function jsonResult(data: unknown): MCPToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function createFilmToolHandlers(
  supabase: SupabaseClient,
  userId: string
): FilmToolHandlers {
  async function getFilmInventory(
    args: ToolArgumentsByName["get_film_inventory"]
  ): Promise<MCPToolResult> {
    const { include_availability = false } = args;
    const tableName = include_availability
      ? "films_with_availability"
      : "films";

    let filmsQuery = supabase.from(tableName).select("*");
    if (userId) {
      filmsQuery = filmsQuery.eq("user_id", userId);
    }

    const { data: films, error } = await filmsQuery
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch films: ${error.message}`);
    }

    const totalValue =
      films?.reduce(
        (sum: number, film: Film) => sum + (film.price || 0) * (film.count || 0),
        0
      ) || 0;
    const totalRolls =
      films?.reduce((sum: number, film: Film) => sum + (film.count || 0), 0) ||
      0;

    return jsonResult({
      summary: {
        total_films: films?.length || 0,
        total_rolls: totalRolls,
        total_value: totalValue,
      },
      films: films || [],
    });
  }

  async function filterFilms(
    args: ToolArgumentsByName["filter_films"]
  ): Promise<MCPToolResult> {
    const {
      type,
      iso_min,
      iso_max,
      format,
      brand,
      in_stock_only = false,
    } = args;

    let query = supabase.from("films").select("*").is("deleted_at", null);
    if (type) query = query.eq("type", type);
    if (iso_min !== undefined) query = query.gte("iso", iso_min);
    if (iso_max !== undefined) query = query.lte("iso", iso_max);
    if (format) query = query.eq("format", format);
    if (brand) query = query.ilike("brand", `%${brand}%`);
    if (in_stock_only) query = query.gt("count", 0);

    const { data: films, error } = await query
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to filter films: ${error.message}`);
    }

    return jsonResult({
      filters_applied: {
        type,
        iso_range:
          iso_min !== undefined || iso_max !== undefined
            ? `${iso_min || 0}-${iso_max || "∞"}`
            : null,
        format,
        brand,
        in_stock_only,
      },
      results_count: films?.length || 0,
      films: films || [],
    });
  }

  async function updateFilmQuantity(
    args: ToolArgumentsByName["update_film_quantity"]
  ): Promise<MCPToolResult> {
    const { film_id, quantity, usage_note } = args;

    if (!film_id || !quantity || !usage_note) {
      throw new Error("film_id, quantity, and usage_note are required");
    }
    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    const { data: film, error: filmError } = await supabase
      .from("films")
      .select("count, name, brand")
      .eq("id", film_id)
      .single();

    if (filmError || !film) {
      throw new Error("Film not found");
    }

    const result = await reduceFilmCountForUser(
      supabase,
      userId || undefined,
      film_id,
      quantity,
      usage_note
    );

    if ("error" in result && result.error) {
      throw new Error(result.error);
    }

    return jsonResult({
      success: true,
      film: `${film.brand} ${film.name}`,
      previous_count: film.count || 0,
      new_count: "newCount" in result ? result.newCount : undefined,
      quantity_used: quantity,
      usage_note,
    });
  }

  async function spoolBulkFilm(
    args: ToolArgumentsByName["spool_bulk_film"]
  ): Promise<MCPToolResult> {
    const { film_id, exposures_to_spool, cassettes_created, spool_note } = args;

    if (!film_id || !exposures_to_spool || !cassettes_created || !spool_note) {
      throw new Error(
        "film_id, exposures_to_spool, cassettes_created, and spool_note are required"
      );
    }
    if (exposures_to_spool <= 0 || cassettes_created <= 0) {
      throw new Error(
        "exposures_to_spool and cassettes_created must be positive"
      );
    }

    const { data: film, error: filmError } = await supabase
      .from("films")
      .select(
        "bulk_remaining_exposures, spooled_cassettes, is_bulk_film, name, brand, format"
      )
      .eq("id", film_id)
      .single();

    if (filmError || !film) {
      throw new Error("Film not found");
    }
    if (!film.is_bulk_film) {
      throw new Error("This is not a bulk film");
    }

    const result = await spoolBulkFilmForUser(
      supabase,
      userId || undefined,
      film_id,
      exposures_to_spool,
      cassettes_created,
      spool_note
    );

    if ("error" in result && result.error) {
      if (result.error === "Not enough bulk film remaining") {
        throw new Error(
          `Not enough bulk film remaining. Available: ${
            film.bulk_remaining_exposures || 0
          } exposures, Requested: ${exposures_to_spool} exposures`
        );
      }

      throw new Error(result.error);
    }

    return jsonResult({
      success: true,
      film: `${film.brand} ${film.name}`,
      exposures_used: exposures_to_spool,
      cassettes_created,
      remaining_exposures:
        "remainingExposures" in result ? result.remainingExposures : undefined,
      total_spooled_cassettes:
        "spooledCassettes" in result ? result.spooledCassettes : undefined,
      spool_note,
    });
  }

  async function checkLowStock(
    args: ToolArgumentsByName["check_low_stock"]
  ): Promise<MCPToolResult> {
    const { threshold = 3, include_out_of_stock = true } = args;

    let query = supabase
      .from("films")
      .select("*")
      .is("deleted_at", null)
      .lte("count", threshold);

    if (!include_out_of_stock) {
      query = query.gt("count", 0);
    }

    const { data: films, error } = await query
      .order("count", { ascending: true })
      .order("brand", { ascending: true });

    if (error) {
      throw new Error(`Failed to check low stock: ${error.message}`);
    }

    const outOfStock =
      films?.filter((f: Film) => (f.count || 0) === 0) || [];
    const lowStock =
      films?.filter(
        (f: Film) => (f.count || 0) > 0 && (f.count || 0) <= threshold
      ) || [];

    return jsonResult({
      alert_threshold: threshold,
      summary: {
        out_of_stock: outOfStock.length,
        low_stock: lowStock.length,
        total_alerts: films?.length || 0,
      },
      out_of_stock: outOfStock,
      low_stock: lowStock,
    });
  }

  async function getFilmUsageHistory(
    args: ToolArgumentsByName["get_film_usage_history"]
  ): Promise<MCPToolResult> {
    const { film_id } = args;
    if (!film_id) {
      throw new Error("film_id is required");
    }

    const result = await getFilmUsageHistoryForUser(
      supabase,
      userId || undefined,
      film_id
    );

    if (result.error) {
      throw new Error(result.error);
    }

    const usage = result.data || [];
    const totalUsed =
      usage.reduce((sum: number, u: FilmUsage) => sum + u.quantity, 0) || 0;

    return jsonResult({
      film_id,
      total_usage_records: usage.length,
      total_rolls_used: totalUsed,
      usage_history: usage,
    });
  }

  async function getFilmStats(
    args: ToolArgumentsByName["get_film_stats"]
  ): Promise<MCPToolResult> {
    const { group_by = "type" } = args;

    const { data: films, error } = await supabase
      .from("films")
      .select("*")
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Failed to fetch films for stats: ${error.message}`);
    }

    const stats: Record<string, unknown> = {};
    films?.forEach((film: Film) => {
      const key = film[group_by as keyof Film] as string;
      if (!stats[key]) {
        stats[key] = { count: 0, total_rolls: 0, total_value: 0, films: [] };
      }
      const entry = stats[key] as {
        count: number;
        total_rolls: number;
        total_value: number;
        films: Array<{ id: string; name: string; brand: string; count?: number }>;
      };
      entry.count++;
      entry.total_rolls += film.count || 0;
      entry.total_value += (film.price || 0) * (film.count || 0);
      entry.films.push({
        id: film.id,
        name: film.name,
        brand: film.brand,
        count: film.count,
      });
    });

    return jsonResult({
      grouped_by: group_by,
      total_categories: Object.keys(stats).length,
      statistics: stats,
    });
  }

  async function createFilm(
    args: ToolArgumentsByName["create_film"]
  ): Promise<MCPToolResult> {
    const {
      name,
      brand,
      iso,
      format,
      type,
      expiration_date,
      count = 1,
      price,
      notes = "",
      editing_notes = "",
      is_ecn = false,
      is_bulk_film = false,
      bulk_length_meters,
    } = args;

    if (!name || !brand || !iso || !format || !type || !expiration_date) {
      throw new Error(
        "Missing required fields: name, brand, iso, format, type, expiration_date"
      );
    }

    const film = await createFilmForUser(supabase, userId || undefined, {
      name,
      brand,
      iso,
      format,
      type,
      expiration_date,
      count,
      price,
      notes,
      editing_notes,
      is_ecn,
      is_bulk_film,
      bulk_length_meters,
      bulk_quantity: is_bulk_film ? count : undefined,
      calculated_rolls:
        is_bulk_film && bulk_length_meters
          ? Math.floor(
              Number(bulk_length_meters) /
                (formatDimensions[
                  format as keyof typeof formatDimensions
                ]?.bulkLengthPerRoll || 1.5)
            )
          : undefined,
      bulk_rolls_used: undefined,
      bulk_remaining_exposures: undefined,
      spooled_cassettes: undefined,
    });

    return jsonResult({
      success: true,
      message: "Film created successfully",
      film,
    });
  }

  async function editFilm(
    args: ToolArgumentsByName["edit_film"]
  ): Promise<MCPToolResult> {
    const { film_id, ...updateData } = args;
    if (!film_id) {
      throw new Error("film_id is required");
    }

    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("No fields to update");
    }

    const { data: existingFilm, error: existingFilmError } = await supabase
      .from("films")
      .select("*")
      .eq("id", film_id)
      .single();

    if (existingFilmError || !existingFilm) {
      throw new Error("Film not found");
    }

    const film = await updateFilmForUser(supabase, userId || undefined, film_id, {
      name: (cleanedData.name as string | undefined) ?? existingFilm.name,
      brand: (cleanedData.brand as string | undefined) ?? existingFilm.brand,
      iso: Number((cleanedData.iso as number | undefined) ?? existingFilm.iso),
      format: (cleanedData.format as string | undefined) ?? existingFilm.format,
      type: (cleanedData.type as string | undefined) ?? existingFilm.type,
      expiration_date:
        (cleanedData.expiration_date as string | undefined) ??
        existingFilm.expiration_date,
      price:
        (cleanedData.price as number | undefined) ??
        existingFilm.price ??
        undefined,
      count:
        (cleanedData.count as number | undefined) ??
        existingFilm.count ??
        undefined,
      notes: (cleanedData.notes as string | undefined) ?? existingFilm.notes ?? "",
      editing_notes:
        (cleanedData.editing_notes as string | undefined) ??
        existingFilm.editing_notes ??
        "",
      is_ecn:
        (cleanedData.is_ecn as boolean | undefined) ?? existingFilm.is_ecn ?? false,
      is_bulk_film:
        (cleanedData.is_bulk_film as boolean | undefined) ??
        existingFilm.is_bulk_film ??
        false,
      bulk_length_meters:
        (cleanedData.bulk_length_meters as number | undefined) ??
        existingFilm.bulk_length_meters ??
        undefined,
      bulk_quantity:
        (cleanedData.bulk_quantity as number | undefined) ??
        existingFilm.bulk_quantity ??
        undefined,
      bulk_rolls_used:
        (cleanedData.bulk_rolls_used as number | undefined) ??
        existingFilm.bulk_rolls_used ??
        undefined,
      calculated_rolls:
        (cleanedData.calculated_rolls as number | undefined) ??
        existingFilm.calculated_rolls ??
        undefined,
      bulk_remaining_exposures:
        (cleanedData.bulk_remaining_exposures as number | undefined) ??
        existingFilm.bulk_remaining_exposures ??
        undefined,
      spooled_cassettes:
        (cleanedData.spooled_cassettes as number | undefined) ??
        existingFilm.spooled_cassettes ??
        undefined,
    });

    return jsonResult({
      success: true,
      message: "Film updated successfully",
      film,
    });
  }

  async function deleteFilm(
    args: ToolArgumentsByName["delete_film"]
  ): Promise<MCPToolResult> {
    const { film_id } = args;
    if (!film_id) {
      throw new Error("film_id is required");
    }

    const { data: film, error: fetchError } = await supabase
      .from("films")
      .select("name, brand")
      .eq("id", film_id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !film) {
      throw new Error("Film not found");
    }

    await softDeleteFilmForUser(supabase, userId || undefined, film_id);

    return jsonResult({
      success: true,
      message: `Film "${film.brand} ${film.name}" moved to trash`,
      deleted_film: { id: film_id, name: film.name, brand: film.brand },
    });
  }

  return {
    getFilmInventory,
    filterFilms,
    updateFilmQuantity,
    spoolBulkFilm,
    checkLowStock,
    getFilmUsageHistory,
    getFilmStats,
    createFilm,
    editFilm,
    deleteFilm,
  };
}
