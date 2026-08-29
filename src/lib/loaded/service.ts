import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoadFilmSchema, UnloadFilmSchema } from "@/lib/loaded/schema";
import type {
  CameraLoadState,
  EiPrefills,
  LoadedCameraSummary,
  LoadedFilmEntry,
} from "@/lib/loaded/types";
import {
  insertLoadedFilm,
  listActiveLoadedFilmsByUser,
  listCamerasByUser,
  listShotAtIsoHistoryByUser,
  markLoadedFilmUnloaded,
  revertLoadedFilmUnload,
  selectActiveLoadForCamera,
  selectCameraById,
  selectLoadedFilmById,
} from "@/lib/loaded/repository";
import { listFilmsWithAvailabilityByUser } from "@/lib/trips/repository";
import { reduceFilmCountForUser } from "@/lib/films/service";

export interface FilmAvailableForLoading {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  expiration_date: string;
  is_bulk_film: boolean;
  available_count: number;
}

export async function getLoadedFilmsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<LoadedFilmEntry[]> {
  const { data, error } = await listActiveLoadedFilmsByUser(supabase, userId);

  if (error) {
    throw error;
  }

  return (data as LoadedFilmEntry[] | null) ?? [];
}

/**
 * Films that can go into a camera right now. `available_count` already nets out
 * trip reservations and rolls loaded in other cameras, and resolves to spooled
 * cassettes for bulk film, so one filter covers every case.
 */
export async function getFilmsAvailableForLoadingForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<FilmAvailableForLoading[]> {
  const { data, error } = await listFilmsWithAvailabilityByUser(supabase, userId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as (FilmAvailableForLoading & { deleted_at?: string | null })[])
    .filter((film) => !film.deleted_at && (film.available_count ?? 0) > 0)
    .map((film) => ({
      id: film.id,
      name: film.name,
      brand: film.brand,
      iso: film.iso,
      format: film.format,
      type: film.type,
      expiration_date: film.expiration_date,
      is_bulk_film: Boolean(film.is_bulk_film),
      available_count: film.available_count,
    }));
}

/** Cameras paired with whatever is currently loaded in them. */
export async function getCameraLoadStatesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<CameraLoadState[]> {
  const [{ data: cameras, error: camerasError }, loaded] = await Promise.all([
    listCamerasByUser(supabase, userId),
    getLoadedFilmsForUser(supabase, userId),
  ]);

  if (camerasError) {
    throw camerasError;
  }

  const loadedByCamera = new Map(loaded.map((entry) => [entry.camera_id, entry]));

  return ((cameras ?? []) as LoadedCameraSummary[]).map((camera) => ({
    camera,
    loaded: loadedByCamera.get(camera.id) ?? null,
  }));
}

/**
 * The EI each film stock was last loaded at, so loading it again can prefill
 * the same value (e.g. Ultra 400 always shot at 800).
 */
export async function getEiPrefillsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<EiPrefills> {
  const { data, error } = await listShotAtIsoHistoryByUser(supabase, userId);

  if (error) {
    throw error;
  }

  const prefills: EiPrefills = {};

  // Rows arrive newest first, so the first entry per film wins.
  for (const row of (data ?? []) as { film_id: string; shot_at_iso: number }[]) {
    if (prefills[row.film_id] === undefined && row.shot_at_iso) {
      prefills[row.film_id] = row.shot_at_iso;
    }
  }

  return prefills;
}

export async function loadFilmIntoCameraForUser(
  supabase: SupabaseClient,
  userId: string,
  data: LoadFilmSchema
): Promise<LoadedFilmEntry> {
  const { data: camera, error: cameraError } = await selectCameraById(
    supabase,
    data.camera_id,
    userId
  );

  if (cameraError || !camera) {
    throw new Error("Camera not found");
  }

  if (camera.type !== "camera") {
    throw new Error("Film can only be loaded into a camera");
  }

  const { data: existing } = await selectActiveLoadForCamera(
    supabase,
    data.camera_id,
    userId
  );

  if (existing) {
    throw new Error(
      `${camera.brand} ${camera.name} already has a roll loaded. Finish that one first.`
    );
  }

  const availableFilms = await getFilmsAvailableForLoadingForUser(supabase, userId);
  const film = availableFilms.find((entry) => entry.id === data.film_id);

  if (!film) {
    throw new Error(
      "That film has no rolls available — it may be reserved for a trip or already loaded in another camera"
    );
  }

  const { data: inserted, error: insertError } = await insertLoadedFilm(supabase, {
    camera_id: data.camera_id,
    film_id: data.film_id,
    user_id: userId,
    shot_at_iso: data.shot_at_iso ?? null,
    notes: data.notes ?? null,
  });

  if (insertError || !inserted) {
    throw insertError ?? new Error("Failed to load film");
  }

  return inserted as LoadedFilmEntry;
}

function buildUsageNote(entry: LoadedFilmEntry): string {
  const cameraLabel = entry.camera
    ? `${entry.camera.brand} ${entry.camera.name}`.trim()
    : "a camera";

  const parts = [`Shot in ${cameraLabel}`];

  if (entry.shot_at_iso && entry.shot_at_iso !== entry.film?.iso) {
    parts.push(`@ EI ${entry.shot_at_iso}`);
  }

  const note = [parts.join(" ")];

  if (entry.notes) {
    note.push(entry.notes);
  }

  return note.join(" — ");
}

export async function unloadFilmForUser(
  supabase: SupabaseClient,
  userId: string,
  loadedId: string,
  data: UnloadFilmSchema
): Promise<LoadedFilmEntry> {
  const { data: entry, error: entryError } = await selectLoadedFilmById(
    supabase,
    loadedId,
    userId
  );

  if (entryError || !entry) {
    throw new Error("Loaded roll not found");
  }

  const loadedEntry = entry as LoadedFilmEntry;

  if (loadedEntry.unloaded_at) {
    throw new Error("That roll has already been unloaded");
  }

  // Release the hold first, then consume stock. Doing it in this order means a
  // failed stock update can be rolled back to the loaded state, so the roll is
  // never both released and unconsumed.
  const { data: unloaded, error: unloadError } = await markLoadedFilmUnloaded(
    supabase,
    loadedId,
    userId,
    data.outcome
  );

  if (unloadError) {
    throw unloadError;
  }

  if (!unloaded) {
    throw new Error("That roll has already been unloaded");
  }

  if (data.outcome === "shot") {
    const result = await reduceFilmCountForUser(
      supabase,
      userId,
      loadedEntry.film_id,
      1,
      buildUsageNote(loadedEntry),
      data.trip_id
    );

    if (result?.error) {
      await revertLoadedFilmUnload(supabase, loadedId, userId);
      throw new Error(result.error);
    }
  }

  return {
    ...loadedEntry,
    unloaded_at: new Date().toISOString(),
    outcome: data.outcome,
  };
}
