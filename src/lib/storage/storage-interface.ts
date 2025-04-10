import { Film } from "@/lib/utils";

export interface StorageInterface {
  getAllFilms(): Promise<Film[]>;
  getFilmById(id: string): Promise<Film | null>;
  createFilm(film: Film): Promise<Film>;
  updateFilm(id: string, film: Film): Promise<Film>;
  deleteFilm(id: string): Promise<void>;
  getUnsyncedFilms(): Promise<Film[]>;
  markFilmAsSynced(id: string): Promise<void>;
  setAllFilms(films: Film[]): Promise<void>;
}

export interface StorageMetadata {
  localUpdatedAt: number;
  synced: boolean;
}

export type FilmWithMetadata = Film & StorageMetadata;
