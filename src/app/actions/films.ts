"use server";

import type { Film, FilmUsage } from "@/lib/films/types";
import type { FilmSchema } from "@/lib/films/schema";
import type { TripFilmReservation } from "@/lib/films/service";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveUser, getDataClient } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  addRollsToFilmForUser,
  createFilmForUser,
  finishBulkRollForUser,
  getDeletedFilmsForUser,
  getFilmByIdForUser,
  getFilmDetailsForUser,
  getFilmUsageHistoryForUser,
  getFilmsForUser,
  permanentlyDeleteFilmForUser,
  reduceFilmCountForUser,
  restoreFilmForUser,
  softDeleteFilmForUser,
  spoolBulkFilmForUser,
  updateFilmForUser,
} from "@/lib/films/service";

interface CreateFilmResponse {
  success: boolean;
  error?: string;
  film?: Film;
}

export async function editFilm(
  id: string,
  data: FilmSchema
): Promise<CreateFilmResponse> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    const film = await updateFilmForUser(supabase, userId ?? undefined, id, data);

    revalidatePath("/films");
    return { success: true, film };
  } catch (error) {
    console.error("Error editing film:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit film",
    };
  }
}

export async function createFilm(
  data: FilmSchema
): Promise<CreateFilmResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const film = await createFilmForUser(supabase, userId, data);

    return { success: true, film };
  } catch (error) {
    console.error("Error creating film:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create film",
    };
  }
}

export async function getFilms(): Promise<{
  data: Film[] | null;
  error: Error | null;
}> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    const data = await getFilmsForUser(supabase, userId);

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching films:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Failed to fetch films"),
    };
  }
}

export async function getFilmById(id: string): Promise<Film | null> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    return await getFilmByIdForUser(supabase, userId ?? undefined, id);
  } catch (error) {
    console.error("Error fetching film by ID:", error);
    return null;
  }
}

export async function getFilmWithDetails(id: string): Promise<{
  film: Film | null;
  usage: FilmUsage[] | null;
  trips: TripFilmReservation[] | null;
  error: string | null;
}> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    const { film, usage, trips } = await getFilmDetailsForUser(
      supabase,
      userId ?? undefined,
      id
    );

    return {
      film,
      usage,
      trips,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching film details:", error);
    return {
      film: null,
      usage: null,
      trips: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch film details",
    };
  }
}

export async function deleteFilm(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: Error;
}> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    await softDeleteFilmForUser(supabase, userId ?? undefined, id);

    revalidatePath("/films");
    return { success: true, message: "Film moved to trash" };
  } catch (error) {
    console.error("Error deleting film:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to delete film"),
    };
  }
}

export async function restoreFilm(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: Error;
}> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    await restoreFilmForUser(supabase, userId ?? undefined, id);

    revalidatePath("/films");
    return { success: true, message: "Film restored successfully" };
  } catch (error) {
    console.error("Error restoring film:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to restore film"),
    };
  }
}

export async function getDeletedFilms(): Promise<{
  data: Film[] | null;
  error: Error | null;
}> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    const data = await getDeletedFilmsForUser(supabase, userId);

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching deleted films:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to fetch deleted films"),
    };
  }
}

export async function permanentlyDeleteFilm(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: Error;
}> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    await permanentlyDeleteFilmForUser(supabase, userId ?? undefined, id);

    return { success: true, message: "Film permanently deleted" };
  } catch (error) {
    console.error("Error permanently deleting film:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to permanently delete film"),
    };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function reduceFilmCount(
  filmId: string,
  quantity: number,
  usageNote: string,
  tripId?: string
) {
  const { userId } = await getEffectiveUser();
  const supabase = await getDataClient();
  const result = await reduceFilmCountForUser(
    supabase,
    userId ?? undefined,
    filmId,
    quantity,
    usageNote,
    tripId
  );

  revalidatePath("/films");
  return result;
}

export async function spoolBulkFilm(
  filmId: string,
  exposuresToSpool: number,
  cassettesCreated: number,
  spoolNote: string
) {
  const { userId } = await getEffectiveUser();
  const supabase = await getDataClient();
  const result = await spoolBulkFilmForUser(
    supabase,
    userId ?? undefined,
    filmId,
    exposuresToSpool,
    cassettesCreated,
    spoolNote
  );

  revalidatePath("/films");
  return result;
}

export async function getFilmUsageHistory(filmId: string): Promise<{
  data: FilmUsage[] | null;
  error: string | null;
}> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();
    return await getFilmUsageHistoryForUser(supabase, userId ?? undefined, filmId);
  } catch (error) {
    console.error("Error fetching film usage history:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch usage history",
    };
  }
}

export async function finishBulkRoll(filmId: string) {
  const { userId } = await getEffectiveUser();
  const supabase = await getDataClient();
  const result = await finishBulkRollForUser(supabase, userId ?? undefined, filmId);

  revalidatePath("/films");
  revalidatePath(`/film/${filmId}`);
  return result;
}

export async function addRollsToFilm(
  filmId: string,
  quantity: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    await addRollsToFilmForUser(supabase, userId ?? undefined, filmId, quantity, notes);

    revalidatePath("/films");
    revalidatePath(`/films/${filmId}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding rolls to film:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add rolls",
    };
  }
}
