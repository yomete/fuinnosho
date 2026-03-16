import { SupabaseClient } from "@supabase/supabase-js";

// --- Interfaces ---

export interface Film {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  expiration_date: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  price?: number;
  count?: number;
  notes?: string;
  editing_notes?: string;
  is_ecn?: boolean;
  deleted_at?: string;
  is_bulk_film?: boolean;
  bulk_length_meters?: number;
  bulk_quantity?: number;
  bulk_rolls_used?: number;
  calculated_rolls?: number;
  bulk_remaining_exposures?: number;
  spooled_cassettes?: number;
  total_count?: number;
  reserved_quantity?: number;
  available_count?: number;
}

export interface FilmUsage {
  id: string;
  film_id: string;
  quantity: number;
  usage_note: string;
  created_at: string;
  usage_type?: "spool" | "shoot" | "add";
  exposures_used?: number;
  trip_id?: string;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  status?: "upcoming" | "ongoing" | "past" | "completed";
}

export interface TripFilm {
  id: string;
  trip_id: string;
  film_id: string;
  quantity: number;
  created_at: string;
}

export interface Gear {
  id: string;
  name: string;
  brand: string;
  type: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  condition: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface TripGear {
  id: string;
  trip_id: string;
  gear_id: string;
  created_at: string;
}

// --- Helpers ---

export const formatDimensions: Record<
  string,
  { rollLength?: number; sheetsPerBox?: number; bulkLengthPerRoll: number }
> = {
  "35mm": { rollLength: 36, bulkLengthPerRoll: 1.65 },
  "120": { rollLength: 12, bulkLengthPerRoll: 0.8 },
  "4x5": { sheetsPerBox: 10, bulkLengthPerRoll: 0 },
};

export function getExposuresPerRoll(format: string): number {
  const formatInfo = formatDimensions[format];
  if (!formatInfo) return 36;
  if (formatInfo.rollLength !== undefined) return formatInfo.rollLength;
  if (formatInfo.sheetsPerBox !== undefined) return formatInfo.sheetsPerBox;
  return 36;
}

// --- MCP Tool Result type ---

export type MCPToolResult = {
  content: Array<{ type: "text"; text: string }>;
};

// --- Tool Definitions ---

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_film_inventory",
    description: "Get complete film inventory with current stock levels",
    inputSchema: {
      type: "object",
      properties: {
        include_availability: {
          type: "boolean",
          description: "Include availability data for trip planning",
          default: false,
        },
      },
    },
  },
  {
    name: "filter_films",
    description:
      "Filter films by type, ISO range, format, or other criteria",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", description: "Film type (color, bw, cinema)" },
        iso_min: { type: "number", description: "Minimum ISO value" },
        iso_max: { type: "number", description: "Maximum ISO value" },
        format: { type: "string", description: "Film format (35mm, 120, 4x5)" },
        brand: { type: "string", description: "Film brand" },
        in_stock_only: {
          type: "boolean",
          description: "Only show films with count > 0",
          default: false,
        },
      },
    },
  },
  {
    name: "update_film_quantity",
    description:
      "Update film quantity when using rolls (reduces count and logs usage)",
    inputSchema: {
      type: "object",
      properties: {
        film_id: { type: "string", description: "Film ID to update" },
        quantity: {
          type: "number",
          description: "Number of rolls used (positive number)",
        },
        usage_note: { type: "string", description: "Note about film usage" },
      },
    },
  },
  {
    name: "spool_bulk_film",
    description: "Spool bulk film into cassettes (for bulk films only)",
    inputSchema: {
      type: "object",
      properties: {
        film_id: { type: "string", description: "Bulk film ID to spool from" },
        exposures_to_spool: {
          type: "number",
          description:
            "Number of exposures from bulk film to use for spooling",
        },
        cassettes_created: {
          type: "number",
          description: "Number of cassettes created from the bulk film",
        },
        spool_note: {
          type: "string",
          description: "Note about the spooling process",
        },
      },
      required: [
        "film_id",
        "exposures_to_spool",
        "cassettes_created",
        "spool_note",
      ],
    },
  },
  {
    name: "check_low_stock",
    description:
      "Check for films with low stock (configurable threshold)",
    inputSchema: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          description: "Stock level considered low",
          default: 3,
        },
        include_out_of_stock: {
          type: "boolean",
          description: "Include films with 0 count",
          default: true,
        },
      },
    },
  },
  {
    name: "get_film_usage_history",
    description: "Get usage history for a specific film",
    inputSchema: {
      type: "object",
      properties: {
        film_id: {
          type: "string",
          description: "Film ID to get usage history for",
        },
      },
      required: ["film_id"],
    },
  },
  {
    name: "get_film_stats",
    description: "Get aggregate statistics about film inventory",
    inputSchema: {
      type: "object",
      properties: {
        group_by: {
          type: "string",
          enum: ["type", "brand", "format", "iso"],
          description: "How to group the statistics",
          default: "type",
        },
      },
    },
  },
  {
    name: "create_film",
    description: "Add a new film to the inventory",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Film name" },
        brand: { type: "string", description: "Film brand" },
        iso: { type: "number", description: "ISO speed" },
        format: {
          type: "string",
          description: "Film format (35mm, 120, 4x5, etc.)",
        },
        type: {
          type: "string",
          description: "Film type (Color Negative, Black & White, etc.)",
        },
        expiration_date: {
          type: "string",
          description: "Expiration date (YYYY-MM-DD format)",
        },
        count: { type: "number", description: "Number of rolls", default: 1 },
        price: { type: "number", description: "Price per roll" },
        notes: { type: "string", description: "Additional notes", default: "" },
        editing_notes: {
          type: "string",
          description: "Editing tips and notes for this film stock",
          default: "",
        },
        is_ecn: {
          type: "boolean",
          description:
            "Whether this is an ECN (Eastman Color Negative) motion picture film",
          default: false,
        },
        is_bulk_film: {
          type: "boolean",
          description: "Whether this is bulk film",
          default: false,
        },
        bulk_length_meters: {
          type: "number",
          description: "Length in meters for bulk film",
        },
      },
      required: ["name", "brand", "iso", "format", "type", "expiration_date"],
    },
  },
  {
    name: "edit_film",
    description: "Edit an existing film's details",
    inputSchema: {
      type: "object",
      properties: {
        film_id: { type: "string", description: "Film ID to edit" },
        name: { type: "string", description: "Film name" },
        brand: { type: "string", description: "Film brand" },
        iso: { type: "number", description: "ISO speed" },
        format: {
          type: "string",
          description: "Film format (35mm, 120, 4x5, etc.)",
        },
        type: {
          type: "string",
          description: "Film type (Color Negative, Black & White, etc.)",
        },
        expiration_date: {
          type: "string",
          description: "Expiration date (YYYY-MM-DD format)",
        },
        count: { type: "number", description: "Number of rolls" },
        price: { type: "number", description: "Price per roll" },
        notes: { type: "string", description: "Additional notes" },
        editing_notes: {
          type: "string",
          description: "Editing tips and notes for this film stock",
        },
        is_ecn: {
          type: "boolean",
          description:
            "Whether this is an ECN (Eastman Color Negative) motion picture film",
        },
        is_bulk_film: {
          type: "boolean",
          description: "Whether this is bulk film",
        },
        bulk_length_meters: {
          type: "number",
          description: "Length in meters for bulk film",
        },
      },
      required: ["film_id"],
    },
  },
  {
    name: "delete_film",
    description: "Delete a film from the inventory",
    inputSchema: {
      type: "object",
      properties: {
        film_id: { type: "string", description: "Film ID to delete" },
      },
      required: ["film_id"],
    },
  },
  {
    name: "create_trip",
    description: "Create a new photo trip with duration support",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Trip title" },
        description: {
          type: "string",
          description: "Trip description",
          default: "",
        },
        start_date: {
          type: "string",
          description: "Trip start date (YYYY-MM-DD format)",
        },
        end_date: {
          type: "string",
          description: "Trip end date (YYYY-MM-DD format)",
        },
      },
      required: ["title", "start_date", "end_date"],
    },
  },
  {
    name: "list_trips",
    description: "List all trips with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        include_past: {
          type: "boolean",
          description: "Include past trips",
          default: true,
        },
        include_films: {
          type: "boolean",
          description: "Include reserved films for each trip",
          default: false,
        },
      },
    },
  },
  {
    name: "get_trip_details",
    description: "Get detailed information about a specific trip",
    inputSchema: {
      type: "object",
      properties: {
        trip_id: { type: "string", description: "Trip ID" },
      },
      required: ["trip_id"],
    },
  },
  {
    name: "edit_trip",
    description: "Edit an existing trip's details with duration support",
    inputSchema: {
      type: "object",
      properties: {
        trip_id: { type: "string", description: "Trip ID to edit" },
        title: { type: "string", description: "Trip title" },
        description: { type: "string", description: "Trip description" },
        start_date: {
          type: "string",
          description: "Trip start date (YYYY-MM-DD format)",
        },
        end_date: {
          type: "string",
          description: "Trip end date (YYYY-MM-DD format)",
        },
        status: {
          type: "string",
          description: "Trip status (upcoming, ongoing, past, completed)",
          enum: ["upcoming", "ongoing", "past", "completed"],
        },
      },
      required: ["trip_id"],
    },
  },
  {
    name: "delete_trip",
    description: "Delete a trip and all its film reservations",
    inputSchema: {
      type: "object",
      properties: {
        trip_id: { type: "string", description: "Trip ID to delete" },
      },
      required: ["trip_id"],
    },
  },
  {
    name: "reserve_film_for_trip",
    description: "Reserve films for a specific trip",
    inputSchema: {
      type: "object",
      properties: {
        trip_id: { type: "string", description: "Trip ID" },
        film_id: { type: "string", description: "Film ID to reserve" },
        quantity: {
          type: "number",
          description: "Number of rolls to reserve",
        },
      },
      required: ["trip_id", "film_id", "quantity"],
    },
  },
  {
    name: "remove_film_reservation",
    description: "Remove film reservation from a trip",
    inputSchema: {
      type: "object",
      properties: {
        trip_id: { type: "string", description: "Trip ID" },
        film_id: { type: "string", description: "Film ID to unreserve" },
      },
      required: ["trip_id", "film_id"],
    },
  },
  {
    name: "update_film_reservation_quantity",
    description: "Update the quantity of a film reservation for a trip",
    inputSchema: {
      type: "object",
      properties: {
        trip_id: { type: "string", description: "Trip ID" },
        film_id: { type: "string", description: "Film ID" },
        quantity: {
          type: "number",
          description: "New quantity of rolls to reserve (must be >= 1)",
        },
      },
      required: ["trip_id", "film_id", "quantity"],
    },
  },
  {
    name: "get_films_with_availability",
    description: "Get films with availability data for trip planning",
    inputSchema: {
      type: "object",
      properties: {
        available_only: {
          type: "boolean",
          description: "Only show films with available stock",
          default: false,
        },
        min_available: {
          type: "number",
          description: "Minimum available quantity required",
          default: 1,
        },
      },
    },
  },
  {
    name: "create_gear",
    description: "Add new gear/equipment to inventory",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Gear name/title" },
        brand: { type: "string", description: "Gear brand/manufacturer" },
        type: {
          type: "string",
          description:
            "Gear type (camera, lens, flash, accessory, tripod, filter, bag)",
          enum: [
            "camera",
            "lens",
            "flash",
            "accessory",
            "tripod",
            "filter",
            "bag",
          ],
        },
        model: { type: "string", description: "Model number or name" },
        serial_number: { type: "string", description: "Serial number" },
        purchase_date: {
          type: "string",
          description: "Purchase date (YYYY-MM-DD format)",
        },
        purchase_price: { type: "number", description: "Purchase price" },
        condition: {
          type: "string",
          description: "Current condition",
          enum: ["excellent", "good", "fair", "poor"],
          default: "good",
        },
        notes: {
          type: "string",
          description: "Additional notes",
          default: "",
        },
      },
      required: ["name", "brand", "type", "condition"],
    },
  },
  {
    name: "list_gear",
    description: "Get all gear/equipment with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Filter by gear type",
          enum: [
            "camera",
            "lens",
            "flash",
            "accessory",
            "tripod",
            "filter",
            "bag",
          ],
        },
        brand: { type: "string", description: "Filter by brand" },
        condition: {
          type: "string",
          description: "Filter by condition",
          enum: ["excellent", "good", "fair", "poor"],
        },
        include_trip_reservations: {
          type: "boolean",
          description: "Include gear reserved for upcoming trips",
          default: false,
        },
      },
    },
  },
  {
    name: "edit_gear",
    description: "Edit existing gear details",
    inputSchema: {
      type: "object",
      properties: {
        gear_id: { type: "string", description: "Gear ID to edit" },
        name: { type: "string", description: "Gear name/title" },
        brand: { type: "string", description: "Gear brand/manufacturer" },
        type: {
          type: "string",
          description: "Gear type",
          enum: [
            "camera",
            "lens",
            "flash",
            "accessory",
            "tripod",
            "filter",
            "bag",
          ],
        },
        model: { type: "string", description: "Model number or name" },
        serial_number: { type: "string", description: "Serial number" },
        purchase_date: {
          type: "string",
          description: "Purchase date (YYYY-MM-DD format)",
        },
        purchase_price: { type: "number", description: "Purchase price" },
        condition: {
          type: "string",
          description: "Current condition",
          enum: ["excellent", "good", "fair", "poor"],
        },
        notes: { type: "string", description: "Additional notes" },
      },
      required: ["gear_id"],
    },
  },
  {
    name: "delete_gear",
    description: "Delete gear from inventory",
    inputSchema: {
      type: "object",
      properties: {
        gear_id: { type: "string", description: "Gear ID to delete" },
      },
      required: ["gear_id"],
    },
  },
  {
    name: "get_gear_stats",
    description: "Get gear statistics and summary",
    inputSchema: {
      type: "object",
      properties: {
        group_by: {
          type: "string",
          enum: ["type", "brand", "condition"],
          description: "How to group the statistics",
          default: "type",
        },
      },
    },
  },
  {
    name: "reserve_gear_for_trip",
    description: "Reserve gear for a specific trip",
    inputSchema: {
      type: "object",
      properties: {
        trip_id: { type: "string", description: "Trip ID" },
        gear_id: { type: "string", description: "Gear ID to reserve" },
      },
      required: ["trip_id", "gear_id"],
    },
  },
  {
    name: "remove_gear_reservation",
    description: "Remove gear reservation from a trip",
    inputSchema: {
      type: "object",
      properties: {
        trip_id: { type: "string", description: "Trip ID" },
        gear_id: { type: "string", description: "Gear ID to unreserve" },
      },
      required: ["trip_id", "gear_id"],
    },
  },
];

