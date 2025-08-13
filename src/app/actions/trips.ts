"use server";

import { Trip, TripFilm, TripGear, Gear, TripSchema, tripSchema } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

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
      .order("trip_date", { ascending: true });

    if (error) {
      throw error;
    }

    // Calculate total reserved film count for each trip
    const tripsWithCounts = data?.map(trip => {
      const tripFilms = trip.trip_films as { quantity: number }[] | null;
      const reserved_film_count = tripFilms?.reduce((total, tf) => total + tf.quantity, 0) || 0;
      
      // Remove trip_films from the final object and add reserved_film_count
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { trip_films, ...tripData } = trip;
      return {
        ...tripData,
        reserved_film_count
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