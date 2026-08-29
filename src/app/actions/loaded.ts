"use server";

import { revalidatePath } from "next/cache";
import { getDataClient, getEffectiveUser } from "@/lib/auth";
import type { LoadFilmSchema, UnloadFilmSchema } from "@/lib/loaded/schema";
import type {
  CameraLoadState,
  EiPrefills,
  LoadedFilmEntry,
} from "@/lib/loaded/types";
import {
  getCameraLoadStatesForUser,
  getEiPrefillsForUser,
  getFilmsAvailableForLoadingForUser,
  getLoadedFilmsForUser,
  loadFilmIntoCameraForUser,
  unloadFilmForUser,
  type FilmAvailableForLoading,
} from "@/lib/loaded/service";

interface LoadedFilmResponse {
  success: boolean;
  error?: string;
  loaded?: LoadedFilmEntry;
}

export interface NowBoardData {
  cameras: CameraLoadState[];
  loaded: LoadedFilmEntry[];
  availableFilms: FilmAvailableForLoading[];
  eiPrefills: EiPrefills;
}

function revalidateAffectedPaths() {
  // A loaded roll changes availability, so anything that reads a film count
  // has to be refreshed too.
  revalidatePath("/now");
  revalidatePath("/films");
  revalidatePath("/gear");
  revalidatePath("/trips");
}

export async function getNowBoard(): Promise<{
  success: boolean;
  error?: string;
  data?: NowBoardData;
}> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to view loaded film");
    }

    const supabase = await getDataClient();

    const [cameras, loaded, availableFilms, eiPrefills] = await Promise.all([
      getCameraLoadStatesForUser(supabase, userId),
      getLoadedFilmsForUser(supabase, userId),
      getFilmsAvailableForLoadingForUser(supabase, userId),
      getEiPrefillsForUser(supabase, userId),
    ]);

    return {
      success: true,
      data: { cameras, loaded, availableFilms, eiPrefills },
    };
  } catch (error) {
    console.error("Error loading Now board:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load loaded film",
    };
  }
}

export async function getLoadedFilms(): Promise<{
  success: boolean;
  error?: string;
  loaded?: LoadedFilmEntry[];
}> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to view loaded film");
    }

    const supabase = await getDataClient();
    const loaded = await getLoadedFilmsForUser(supabase, userId);

    return { success: true, loaded };
  } catch (error) {
    console.error("Error fetching loaded films:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch loaded film",
    };
  }
}

export async function loadFilm(
  data: LoadFilmSchema
): Promise<LoadedFilmResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to load film");
    }

    const supabase = await getDataClient();
    const loaded = await loadFilmIntoCameraForUser(supabase, userId, data);

    revalidateAffectedPaths();
    return { success: true, loaded };
  } catch (error) {
    console.error("Error loading film:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load film",
    };
  }
}

export async function unloadFilm(
  loadedId: string,
  data: UnloadFilmSchema
): Promise<LoadedFilmResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to unload film");
    }

    const supabase = await getDataClient();
    const loaded = await unloadFilmForUser(supabase, userId, loadedId, data);

    revalidateAffectedPaths();
    return { success: true, loaded };
  } catch (error) {
    console.error("Error unloading film:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unload film",
    };
  }
}