// --- Tool name to handler key mapping ---

function toHandlerKey(toolName: string): string {
  return toolName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// --- Tool Handlers Factory ---

export function createToolHandlers(
  supabase: SupabaseClient,
  userId: string
): Record<string, (args: any) => Promise<MCPToolResult>> {
  function jsonResult(data: any): MCPToolResult {
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }

  async function getFilmInventory(args: any): Promise<MCPToolResult> {
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

  async function filterFilms(args: any): Promise<MCPToolResult> {
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

  async function updateFilmQuantity(args: any): Promise<MCPToolResult> {
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

    const currentCount = film.count || 0;
    const newCount = Math.max(0, currentCount - quantity);

    const { error: updateError } = await supabase
      .from("films")
      .update({ count: newCount })
      .eq("id", film_id);

    if (updateError) {
      throw new Error(`Failed to update film count: ${updateError.message}`);
    }

    const { error: usageError } = await supabase
      .from("film_usage")
      .insert({ film_id, quantity, usage_note });

    if (usageError) {
      throw new Error(`Failed to record usage: ${usageError.message}`);
    }

    return jsonResult({
      success: true,
      film: `${film.brand} ${film.name}`,
      previous_count: currentCount,
      new_count: newCount,
      quantity_used: quantity,
      usage_note,
    });
  }

  async function spoolBulkFilm(args: any): Promise<MCPToolResult> {
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

    const currentRemainingExposures = film.bulk_remaining_exposures || 0;
    const currentSpooledCassettes = film.spooled_cassettes || 0;

    if (exposures_to_spool > currentRemainingExposures) {
      throw new Error(
        `Not enough bulk film remaining. Available: ${currentRemainingExposures} exposures, Requested: ${exposures_to_spool} exposures`
      );
    }

    const newRemainingExposures =
      currentRemainingExposures - exposures_to_spool;
    const newSpooledCassettes = currentSpooledCassettes + cassettes_created;

    const { error: updateError } = await supabase
      .from("films")
      .update({
        bulk_remaining_exposures: newRemainingExposures,
        spooled_cassettes: newSpooledCassettes,
        count: newSpooledCassettes,
      })
      .eq("id", film_id);

    if (updateError) {
      throw new Error(`Failed to update film: ${updateError.message}`);
    }

    const { error: usageError } = await supabase.from("film_usage").insert({
      film_id,
      quantity: cassettes_created,
      usage_note: spool_note,
      usage_type: "spool",
      exposures_used: exposures_to_spool,
    });

    if (usageError) {
      throw new Error(`Failed to record spooling: ${usageError.message}`);
    }

    return jsonResult({
      success: true,
      film: `${film.brand} ${film.name}`,
      exposures_used: exposures_to_spool,
      cassettes_created,
      remaining_exposures: newRemainingExposures,
      total_spooled_cassettes: newSpooledCassettes,
      spool_note,
    });
  }

  async function checkLowStock(args: any): Promise<MCPToolResult> {
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

  async function getFilmUsageHistory(args: any): Promise<MCPToolResult> {
    const { film_id } = args;
    if (!film_id) {
      throw new Error("film_id is required");
    }

    const { data: usage, error } = await supabase
      .from("film_usage")
      .select("*")
      .eq("film_id", film_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch usage history: ${error.message}`);
    }

    const totalUsed =
      usage?.reduce(
        (sum: number, u: FilmUsage) => sum + u.quantity,
        0
      ) || 0;

    return jsonResult({
      film_id,
      total_usage_records: usage?.length || 0,
      total_rolls_used: totalUsed,
      usage_history: usage || [],
    });
  }

  async function getFilmStats(args: any): Promise<MCPToolResult> {
    const { group_by = "type" } = args;

    const { data: films, error } = await supabase
      .from("films")
      .select("*")
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Failed to fetch films for stats: ${error.message}`);
    }

    const stats: Record<string, any> = {};
    films?.forEach((film: Film) => {
      const key = film[group_by as keyof Film] as string;
      if (!stats[key]) {
        stats[key] = { count: 0, total_rolls: 0, total_value: 0, films: [] };
      }
      stats[key].count++;
      stats[key].total_rolls += film.count || 0;
      stats[key].total_value += (film.price || 0) * (film.count || 0);
      stats[key].films.push({
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

  async function createFilm(args: any): Promise<MCPToolResult> {
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

    const filmData: any = {
      name,
      brand,
      iso,
      format,
      type,
      expiration_date,
      count,
      notes,
      editing_notes,
      is_ecn,
      is_bulk_film,
    };

    if (userId) filmData.user_id = userId;
    if (price !== undefined) filmData.price = price;

    if (is_bulk_film && bulk_length_meters) {
      filmData.bulk_length_meters = bulk_length_meters;
      const formatInfo = formatDimensions[format];
      const bulkLengthPerRoll = formatInfo?.bulkLengthPerRoll || 1.5;
      filmData.bulk_quantity = count;
      filmData.calculated_rolls = Math.floor(
        bulk_length_meters / bulkLengthPerRoll
      );
      filmData.count = filmData.calculated_rolls;
      filmData.bulk_remaining_exposures =
        filmData.calculated_rolls * getExposuresPerRoll(format);
      filmData.spooled_cassettes = 0;
    }

    const { data: film, error } = await supabase
      .from("films")
      .insert(filmData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create film: ${error.message}`);
    }

    return jsonResult({
      success: true,
      message: "Film created successfully",
      film,
    });
  }

  async function editFilm(args: any): Promise<MCPToolResult> {
    const { film_id, ...updateData } = args;
    if (!film_id) {
      throw new Error("film_id is required");
    }

    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("No fields to update");
    }

    if (cleanedData.is_bulk_film && cleanedData.bulk_length_meters) {
      cleanedData.calculated_rolls = Math.floor(
        Number(cleanedData.bulk_length_meters) / 1.5
      );
      if (!cleanedData.count) {
        cleanedData.count = cleanedData.calculated_rolls;
      }
    }

    const { data: film, error } = await supabase
      .from("films")
      .update(cleanedData)
      .eq("id", film_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update film: ${error.message}`);
    }
    if (!film) {
      throw new Error("Film not found");
    }

    return jsonResult({
      success: true,
      message: "Film updated successfully",
      film,
    });
  }

  async function deleteFilm(args: any): Promise<MCPToolResult> {
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

    const { error: deleteError } = await supabase
      .from("films")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", film_id);

    if (deleteError) {
      throw new Error(`Failed to delete film: ${deleteError.message}`);
    }

    return jsonResult({
      success: true,
      message: `Film "${film.brand} ${film.name}" moved to trash`,
      deleted_film: { id: film_id, name: film.name, brand: film.brand },
    });
  }

  async function createTrip(args: any): Promise<MCPToolResult> {
    const { title, description = "", start_date, end_date } = args;

    if (!title || !start_date || !end_date) {
      throw new Error("Missing required fields: title, start_date, end_date");
    }
    if (new Date(end_date) < new Date(start_date)) {
      throw new Error("End date must be on or after start date");
    }

    const tripData: any = {
      title,
      description,
      start_date,
      end_date,
      status: "upcoming",
    };
    if (userId) tripData.user_id = userId;

    const { data: trip, error } = await supabase
      .from("trips")
      .insert(tripData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create trip: ${error.message}`);
    }

    return jsonResult({
      success: true,
      message: "Trip created successfully",
      trip,
    });
  }

  async function listTrips(args: any): Promise<MCPToolResult> {
    const { include_past = true, include_films = false } = args;

    let query = supabase.from("trips").select("*");
    if (!include_past) {
      const today = new Date().toISOString().split("T")[0];
      query = query.gte("start_date", today);
    }

    const { data: trips, error } = await query.order("start_date", {
      ascending: false,
    });

    if (error) {
      throw new Error(`Failed to fetch trips: ${error.message}`);
    }

    if (include_films && trips) {
      for (const trip of trips) {
        const { data: tripFilms, error: filmsError } = await supabase
          .from("trip_films")
          .select(
            `
            quantity,
            films (
              id, name, brand, iso, format, type
            )
          `
          )
          .eq("trip_id", trip.id);

        if (!filmsError) {
          (trip as any).reserved_films = tripFilms || [];
        }
      }
    }

    const upcomingTrips =
      trips?.filter((trip: Trip) => new Date(trip.start_date) >= new Date()) ||
      [];
    const pastTrips =
      trips?.filter((trip: Trip) => new Date(trip.end_date) < new Date()) || [];

    return jsonResult({
      summary: {
        total_trips: trips?.length || 0,
        upcoming_trips: upcomingTrips.length,
        past_trips: pastTrips.length,
      },
      upcoming_trips: upcomingTrips,
      past_trips: include_past ? pastTrips : [],
    });
  }

  async function getTripDetails(args: any): Promise<MCPToolResult> {
    const { trip_id } = args;
    if (!trip_id) {
      throw new Error("trip_id is required");
    }

    const { data: trip, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", trip_id)
      .single();

    if (error || !trip) {
      throw new Error("Trip not found");
    }

    const { data: tripFilms, error: filmsError } = await supabase
      .from("trip_films")
      .select(
        `
        quantity,
        films (id, name, brand, iso, format, type, count, price)
      `
      )
      .eq("trip_id", trip_id);

    if (filmsError) {
      throw new Error(`Failed to fetch trip films: ${filmsError.message}`);
    }

    const { data: tripGear, error: gearError } = await supabase
      .from("trip_gear")
      .select(
        `
        gear (id, name, brand, type, model, condition, purchase_price)
      `
      )
      .eq("trip_id", trip_id);

    if (gearError) {
      throw new Error(`Failed to fetch trip gear: ${gearError.message}`);
    }

    const totalRolls =
      tripFilms?.reduce((sum: number, tf: any) => sum + tf.quantity, 0) || 0;
    const totalFilmValue =
      tripFilms?.reduce(
        (sum: number, tf: any) => sum + tf.quantity * (tf.films?.price || 0),
        0
      ) || 0;
    const totalGearValue =
      tripGear?.reduce(
        (sum: number, tg: any) => sum + (tg.gear?.purchase_price || 0),
        0
      ) || 0;

    return jsonResult({
      trip,
      summary: {
        total_films_reserved: tripFilms?.length || 0,
        total_rolls: totalRolls,
        total_gear_reserved: tripGear?.length || 0,
        estimated_film_value: totalFilmValue,
        estimated_gear_value: totalGearValue,
        total_estimated_value: totalFilmValue + totalGearValue,
      },
      reserved_films: tripFilms || [],
      reserved_gear: tripGear || [],
    });
  }

  async function editTrip(args: any): Promise<MCPToolResult> {
    const { trip_id, ...updateData } = args;
    if (!trip_id) {
      throw new Error("trip_id is required");
    }

    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("No fields to update");
    }

    if (cleanedData.start_date && cleanedData.end_date) {
      if (
        new Date(cleanedData.end_date.toString()) <
        new Date(cleanedData.start_date.toString())
      ) {
        throw new Error("End date must be on or after start date");
      }
    }

    const { data: trip, error } = await supabase
      .from("trips")
      .update(cleanedData)
      .eq("id", trip_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update trip: ${error.message}`);
    }
    if (!trip) {
      throw new Error("Trip not found");
    }

    return jsonResult({
      success: true,
      message: "Trip updated successfully",
      trip,
    });
  }

  async function deleteTrip(args: any): Promise<MCPToolResult> {
    const { trip_id } = args;
    if (!trip_id) {
      throw new Error("trip_id is required");
    }

    const { data: trip, error: fetchError } = await supabase
      .from("trips")
      .select("title")
      .eq("id", trip_id)
      .single();

    if (fetchError || !trip) {
      throw new Error("Trip not found");
    }

    const { error: deleteError } = await supabase
      .from("trips")
      .delete()
      .eq("id", trip_id);

    if (deleteError) {
      throw new Error(`Failed to delete trip: ${deleteError.message}`);
    }

    return jsonResult({
      success: true,
      message: `Trip "${trip.title}" deleted successfully`,
      deleted_trip: { id: trip_id, title: trip.title },
    });
  }

  async function reserveFilmForTrip(args: any): Promise<MCPToolResult> {
    const { trip_id, film_id, quantity } = args;

    if (!trip_id || !film_id || !quantity) {
      throw new Error("trip_id, film_id, and quantity are required");
    }
    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("title")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      throw new Error("Trip not found");
    }

    const { data: film, error: filmError } = await supabase
      .from("films_with_availability")
      .select("name, brand, available_count")
      .eq("id", film_id)
      .single();

    if (filmError || !film) {
      throw new Error("Film not found");
    }

    if (film.available_count < quantity) {
      throw new Error(
        `Not enough available stock. Available: ${film.available_count}, Requested: ${quantity}`
      );
    }

    const { data: existingReservation } = await supabase
      .from("trip_films")
      .select("quantity")
      .eq("trip_id", trip_id)
      .eq("film_id", film_id)
      .single();

    let result;
    if (existingReservation) {
      const newQuantity = existingReservation.quantity + quantity;
      const { data, error } = await supabase
        .from("trip_films")
        .update({ quantity: newQuantity })
        .eq("trip_id", trip_id)
        .eq("film_id", film_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update film reservation: ${error.message}`);
      }
      result = {
        ...data,
        action: "updated",
        previous_quantity: existingReservation.quantity,
      };
    } else {
      const { data, error } = await supabase
        .from("trip_films")
        .insert({ trip_id, film_id, quantity })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reserve film: ${error.message}`);
      }
      result = { ...data, action: "created" };
    }

    return jsonResult({
      success: true,
      message: `${quantity} roll(s) of ${film.brand} ${film.name} ${result.action} for trip "${trip.title}"`,
      reservation: result,
      film: {
        name: film.name,
        brand: film.brand,
        remaining_available: film.available_count - quantity,
      },
    });
  }

  async function removeFilmReservation(args: any): Promise<MCPToolResult> {
    const { trip_id, film_id } = args;

    if (!trip_id || !film_id) {
      throw new Error("trip_id and film_id are required");
    }

    const { data: reservation, error: fetchError } = await supabase
      .from("trip_films")
      .select(
        `
        quantity,
        trips (title),
        films (name, brand)
      `
      )
      .eq("trip_id", trip_id)
      .eq("film_id", film_id)
      .single();

    if (fetchError || !reservation) {
      throw new Error("Film reservation not found for this trip");
    }

    const { error: deleteError } = await supabase
      .from("trip_films")
      .delete()
      .eq("trip_id", trip_id)
      .eq("film_id", film_id);

    if (deleteError) {
      throw new Error(
        `Failed to remove film reservation: ${deleteError.message}`
      );
    }

    return jsonResult({
      success: true,
      message: `Removed ${reservation.quantity} roll(s) of ${(reservation as any).films.brand} ${(reservation as any).films.name} from trip "${(reservation as any).trips.title}"`,
      removed_reservation: {
        quantity: reservation.quantity,
        film: `${(reservation as any).films.brand} ${(reservation as any).films.name}`,
        trip: (reservation as any).trips.title,
      },
    });
  }

  async function updateFilmReservationQuantity(
    args: any
  ): Promise<MCPToolResult> {
    const { trip_id, film_id, quantity } = args;

    if (!trip_id || !film_id || quantity === undefined) {
      throw new Error("trip_id, film_id, and quantity are required");
    }
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    const { data: existingReservation, error: fetchError } = await supabase
      .from("trip_films")
      .select(
        `
        quantity,
        trips (title),
        films (name, brand)
      `
      )
      .eq("trip_id", trip_id)
      .eq("film_id", film_id)
      .single();

    if (fetchError || !existingReservation) {
      throw new Error("Film reservation not found for this trip");
    }

    const { error: updateError } = await supabase
      .from("trip_films")
      .update({ quantity })
      .eq("trip_id", trip_id)
      .eq("film_id", film_id);

    if (updateError) {
      throw new Error(
        `Failed to update film reservation quantity: ${updateError.message}`
      );
    }

    return jsonResult({
      success: true,
      message: `Updated reservation for ${(existingReservation as any).films.brand} ${(existingReservation as any).films.name} in trip "${(existingReservation as any).trips.title}" from ${existingReservation.quantity} to ${quantity} roll(s)`,
      updated_reservation: {
        old_quantity: existingReservation.quantity,
        new_quantity: quantity,
        film: `${(existingReservation as any).films.brand} ${(existingReservation as any).films.name}`,
        trip: (existingReservation as any).trips.title,
      },
    });
  }

  async function getFilmsWithAvailability(args: any): Promise<MCPToolResult> {
    const { available_only = false, min_available = 1 } = args;

    let query = supabase.from("films_with_availability").select("*");
    if (available_only) {
      query = query.gte("available_count", min_available);
    }

    const { data: films, error } = await query
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to fetch films with availability: ${error.message}`
      );
    }

    const availableFilms =
      films?.filter(
        (f: Film) => (f.available_count || 0) >= min_available
      ) || [];
    const reservedFilms =
      films?.filter((f: Film) => (f.reserved_quantity || 0) > 0) || [];
    const totalValue =
      films?.reduce(
        (sum: number, film: Film) =>
          sum + (film.price || 0) * (film.available_count || 0),
        0
      ) || 0;

    return jsonResult({
      summary: {
        total_films: films?.length || 0,
        films_with_availability: availableFilms.length,
        films_with_reservations: reservedFilms.length,
        total_available_rolls:
          films?.reduce(
            (sum: number, f: Film) => sum + (f.available_count || 0),
            0
          ) || 0,
        total_reserved_rolls:
          films?.reduce(
            (sum: number, f: Film) => sum + (f.reserved_quantity || 0),
            0
          ) || 0,
        available_inventory_value: totalValue,
      },
      films: films || [],
    });
  }

  async function createGear(args: any): Promise<MCPToolResult> {
    const {
      name,
      brand,
      type,
      model,
      serial_number,
      purchase_date,
      purchase_price,
      condition = "good",
      notes = "",
    } = args;

    if (!name || !brand || !type || !condition) {
      throw new Error("Missing required fields: name, brand, type, condition");
    }

    const gearData: any = { name, brand, type, condition, notes };
    if (userId) gearData.user_id = userId;
    if (model) gearData.model = model;
    if (serial_number) gearData.serial_number = serial_number;
    if (purchase_date) gearData.purchase_date = purchase_date;
    if (purchase_price !== undefined) gearData.purchase_price = purchase_price;

    const { data: gear, error } = await supabase
      .from("gear")
      .insert(gearData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create gear: ${error.message}`);
    }

    return jsonResult({
      success: true,
      message: "Gear created successfully",
      gear,
    });
  }

  async function listGear(args: any): Promise<MCPToolResult> {
    const { type, brand, condition, include_trip_reservations = false } = args;

    let query = supabase.from("gear").select("*");
    if (userId) query = query.eq("user_id", userId);
    if (type) query = query.eq("type", type);
    if (brand) query = query.ilike("brand", `%${brand}%`);
    if (condition) query = query.eq("condition", condition);

    const { data: gear, error } = await query
      .order("type", { ascending: true })
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch gear: ${error.message}`);
    }

    if (include_trip_reservations && gear) {
      for (const item of gear) {
        const { data: reservations } = await supabase
          .from("trip_gear")
          .select(
            `
            trips (id, title, start_date, end_date)
          `
          )
          .eq("gear_id", item.id);

        (item as any).trip_reservations = reservations || [];
      }
    }

    const totalValue =
      gear?.reduce(
        (sum: number, item: Gear) => sum + (item.purchase_price || 0),
        0
      ) || 0;
    const gearByType =
      gear?.reduce((acc: Record<string, number>, item: Gear) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}) || {};

    return jsonResult({
      summary: {
        total_gear: gear?.length || 0,
        total_value: totalValue,
        gear_by_type: gearByType,
        filters_applied: { type, brand, condition, include_trip_reservations },
      },
      gear: gear || [],
    });
  }

  async function editGear(args: any): Promise<MCPToolResult> {
    const { gear_id, ...updateData } = args;
    if (!gear_id) {
      throw new Error("gear_id is required");
    }

    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("No fields to update");
    }

    let updateQuery = supabase
      .from("gear")
      .update(cleanedData)
      .eq("id", gear_id);
    if (userId) updateQuery = updateQuery.eq("user_id", userId);

    const { data: gear, error } = await updateQuery.select().single();

    if (error) {
      throw new Error(`Failed to update gear: ${error.message}`);
    }
    if (!gear) {
      throw new Error("Gear not found");
    }

    return jsonResult({
      success: true,
      message: "Gear updated successfully",
      gear,
    });
  }

  async function deleteGear(args: any): Promise<MCPToolResult> {
    const { gear_id } = args;
    if (!gear_id) {
      throw new Error("gear_id is required");
    }

    let fetchQuery = supabase
      .from("gear")
      .select("name, brand, type")
      .eq("id", gear_id);
    if (userId) fetchQuery = fetchQuery.eq("user_id", userId);

    const { data: gear, error: fetchError } = await fetchQuery.single();

    if (fetchError || !gear) {
      throw new Error("Gear not found");
    }

    const { data: reservations } = await supabase
      .from("trip_gear")
      .select(`trips (title, start_date, end_date)`)
      .eq("gear_id", gear_id);

    const upcomingReservations =
      reservations?.filter(
        (r: any) => new Date(r.trips.start_date) >= new Date()
      ) || [];

    if (upcomingReservations.length > 0) {
      const tripTitles = upcomingReservations
        .map((r: any) => r.trips.title)
        .join(", ");
      throw new Error(
        `Cannot delete gear: it's reserved for upcoming trips: ${tripTitles}`
      );
    }

    let deleteQuery = supabase.from("gear").delete().eq("id", gear_id);
    if (userId) deleteQuery = deleteQuery.eq("user_id", userId);

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      throw new Error(`Failed to delete gear: ${deleteError.message}`);
    }

    return jsonResult({
      success: true,
      message: `Gear "${gear.brand} ${gear.name}" (${gear.type}) deleted successfully`,
      deleted_gear: {
        id: gear_id,
        name: gear.name,
        brand: gear.brand,
        type: gear.type,
      },
    });
  }

  async function getGearStats(args: any): Promise<MCPToolResult> {
    const { group_by = "type" } = args;

    let statsQuery = supabase.from("gear").select("*");
    if (userId) statsQuery = statsQuery.eq("user_id", userId);

    const { data: gear, error } = await statsQuery;

    if (error) {
      throw new Error(`Failed to fetch gear for stats: ${error.message}`);
    }

    const stats: Record<string, any> = {};
    gear?.forEach((item: Gear) => {
      const key = item[group_by as keyof Gear] as string;
      if (!stats[key]) {
        stats[key] = { count: 0, total_value: 0, gear: [] };
      }
      stats[key].count++;
      stats[key].total_value += item.purchase_price || 0;
      stats[key].gear.push({
        id: item.id,
        name: item.name,
        brand: item.brand,
        type: item.type,
        condition: item.condition,
      });
    });

    const totalValue =
      gear?.reduce(
        (sum: number, item: Gear) => sum + (item.purchase_price || 0),
        0
      ) || 0;
    const totalGear = gear?.length || 0;

    return jsonResult({
      grouped_by: group_by,
      total_categories: Object.keys(stats).length,
      overall_summary: {
        total_gear: totalGear,
        total_value: totalValue,
        average_value: totalGear > 0 ? totalValue / totalGear : 0,
      },
      statistics: stats,
    });
  }

  async function reserveGearForTrip(args: any): Promise<MCPToolResult> {
    const { trip_id, gear_id } = args;

    if (!trip_id || !gear_id) {
      throw new Error("trip_id and gear_id are required");
    }

    let tripQuery = supabase
      .from("trips")
      .select("title")
      .eq("id", trip_id);
    if (userId) tripQuery = tripQuery.eq("user_id", userId);
    const { data: trip, error: tripError } = await tripQuery.single();

    if (tripError || !trip) {
      throw new Error("Trip not found");
    }

    let gearQuery = supabase
      .from("gear")
      .select("name, brand, type")
      .eq("id", gear_id);
    if (userId) gearQuery = gearQuery.eq("user_id", userId);
    const { data: gear, error: gearError } = await gearQuery.single();

    if (gearError || !gear) {
      throw new Error("Gear not found");
    }

    const { data: existingReservation } = await supabase
      .from("trip_gear")
      .select("id")
      .eq("trip_id", trip_id)
      .eq("gear_id", gear_id)
      .single();

    if (existingReservation) {
      throw new Error(
        `Gear "${gear.brand} ${gear.name}" is already reserved for trip "${trip.title}"`
      );
    }

    const { data: reservation, error } = await supabase
      .from("trip_gear")
      .insert({ trip_id, gear_id })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reserve gear: ${error.message}`);
    }

    return jsonResult({
      success: true,
      message: `${gear.brand} ${gear.name} (${gear.type}) reserved for trip "${trip.title}"`,
      reservation: {
        id: reservation.id,
        trip_title: trip.title,
        gear: `${gear.brand} ${gear.name}`,
        gear_type: gear.type,
      },
    });
  }

  async function removeGearReservation(args: any): Promise<MCPToolResult> {
    const { trip_id, gear_id } = args;

    if (!trip_id || !gear_id) {
      throw new Error("trip_id and gear_id are required");
    }

    const { data: reservation, error: fetchError } = await supabase
      .from("trip_gear")
      .select(
        `
        trips (title),
        gear (name, brand, type)
      `
      )
      .eq("trip_id", trip_id)
      .eq("gear_id", gear_id)
      .single();

    if (fetchError || !reservation) {
      throw new Error("Gear reservation not found for this trip");
    }

    if (userId) {
      const [tripCheck, gearCheck] = await Promise.all([
        supabase
          .from("trips")
          .select("id")
          .eq("id", trip_id)
          .eq("user_id", userId)
          .single(),
        supabase
          .from("gear")
          .select("id")
          .eq("id", gear_id)
          .eq("user_id", userId)
          .single(),
      ]);

      if (tripCheck.error || gearCheck.error) {
        throw new Error("Access denied: trip or gear not found");
      }
    }

    const { error: deleteError } = await supabase
      .from("trip_gear")
      .delete()
      .eq("trip_id", trip_id)
      .eq("gear_id", gear_id);

    if (deleteError) {
      throw new Error(
        `Failed to remove gear reservation: ${deleteError.message}`
      );
    }

    return jsonResult({
      success: true,
      message: `Removed ${(reservation as any).gear.brand} ${(reservation as any).gear.name} (${(reservation as any).gear.type}) from trip "${(reservation as any).trips.title}"`,
      removed_reservation: {
        gear: `${(reservation as any).gear.brand} ${(reservation as any).gear.name}`,
        gear_type: (reservation as any).gear.type,
        trip: (reservation as any).trips.title,
      },
    });
  }

  // Build the handler map
  const handlers: Record<string, (args: any) => Promise<MCPToolResult>> = {};
  const handlerFunctions: Record<string, (args: any) => Promise<MCPToolResult>> = {
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
    createTrip,
    listTrips,
    getTripDetails,
    editTrip,
    deleteTrip,
    reserveFilmForTrip,
    removeFilmReservation,
    updateFilmReservationQuantity,
    getFilmsWithAvailability,
    createGear,
    listGear,
    editGear,
    deleteGear,
    getGearStats,
    reserveGearForTrip,
    removeGearReservation,
  };

  // Map tool names (snake_case) to handler functions (camelCase)
  for (const def of TOOL_DEFINITIONS) {
    const key = toHandlerKey(def.name);
    handlers[def.name] = handlerFunctions[key];
  }

  return handlers;
}
