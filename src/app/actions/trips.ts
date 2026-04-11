"use server";

import { getEffectiveUser, getDataClient } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Trip } from "@/lib/trips/types";
import type { TripSchema } from "@/lib/trips/schema";
import type { Gear } from "@/lib/gear/types";
import {
  type FilmWithAvailability,
  type FilmWithReservedQuantity,
  addFilmToTripForUser,
  consumePastTripFilmsForUser,
  getFilmsWithAvailabilityForUser,
  getTripByIdForUser,
  getTripWithFilmsForUser,
  getTripsForUser,
  removeFilmFromTripForUser,
  updateFilmQuantityInTripForUser,
  updateTripStatusForUser,
  createTripForUser,
  updateTripForUser,
  deleteTripForUser,
} from "@/lib/trips/service";
import {
  getGearForUser,
  getTripWithGearForUser,
  removeGearReservationForUser,
  reserveGearForTripForUser,
} from "@/lib/gear/service";
import { reduceFilmCount } from "./films";

interface CreateTripResponse {
  success: boolean;
  error?: string;
  trip?: Trip | null;
}

export async function createTrip(data: TripSchema): Promise<CreateTripResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const trip = await createTripForUser(supabase, userId, data);

    revalidatePath("/trips");
    return { success: true, trip };
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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const trip = await updateTripForUser(supabase, userId, id, data);

    revalidatePath("/trips");
    return { success: true, trip };
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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const data = await getTripsForUser(supabase, userId);

    return { data, error: null };
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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    return await getTripByIdForUser(supabase, userId, id);
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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    await deleteTripForUser(supabase, userId, id);

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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    await addFilmToTripForUser(supabase, userId, tripId, filmId, quantity);

    revalidatePath("/trips");
    revalidatePath("/films");
    return { success: true };
  } catch (error) {
    console.error("Error adding film to trip:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add film to trip",
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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    await updateFilmQuantityInTripForUser(
      supabase,
      userId,
      tripId,
      filmId,
      newQuantity
    );

    revalidatePath("/trips");
    revalidatePath("/films");
    return { success: true };
  } catch (error) {
    console.error("Error updating film quantity in trip:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update film quantity",
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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    await removeFilmFromTripForUser(supabase, userId, tripId, filmId);

    revalidatePath("/trips");
    revalidatePath("/films");
    return { success: true };
  } catch (error) {
    console.error("Error removing film from trip:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove film from trip",
    };
  }
}

export async function getTripWithFilms(tripId: string): Promise<{
  trip: Trip | null;
  films: FilmWithReservedQuantity[] | null;
  error: string | null;
}> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const { trip, films } = await getTripWithFilmsForUser(supabase, userId, tripId);

    return { trip, films, error: null };
  } catch (error) {
    console.error("Error fetching trip with films:", error);
    return {
      trip: null,
      films: null,
      error:
        error instanceof Error ? error.message : "Failed to fetch trip details",
    };
  }
}

export async function getFilmsWithAvailability(): Promise<{
  data: FilmWithAvailability[] | null;
  error: Error | null;
}> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const data = await getFilmsWithAvailabilityForUser(supabase, userId);

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching films with availability:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to fetch films with availability"),
    };
  }
}

export async function addGearToTrip(
  tripId: string,
  gearId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    await reserveGearForTripForUser(supabase, userId, tripId, gearId);

    revalidatePath("/trips");
    revalidatePath("/gear");
    return { success: true };
  } catch (error) {
    console.error("Error adding gear to trip:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add gear to trip",
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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    await removeGearReservationForUser(supabase, userId, tripId, gearId);

    revalidatePath("/trips");
    revalidatePath("/gear");
    return { success: true };
  } catch (error) {
    console.error("Error removing gear from trip:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove gear from trip",
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
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const { trip, gear: tripGear } = await getTripWithGearForUser(
      supabase,
      userId,
      tripId
    );

    return {
      trip,
      gear: tripGear.map((item) => item.gear as GearForTrip),
      error: null,
    };
  } catch (error) {
    console.error("Error fetching trip with gear:", error);
    return {
      trip: null,
      gear: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch trip gear details",
    };
  }
}

export async function getAvailableGear(): Promise<{
  data: Gear[] | null;
  error: Error | null;
}> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const data = await getGearForUser(supabase, userId);

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
  status: "upcoming" | "past" | "completed"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const result = await updateTripStatusForUser(
      supabase,
      userId,
      tripId,
      status,
      reduceFilmCount
    );

    revalidatePath("/trips");
    revalidatePath("/films");
    return result;
  } catch (error) {
    console.error("Error updating trip status:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update trip status",
    };
  }
}

export async function consumePastTripFilms(): Promise<{
  success: boolean;
  consumed: number;
  error?: string;
}> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const result = await consumePastTripFilmsForUser(
      supabase,
      userId,
      reduceFilmCount
    );

    revalidatePath("/trips");
    revalidatePath("/films");
    return result;
  } catch (error) {
    console.error("Error consuming past trip films:", error);
    return {
      success: false,
      consumed: 0,
      error:
        error instanceof Error
          ? error.message
          : "Failed to consume past trip films",
    };
  }
}
