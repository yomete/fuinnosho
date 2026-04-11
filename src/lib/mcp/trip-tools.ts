import type { SupabaseClient } from "@supabase/supabase-js";
import type { Film } from "@/lib/films/types";
import type { Trip } from "@/lib/trips/types";
import type {
  MCPToolResult,
  ToolArgumentsByName,
  TripToolHandlers,
} from "@/lib/mcp/tool-types";
import {
  addFilmToTripForUser,
  createTripForUser,
  deleteTripForUser,
  getFilmsWithAvailabilityForUser,
  getTripByIdForUser,
  getTripsForUser,
  removeFilmFromTripForUser,
  updateFilmQuantityInTripForUser,
} from "@/lib/trips/service";

function jsonResult(data: unknown): MCPToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function createTripToolHandlers(
  supabase: SupabaseClient,
  userId: string
): TripToolHandlers {
  type TripFilmDetailRow = {
    quantity: number;
    films?: { price?: number } | null;
  };

  type TripGearDetailRow = {
    gear?: { purchase_price?: number } | null;
  };

  type TripFilmReservationRow = {
    quantity: number;
    trips: Array<{ title: string }>;
    films: Array<{ name: string; brand: string }>;
  };

  async function createTrip(
    args: ToolArgumentsByName["create_trip"]
  ): Promise<MCPToolResult> {
    const { title, description = "", start_date, end_date } = args;

    if (!title || !start_date || !end_date) {
      throw new Error("Missing required fields: title, start_date, end_date");
    }
    if (new Date(end_date) < new Date(start_date)) {
      throw new Error("End date must be on or after start date");
    }

    const trip = userId
      ? await createTripForUser(supabase, userId, {
          title,
          description,
          start_date,
          end_date,
        })
      : (
          await supabase
            .from("trips")
            .insert({
              title,
              description,
              start_date,
              end_date,
              status: "upcoming",
            })
            .select()
            .single()
        ).data;

    return jsonResult({
      success: true,
      message: "Trip created successfully",
      trip,
    });
  }

  async function listTrips(
    args: ToolArgumentsByName["list_trips"]
  ): Promise<MCPToolResult> {
    const { include_past = true, include_films = false } = args;

    const trips = userId
      ? await getTripsForUser(supabase, userId)
      : (
          await supabase
            .from("trips")
            .select("*")
            .order("start_date", { ascending: false })
        ).data || [];

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
          (trip as Trip & { reserved_films?: unknown[] }).reserved_films =
            tripFilms || [];
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

  async function getTripDetails(
    args: ToolArgumentsByName["get_trip_details"]
  ): Promise<MCPToolResult> {
    const { trip_id } = args;
    if (!trip_id) {
      throw new Error("trip_id is required");
    }

    const trip = userId
      ? await getTripByIdForUser(supabase, userId, trip_id)
      : (await supabase.from("trips").select("*").eq("id", trip_id).single()).data;

    if (!trip) {
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

    const filmRows = (tripFilms || []) as unknown as TripFilmDetailRow[];
    const gearRows = (tripGear || []) as unknown as TripGearDetailRow[];

    const totalRolls =
      filmRows.reduce((sum: number, tf) => sum + tf.quantity, 0) || 0;
    const totalFilmValue =
      filmRows.reduce(
        (sum: number, tf) => sum + tf.quantity * (tf.films?.price || 0),
        0
      ) || 0;
    const totalGearValue =
      gearRows.reduce(
        (sum: number, tg) => sum + (tg.gear?.purchase_price || 0),
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

  async function editTrip(
    args: ToolArgumentsByName["edit_trip"]
  ): Promise<MCPToolResult> {
    const { trip_id, ...updateData } = args;
    if (!trip_id) {
      throw new Error("trip_id is required");
    }

    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("No fields to update");
    }

    if (cleanedData.start_date && cleanedData.end_date) {
      if (
        new Date(String(cleanedData.end_date)) <
        new Date(String(cleanedData.start_date))
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

  async function deleteTrip(
    args: ToolArgumentsByName["delete_trip"]
  ): Promise<MCPToolResult> {
    const { trip_id } = args;
    if (!trip_id) {
      throw new Error("trip_id is required");
    }

    const trip = userId
      ? await getTripByIdForUser(supabase, userId, trip_id)
      : (await supabase.from("trips").select("title").eq("id", trip_id).single()).data;

    if (!trip) {
      throw new Error("Trip not found");
    }

    if (userId) {
      await deleteTripForUser(supabase, userId, trip_id);
    } else {
      const { error: deleteError } = await supabase
        .from("trips")
        .delete()
        .eq("id", trip_id);

      if (deleteError) {
        throw new Error(`Failed to delete trip: ${deleteError.message}`);
      }
    }

    return jsonResult({
      success: true,
      message: `Trip "${trip.title}" deleted successfully`,
      deleted_trip: { id: trip_id, title: trip.title },
    });
  }

  async function reserveFilmForTrip(
    args: ToolArgumentsByName["reserve_film_for_trip"]
  ): Promise<MCPToolResult> {
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

    const availableCount = (film as Film).available_count || 0;
    if (availableCount < quantity) {
      throw new Error(
        `Not enough available stock. Available: ${availableCount}, Requested: ${quantity}`
      );
    }

    const { data: existingReservation } = await supabase
      .from("trip_films")
      .select("quantity")
      .eq("trip_id", trip_id)
      .eq("film_id", film_id)
      .single();

    let result;
    if (userId) {
      await addFilmToTripForUser(supabase, userId, trip_id, film_id, quantity);
      result = existingReservation
        ? {
            action: "updated",
            previous_quantity: existingReservation.quantity,
          }
        : { action: "created" };
    } else if (existingReservation) {
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
        remaining_available: availableCount - quantity,
      },
    });
  }

  async function removeFilmReservation(
    args: ToolArgumentsByName["remove_film_reservation"]
  ): Promise<MCPToolResult> {
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

    const reservationData = reservation as unknown as TripFilmReservationRow;
    const tripTitle = reservationData.trips[0]?.title || "";
    const filmName = reservationData.films[0]?.name || "";
    const filmBrand = reservationData.films[0]?.brand || "";

    if (userId) {
      await removeFilmFromTripForUser(supabase, userId, trip_id, film_id);
    } else {
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
    }

    return jsonResult({
      success: true,
      message: `Removed ${reservationData.quantity} roll(s) of ${filmBrand} ${filmName} from trip "${tripTitle}"`,
      removed_reservation: {
        quantity: reservationData.quantity,
        film: `${filmBrand} ${filmName}`,
        trip: tripTitle,
      },
    });
  }

  async function updateFilmReservationQuantity(args: {
    trip_id?: string;
    film_id?: string;
    quantity?: number;
  }): Promise<MCPToolResult> {
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

    const reservationData = existingReservation as unknown as TripFilmReservationRow;
    const tripTitle = reservationData.trips[0]?.title || "";
    const filmName = reservationData.films[0]?.name || "";
    const filmBrand = reservationData.films[0]?.brand || "";

    if (userId) {
      await updateFilmQuantityInTripForUser(
        supabase,
        userId,
        trip_id,
        film_id,
        quantity
      );
    } else {
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
    }

    return jsonResult({
      success: true,
      message: `Updated reservation for ${filmBrand} ${filmName} in trip "${tripTitle}" from ${reservationData.quantity} to ${quantity} roll(s)`,
      updated_reservation: {
        old_quantity: reservationData.quantity,
        new_quantity: quantity,
        film: `${filmBrand} ${filmName}`,
        trip: tripTitle,
      },
    });
  }

  async function getFilmsWithAvailability(args: {
    available_only?: boolean;
    min_available?: number;
  }): Promise<MCPToolResult> {
    const { min_available = 1 } = args;

    const films = userId
      ? await getFilmsWithAvailabilityForUser(supabase, userId)
      : (
          await supabase
            .from("films_with_availability")
            .select("*")
            .order("brand", { ascending: true })
            .order("name", { ascending: true })
        ).data || [];

    const availableFilms =
      films?.filter((f: Film) => (f.available_count || 0) >= min_available) ||
      [];
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

  return {
    createTrip,
    listTrips,
    getTripDetails,
    editTrip,
    deleteTrip,
    reserveFilmForTrip,
    removeFilmReservation,
    updateFilmReservationQuantity,
    getFilmsWithAvailability,
  };
}
