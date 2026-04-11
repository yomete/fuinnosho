import type { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import type { Film, FilmUsage } from "@/lib/films/types";
import { type FilmSchema, filmSchema, getExposuresPerRoll } from "@/lib/films/schema";
import {
  deleteFilmById,
  insertFilm,
  insertFilmUsage,
  listDeletedFilmsByUser,
  listFilmsByUser,
  restoreFilmById,
  selectBulkFilmState,
  selectBulkRollState,
  selectFilmById,
  selectFilmCountState,
  selectFilmForTripReservations,
  selectFilmUsageHistory,
  softDeleteFilmById,
  updateFilmById,
} from "@/lib/films/repository";

interface TripSummary {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "upcoming" | "ongoing" | "past" | "completed";
}

export interface TripFilmReservation {
  quantity: number;
  created_at: string;
  trips: TripSummary | null;
}

function toOptionalNumber(value: number | null | undefined) {
  return value !== undefined && value !== null ? Number(value) : undefined;
}

export function normalizeFilmInput(data: FilmSchema) {
  const validatedData = filmSchema.parse(data);

  return {
    ...validatedData,
    iso: Number(validatedData.iso),
    price: toOptionalNumber(validatedData.price),
    count: toOptionalNumber(validatedData.count),
    bulk_length_meters: toOptionalNumber(validatedData.bulk_length_meters),
    bulk_quantity: toOptionalNumber(validatedData.bulk_quantity),
    bulk_rolls_used: toOptionalNumber(validatedData.bulk_rolls_used),
    calculated_rolls: toOptionalNumber(validatedData.calculated_rolls),
    bulk_remaining_exposures: toOptionalNumber(
      validatedData.bulk_remaining_exposures
    ),
    spooled_cassettes: toOptionalNumber(validatedData.spooled_cassettes),
  };
}

export function buildFilmRecord(
  userId: string | undefined,
  data: FilmSchema,
  options?: { id?: string; timestamp?: string }
): Film {
  const normalizedData = normalizeFilmInput(data);
  const timestamp = options?.timestamp ?? new Date().toISOString();

  return {
    ...normalizedData,
    id: options?.id ?? uuidv4(),
    created_at: timestamp,
    updated_at: timestamp,
    ...(userId ? { user_id: userId } : {}),
    bulk_remaining_exposures: normalizedData.is_bulk_film
      ? normalizedData.bulk_remaining_exposures !== undefined
        ? normalizedData.bulk_remaining_exposures
        : Number(normalizedData.calculated_rolls || 0) *
          getExposuresPerRoll(normalizedData.format)
      : undefined,
    spooled_cassettes: normalizedData.is_bulk_film
      ? normalizedData.spooled_cassettes ?? 0
      : undefined,
  };
}

export async function createFilmForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  data: FilmSchema
) {
  const film = buildFilmRecord(userId, data);
  const { error } = await insertFilm(supabase, film);

  if (error) {
    throw error;
  }

  return film;
}

export async function updateFilmForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string,
  data: FilmSchema
) {
  const processedData = normalizeFilmInput(data);
  const { error } = await updateFilmById(supabase, filmId, processedData, userId);

  if (error) {
    throw error;
  }

  const { data: updatedFilm, error: fetchError } = await selectFilmById(
    supabase,
    filmId,
    userId,
    true
  );

  if (fetchError) {
    throw fetchError;
  }

  return updatedFilm;
}

export async function getFilmsForUser(
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await listFilmsByUser(supabase, userId);

  if (error) {
    throw error;
  }

  return data;
}

export async function getDeletedFilmsForUser(
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await listDeletedFilmsByUser(supabase, userId);

  if (error) {
    throw error;
  }

  return data;
}

export async function getFilmByIdForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string
) {
  const { data, error } = await selectFilmById(supabase, filmId, userId);

  if (error) {
    throw error;
  }

  return data;
}

export async function getFilmDetailsForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string
): Promise<{
  film: Film | null;
  usage: FilmUsage[];
  trips: TripFilmReservation[];
}> {
  const { data: film, error: filmError } = await selectFilmById(
    supabase,
    filmId,
    userId
  );

  if (filmError) {
    throw filmError;
  }

  const { data: usage, error: usageError } = await selectFilmUsageHistory(
    supabase,
    filmId
  );

  if (usageError) {
    console.warn("Error fetching usage history:", usageError);
  }

  const { data: trips, error: tripsError } = await selectFilmForTripReservations(
    supabase,
    filmId
  );

  if (tripsError) {
    console.warn("Error fetching trips:", tripsError);
  }

  return {
    film,
    usage: usage || [],
    trips: (trips || []) as unknown as TripFilmReservation[],
  };
}

export async function softDeleteFilmForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string
) {
  const { error } = await softDeleteFilmById(supabase, filmId, userId);

  if (error) {
    throw error;
  }
}

export async function restoreFilmForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string
) {
  const { error } = await restoreFilmById(supabase, filmId, userId);

  if (error) {
    throw error;
  }
}

export async function permanentlyDeleteFilmForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string
) {
  const { error } = await deleteFilmById(supabase, filmId, userId);

  if (error) {
    throw error;
  }
}

