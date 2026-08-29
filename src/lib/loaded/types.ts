export type UnloadOutcome = "shot" | "unused";

export interface LoadedFilm {
  id: string;
  camera_id: string;
  film_id: string;
  user_id: string;
  shot_at_iso?: number | null;
  notes?: string | null;
  loaded_at: string;
  unloaded_at?: string | null;
  outcome?: UnloadOutcome | null;
  created_at: string;
  updated_at: string;
}

export interface LoadedCameraSummary {
  id: string;
  name: string;
  brand: string;
  model?: string | null;
}

export interface LoadedFilmSummary {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  expiration_date?: string | null;
  is_bulk_film?: boolean | null;
}

/** A loaded roll joined with the camera it sits in and the film stock it came from. */
export interface LoadedFilmEntry extends LoadedFilm {
  camera: LoadedCameraSummary | null;
  film: LoadedFilmSummary | null;
}

/** A camera that is free to take a roll, or the roll currently in it. */
export interface CameraLoadState {
  camera: LoadedCameraSummary;
  loaded: LoadedFilmEntry | null;
}

/** Last EI a given film stock was shot at, keyed by film id. */
export type EiPrefills = Record<string, number>;
