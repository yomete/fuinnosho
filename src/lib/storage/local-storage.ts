"use client";

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Film } from "@/lib/utils";

interface FilmDB extends DBSchema {
  films: {
    key: string;
    value: Film & {
      localUpdatedAt: number;
      synced: boolean;
    };
    indexes: {
      "by-name": string;
      "by-created-at": number;
      "by-local-updated-at": number;
    };
  };
}

class LocalStorageService {
  private db: IDBPDatabase<FilmDB> | null = null;
  private static instance: LocalStorageService;

  private constructor() {
    if (typeof window === "undefined") {
      throw new Error("LocalStorageService can only be used in the browser");
    }
  }

  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  async initialize() {
    if (this.db) return;
    if (typeof window === "undefined") return;

    this.db = await openDB<FilmDB>("fuinnosho-db", 1, {
      upgrade(db) {
        const filmStore = db.createObjectStore("films", {
          keyPath: "id",
        });

        filmStore.createIndex("by-name", "name");
        filmStore.createIndex("by-created-at", "created_at");
        filmStore.createIndex("by-local-updated-at", "localUpdatedAt");
      },
    });
  }

  async getAllFilms(): Promise<Film[]> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    const films = await this.db.getAll("films");
    return films.map(
      ({ localUpdatedAt: _localUpdatedAt, synced: _synced, ...film }) => film // eslint-disable-line @typescript-eslint/no-unused-vars
    );
  }

  async getFilmById(id: string): Promise<Film | null> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    const film = await this.db.get("films", id);
    if (!film) return null;

    const {
      localUpdatedAt: _localUpdatedAt, // eslint-disable-line @typescript-eslint/no-unused-vars
      synced: _synced, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...filmData
    } = film;
    return filmData;
  }

  async createFilm(film: Film): Promise<Film> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    const filmWithMetadata = {
      ...film,
      localUpdatedAt: Date.now(),
      synced: false,
    };

    await this.db.add("films", filmWithMetadata);
    const {
      localUpdatedAt: _localUpdatedAt, // eslint-disable-line @typescript-eslint/no-unused-vars
      synced: _synced, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...filmData
    } = filmWithMetadata;
    return filmData;
  }

  async updateFilm(id: string, film: Film): Promise<Film> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    const filmWithMetadata = {
      ...film,
      localUpdatedAt: Date.now(),
      synced: false,
    };

    await this.db.put("films", filmWithMetadata);
    const {
      localUpdatedAt: _localUpdatedAt, // eslint-disable-line @typescript-eslint/no-unused-vars
      synced: _synced, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...filmData
    } = filmWithMetadata;
    return filmData;
  }

  async deleteFilm(id: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    await this.db.delete("films", id);
  }

  async getUnsyncedFilms(): Promise<Film[]> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    const films = await this.db.getAllFromIndex("films", "by-local-updated-at");
    return films
      .filter((film) => !film.synced)
      .map(
        ({ localUpdatedAt: _localUpdatedAt, synced: _synced, ...film }) => film // eslint-disable-line @typescript-eslint/no-unused-vars
      );
  }

  async markFilmAsSynced(id: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    const film = await this.db.get("films", id);
    if (!film) throw new Error("Film not found");

    await this.db.put("films", {
      ...film,
      synced: true,
    });
  }

  async setAllFilms(films: Film[]): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    // Clear existing films
    const tx = this.db.transaction("films", "readwrite");
    await tx.store.clear();

    // Add all films with metadata
    const filmsWithMetadata = films.map((film) => ({
      ...film,
      localUpdatedAt: Date.now(),
      synced: true,
    }));

    for (const film of filmsWithMetadata) {
      await tx.store.add(film);
    }

    await tx.done;
  }
}

export const localStorage = LocalStorageService.getInstance();
