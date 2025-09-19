"use server";

import { Trip, TripFilm, TripGear, Gear, TripSchema, tripSchema } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { reduceFilmCount } from "./films";

interface CreateTripResponse {
  success: boolean;
  error?: string;
  trip?: Trip;
}

export async function createTrip(data: TripSchema): Promise<CreateTripResponse> {
  try {
    const validatedData = tripSchema.parse(data);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const tripId = uuidv4();
    const newTrip: Trip = {
      ...validatedData,
      id: tripId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id,
      status: 'upcoming',
    };

    const { error } = await supabase.from("trips").insert([newTrip]);

    if (error) {
      throw error;
    }

    revalidatePath("/trips");
    return { success: true, trip: newTrip };
  } catch (error) {
    console.error("Error creating trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create trip",
    };
  }
}

export async function editTrip(
  id: string,
  data: TripSchema
): Promise<CreateTripResponse> {
  try {
    const validatedData = tripSchema.parse(data);

    const supabase = await createClient();
    const { error } = await supabase
      .from("trips")
      .update(validatedData)
      .eq("id", id);

    if (error) {
      throw error;
    }

    const { data: updatedTrip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .single();

    revalidatePath("/trips");
    return { success: true, trip: updatedTrip };
  } catch (error) {
    console.error("Error editing trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit trip",
    };
  }
}

export async function getTrips(): Promise<{
  data: (Trip & { reserved_film_count?: number })[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    
    // Get trips with total reserved film count
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        trip_films (
          quantity
        )
      `)
      .order("start_date", { ascending: true });

    if (error) {
      throw error;
    }

    // Calculate total reserved film count and determine status for each trip
    const tripsWithCounts = data?.map(trip => {
      const tripFilms = trip.trip_films as { quantity: number }[] | null;
      const reserved_film_count = tripFilms?.reduce((total, tf) => total + tf.quantity, 0) || 0;
      
      // Determine status if not already completed
      let status = trip.status;
      if (status !== 'completed') {
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        const today = new Date();
        // Set time to 00:00:00 to compare dates only
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        if (startDate > today) {
          status = 'upcoming';
        } else if (endDate < today) {
          status = 'past';
        } else {
          status = 'ongoing';
        }
      }

      // Remove trip_films from the final object and add reserved_film_count and status
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { trip_films, ...tripData } = trip;
      return {
        ...tripData,
        reserved_film_count,
        status,
      };
    }) || [];

    return { data: tripsWithCounts, error: null };
  } catch (error) {
    console.error("Error fetching trips:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Failed to fetch trips"),
    };
  }
}

export async function getTripById(id: string): Promise<Trip | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching trip by ID:", error);
    return null;
  }
}

export async function deleteTrip(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: Error;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("trips").delete().eq("id", id);

    if (error) {
      throw error;
    }

    revalidatePath("/trips");
    return { success: true, message: "Trip deleted successfully" };
  } catch (error) {
    console.error("Error deleting trip:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to delete trip"),
    };
  }
}

export async function addFilmToTrip(
  tripId: string,
  filmId: string,
  quantity: number = 1
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    
    // Check if this film is already in the trip
    const { data: existingTripFilm } = await supabase
      .from("trip_films")
      .select("*")
      .eq("trip_id", tripId)
      .eq("film_id", filmId)
      .single();

    if (existingTripFilm) {
      // Update existing reservation by adding to the quantity
      const newQuantity = existingTripFilm.quantity + quantity;
      const { error } = await supabase
        .from("trip_films")
        .update({ quantity: newQuantity })
        .eq("trip_id", tripId)
        .eq("film_id", filmId);

      if (error) {
        throw error;
      }
    } else {
      // Create new reservation
      const tripFilm: Omit<TripFilm, "id" | "created_at"> = {
        trip_id: tripId,
        film_id: filmId,
        quantity,
      };

      const { error } = await supabase.from("trip_films").insert([tripFilm]);

      if (error) {
        throw error;
      }
    }

    revalidatePath("/trips");
    revalidatePath("/films");
    return { success: true };
  } catch (error) {
    console.error("Error adding film to trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add film to trip",
    };
  }
}

export async function updateFilmQuantityInTrip(
  tripId: string,
  filmId: string,
  newQuantity: number
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (newQuantity < 1) {
      return {
        success: false,
        error: "Quantity must be at least 1",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("trip_films")
      .update({ quantity: newQuantity })
      .eq("trip_id", tripId)
      .eq("film_id", filmId);

    if (error) {
      throw error;
    }

    revalidatePath("/trips");
    revalidatePath("/films");
    return { success: true };
  } catch (error) {
    console.error("Error updating film quantity in trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update film quantity",
    };
  }
}

export async function removeFilmFromTrip(
  tripId: string,
  filmId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("trip_films")
      .delete()
      .eq("trip_id", tripId)
      .eq("film_id", filmId);

    if (error) {
      throw error;
    }

    revalidatePath("/trips");
    revalidatePath("/films");
    return { success: true };
  } catch (error) {
    console.error("Error removing film from trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove film from trip",
    };
  }
}

interface FilmWithReservedQuantity {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  reserved_quantity: number;
}

export async function getTripWithFilms(tripId: string): Promise<{
  trip: Trip | null;
  films: FilmWithReservedQuantity[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    
    // Get trip details
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (tripError) {
      throw tripError;
    }

    // Get films associated with this trip
    const { data: tripFilms, error: filmsError } = await supabase
      .from("trip_films")
      .select(`
        quantity,
        films (
          id,
          name,
          brand,
          iso,
          format,
          type
        )
      `)
      .eq("trip_id", tripId);

    if (filmsError) {
      throw filmsError;
    }

    const filmsWithReservation: FilmWithReservedQuantity[] = tripFilms?.map(tf => {
      const filmData = tf.films as unknown as {
        id: string;
        name: string;
        brand: string;
        iso: number;
        format: string;
        type: string;
      };
      return {
        id: filmData.id,
        name: filmData.name,
        brand: filmData.brand,
        iso: filmData.iso,
        format: filmData.format,
        type: filmData.type,
        reserved_quantity: tf.quantity 
      };
    }) || [];

    return { 
      trip, 
      films: filmsWithReservation, 
      error: null 
    };
  } catch (error) {
    console.error("Error fetching trip with films:", error);
    return {
      trip: null,
      films: null,
      error: error instanceof Error ? error.message : "Failed to fetch trip details",
    };
  }
}

interface FilmWithAvailability {
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
  notes?: string;
  count?: number;
  total_count: number;
  reserved_quantity: number;
  available_count: number;
}

export async function getFilmsWithAvailability(): Promise<{
  data: FilmWithAvailability[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("films_with_availability")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching films with availability:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Failed to fetch films with availability"),
    };
  }
}

// Gear-related functions for trips

export async function addGearToTrip(
  tripId: string,
  gearId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    
    // Check if this gear is already in the trip
    const { data: existingTripGear } = await supabase
      .from("trip_gear")
      .select("*")
      .eq("trip_id", tripId)
      .eq("gear_id", gearId)
      .single();

    if (existingTripGear) {
      return {
        success: false,
        error: "This gear is already reserved for this trip",
      };
    }

    const tripGear: Omit<TripGear, "id" | "created_at"> = {
      trip_id: tripId,
      gear_id: gearId,
    };

    const { error } = await supabase.from("trip_gear").insert([tripGear]);

    if (error) {
      throw error;
    }

    revalidatePath("/trips");
    revalidatePath("/gear");
    return { success: true };
  } catch (error) {
    console.error("Error adding gear to trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add gear to trip",
    };
  }
}

export async function removeGearFromTrip(
  tripId: string,
  gearId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("trip_gear")
      .delete()
      .eq("trip_id", tripId)
      .eq("gear_id", gearId);

    if (error) {
      throw error;
    }

    revalidatePath("/trips");
    revalidatePath("/gear");
    return { success: true };
  } catch (error) {
    console.error("Error removing gear from trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove gear from trip",
    };
  }
}

interface GearForTrip {
  id: string;
  name: string;
  brand: string;
  type: string;
  model?: string;
}

export async function getTripWithGear(tripId: string): Promise<{
  trip: Trip | null;
  gear: GearForTrip[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    
    // Get trip details
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (tripError) {
      throw tripError;
    }

    // Get gear associated with this trip
    const { data: tripGear, error: gearError } = await supabase
      .from("trip_gear")
      .select(`
        gear (
          id,
          name,
          brand,
          type,
          model
        )
      `)
      .eq("trip_id", tripId);

    if (gearError) {
      throw gearError;
    }

    const gearForTrip: GearForTrip[] = tripGear?.map(tg => {
      const gearData = tg.gear as unknown as GearForTrip;
      return gearData;
    }) || [];

    return { 
      trip, 
      gear: gearForTrip, 
      error: null 
    };
  } catch (error) {
    console.error("Error fetching trip with gear:", error);
    return {
      trip: null,
      gear: null,
      error: error instanceof Error ? error.message : "Failed to fetch trip gear details",
    };
  }
}

export async function getAvailableGear(): Promise<{
  data: Gear[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gear")
      .select("*")
      .order("type", { ascending: true })
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching available gear:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Failed to fetch available gear"),
    };
  }
}

export async function updateTripStatus(
  tripId: string,
  status: 'upcoming' | 'past' | 'completed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // If marking trip as completed, consume the films first
    if (status === 'completed') {
      const consumeResult = await consumeTripFilms(tripId);
      if (!consumeResult.success) {
        return {
          success: false,
          error: `Failed to consume films: ${consumeResult.error}`,
        };
      }
    }

    const { error } = await supabase
      .from("trips")
      .update({ status })
      .eq("id", tripId);

    if (error) {
      throw error;
    }

    revalidatePath("/trips");
    revalidatePath("/films");
    return { success: true };
  } catch (error) {
    console.error("Error updating trip status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update trip status",
    };
  }
}

export async function consumePastTripFilms(): Promise<{ success: boolean; consumed: number; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Get all past trips that are not completed
    const today = new Date();
    const bufferDate = new Date(today);
    bufferDate.setDate(today.getDate() - 1); // 1 day buffer
    
    const { data: pastTrips, error: tripsError } = await supabase
      .from("trips")
      .select("id, title, end_date")
      .neq("status", "completed")
      .lt("end_date", bufferDate.toISOString().split('T')[0]);

    if (tripsError) {
      return { success: false, consumed: 0, error: "Failed to fetch past trips" };
    }

    if (!pastTrips || pastTrips.length === 0) {
      return { success: true, consumed: 0 }; // No past trips to process
    }

    let totalConsumed = 0;

    // Process each past trip
    for (const trip of pastTrips) {
      const consumeResult = await consumeTripFilms(trip.id);
      if (consumeResult.success) {
        // Update trip status to completed
        await supabase
          .from("trips")
          .update({ status: "completed" })
          .eq("id", trip.id);
        totalConsumed++;
      }
    }

    revalidatePath("/trips");
    revalidatePath("/films");
    return { success: true, consumed: totalConsumed };
  } catch (error) {
    console.error("Error consuming past trip films:", error);
    return {
      success: false,
      consumed: 0,
      error: error instanceof Error ? error.message : "Failed to consume past trip films",
    };
  }
}

async function consumeTripFilms(tripId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Get trip details
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("title")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      return { success: false, error: "Trip not found" };
    }

    // Get all films reserved for this trip
    const { data: tripFilms, error: filmsError } = await supabase
      .from("trip_films")
      .select("film_id, quantity")
      .eq("trip_id", tripId);

    if (filmsError) {
      return { success: false, error: "Failed to fetch trip films" };
    }

    if (!tripFilms || tripFilms.length === 0) {
      return { success: true }; // No films to consume
    }

    // Check if films have already been consumed for this trip
    const { data: existingUsage, error: usageError } = await supabase
      .from("film_usage")
      .select("film_id")
      .like("usage_note", `%Trip: ${trip.title}%`);

    if (usageError) {
      return { success: false, error: "Failed to check existing usage" };
    }

    const alreadyConsumedFilmIds = new Set(existingUsage?.map(usage => usage.film_id) || []);

    // Consume each film that hasn't already been consumed
    for (const tripFilm of tripFilms) {
      if (alreadyConsumedFilmIds.has(tripFilm.film_id)) {
        continue; // Skip films already consumed for this trip
      }

      const result = await reduceFilmCount(
        tripFilm.film_id,
        tripFilm.quantity,
        `Trip: ${trip.title} (completed)`
      );

      if (result.error) {
        return { 
          success: false, 
          error: `Failed to consume film: ${result.error}` 
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error consuming trip films:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to consume trip films",
    };
  }
}