export async function reduceFilmCountForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string,
  quantity: number,
  usageNote: string,
  tripId?: string
) {
  const { data: film, error: filmError } = await selectFilmCountState(
    supabase,
    filmId,
    userId
  );

  if (filmError || !film) {
    return { error: "Film not found" };
  }

  const currentCount = film.count || 0;
  const newCount = Math.max(0, currentCount - quantity);
  const updateData = film.is_bulk_film
    ? {
        count: newCount,
        spooled_cassettes: Math.max(0, (film.spooled_cassettes || 0) - quantity),
      }
    : { count: newCount };

  const { error: updateError } = await updateFilmById(
    supabase,
    filmId,
    updateData,
    userId
  );

  if (updateError) {
    return { error: updateError.message };
  }

  const { error: usageError } = await insertFilmUsage(supabase, {
    film_id: filmId,
    quantity,
    usage_note: usageNote,
    usage_type: "shoot",
    ...(tripId ? { trip_id: tripId } : {}),
  });

  if (usageError) {
    return { error: `Failed to record usage: ${usageError.message}` };
  }

  return { success: true, newCount };
}

export async function spoolBulkFilmForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string,
  exposuresToSpool: number,
  cassettesCreated: number,
  spoolNote: string
) {
  const { data: film, error: filmError } = await selectBulkFilmState(
    supabase,
    filmId,
    userId
  );

  if (filmError || !film) {
    return { error: "Film not found" };
  }

  if (!film.is_bulk_film) {
    return { error: "This is not a bulk film" };
  }

  const currentRemainingExposures = film.bulk_remaining_exposures || 0;
  const currentSpooledCassettes = film.spooled_cassettes || 0;

  if (exposuresToSpool > currentRemainingExposures) {
    return { error: "Not enough bulk film remaining" };
  }

  const newRemainingExposures = currentRemainingExposures - exposuresToSpool;
  const newSpooledCassettes = currentSpooledCassettes + cassettesCreated;

  const { error: updateError } = await updateFilmById(
    supabase,
    filmId,
    {
      bulk_remaining_exposures: newRemainingExposures,
      spooled_cassettes: newSpooledCassettes,
      count: newSpooledCassettes,
    },
    userId
  );

  if (updateError) {
    return { error: updateError.message };
  }

  const { error: usageError } = await insertFilmUsage(supabase, {
    film_id: filmId,
    quantity: cassettesCreated,
    usage_note: spoolNote,
    usage_type: "spool",
    exposures_used: exposuresToSpool,
  });

  if (usageError) {
    return { error: "Failed to record spooling" };
  }

  return {
    success: true,
    remainingExposures: newRemainingExposures,
    spooledCassettes: newSpooledCassettes,
  };
}

export async function getFilmUsageHistoryForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string
) {
  const { data: film, error: filmError } = await selectFilmById(
    supabase,
    filmId,
    userId,
    true
  );

  if (filmError || !film) {
    return { data: null, error: "Film not found" };
  }

  const { data, error } = await selectFilmUsageHistory(supabase, filmId);

  if (error) {
    throw error;
  }

  return { data, error: null };
}

export async function finishBulkRollForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string
) {
  const { data: film, error: filmError } = await selectBulkRollState(
    supabase,
    filmId,
    userId
  );

  if (filmError || !film) {
    return { error: "Film not found" };
  }

  if (!film.is_bulk_film) {
    return { error: "This is not a bulk film" };
  }

  const currentRollsUsed = film.bulk_rolls_used || 0;
  const totalRolls = film.bulk_quantity || 0;

  if (currentRollsUsed >= totalRolls) {
    return { error: "All bulk rolls have been used" };
  }

  const newRollsUsed = currentRollsUsed + 1;
  const { error: updateError } = await updateFilmById(
    supabase,
    filmId,
    { bulk_rolls_used: newRollsUsed },
    userId
  );

  if (updateError) {
    return { error: updateError.message };
  }

  return {
    success: true,
    bulk_rolls_used: newRollsUsed,
    bulk_rolls_remaining: totalRolls - newRollsUsed,
  };
}

export async function addRollsToFilmForUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  filmId: string,
  quantity: number,
  notes?: string
) {
  if (quantity <= 0) {
    throw new Error("Quantity must be positive");
  }

  const { error: usageError } = await insertFilmUsage(supabase, {
    film_id: filmId,
    quantity,
    usage_type: "add",
    usage_note: notes || `Added ${quantity} roll${quantity > 1 ? "s" : ""}`,
  });

  if (usageError) {
    throw usageError;
  }

  const { data: currentFilm, error: fetchError } = await selectFilmCountState(
    supabase,
    filmId,
    userId
  );

  if (fetchError || !currentFilm) {
    throw fetchError || new Error("Film not found");
  }

  const newCount = (currentFilm.count || 0) + quantity;
  const { error: updateError } = await updateFilmById(
    supabase,
    filmId,
    { count: newCount },
    userId
  );

  if (updateError) {
    throw updateError;
  }

  return { success: true };
}
