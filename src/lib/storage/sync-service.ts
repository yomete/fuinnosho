import { storageFactory } from "./storage-factory";
import { Film } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

class SyncService {
  private static instance: SyncService;
  private supabase = createClient();

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async syncToCloud(): Promise<{
    success: boolean;
    error?: string;
    syncedCount?: number;
  }> {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          error: "You must be logged in to sync with the cloud",
        };
      }

      const localStorage = storageFactory.getLocalStorage();
      const cloudStorage = storageFactory.getCloudStorage();

      // Get all unsynced films
      const unsyncedFilms = await localStorage.getUnsyncedFilms();
      let syncedCount = 0;

      // Sync each film
      for (const film of unsyncedFilms) {
        try {
          // Check if film exists in cloud
          const existingFilm = await cloudStorage.getFilmById(film.id);

          if (existingFilm) {
            // Update existing film
            await cloudStorage.updateFilm(film.id, film);
          } else {
            // Create new film
            await cloudStorage.createFilm(film);
          }

          // Mark as synced in local storage
          await localStorage.markFilmAsSynced(film.id);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync film ${film.id}:`, error);
          // Continue with other films even if one fails
        }
      }

      return {
        success: true,
        syncedCount,
      };
    } catch (error) {
      console.error("Sync error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to sync with cloud",
      };
    }
  }

  async syncFromCloud(): Promise<{
    success: boolean;
    error?: string;
    syncedCount?: number;
  }> {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          error: "You must be logged in to sync with the cloud",
        };
      }

      const localStorage = storageFactory.getLocalStorage();
      const cloudStorage = storageFactory.getCloudStorage();

      // Get all films from cloud
      const cloudFilms = await cloudStorage.getAllFilms();
      let syncedCount = 0;

      // Sync each film to local storage
      for (const film of cloudFilms) {
        try {
          const localFilm = await localStorage.getFilmById(film.id);

          if (localFilm) {
            // Update local film if cloud version is newer
            if (new Date(film.updated_at) > new Date(localFilm.updated_at)) {
              await localStorage.updateFilm(film.id, film);
              syncedCount++;
            }
          } else {
            // Create new film in local storage
            await localStorage.createFilm(film);
            syncedCount++;
          }
        } catch (error) {
          console.error(`Failed to sync film ${film.id}:`, error);
          // Continue with other films even if one fails
        }
      }

      return {
        success: true,
        syncedCount,
      };
    } catch (error) {
      console.error("Sync error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to sync from cloud",
      };
    }
  }
}

export const syncService = SyncService.getInstance();
