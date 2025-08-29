import { StorageInterface } from "./storage-interface";
import { localStorage } from "./local-storage";
import { createClient } from "@/lib/supabase/client";
import { Film } from "@/lib/utils";

class CloudStorage implements StorageInterface {
  private supabase = createClient();

  async getAllFilms() {
    const { data, error } = await this.supabase
      .from("films")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getFilmById(id: string) {
    const { data, error } = await this.supabase
      .from("films")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) throw error;
    return data;
  }

  async createFilm(film: Film) {
    const { data, error } = await this.supabase
      .from("films")
      .insert([film])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFilm(id: string, film: Film) {
    const { data, error } = await this.supabase
      .from("films")
      .update(film)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFilm(id: string) {
    // Soft delete: set deleted_at timestamp instead of hard delete
    const { error } = await this.supabase
      .from("films")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }

  async getUnsyncedFilms() {
    // This is a no-op for cloud storage as everything is synced
    return [];
  }

  async markFilmAsSynced() {
    // This is a no-op for cloud storage as everything is synced
  }

  async setAllFilms(films: Film[]): Promise<void> {
    const { error } = await this.supabase
      .from("films")
      .upsert(films, { onConflict: "id" });

    if (error) throw error;
  }
}

class StorageFactory {
  private static instance: StorageFactory;
  private localStorage: StorageInterface;
  private cloudStorage: StorageInterface;

  private constructor() {
    this.localStorage = localStorage;
    this.cloudStorage = new CloudStorage();
  }

  static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  getLocalStorage(): StorageInterface {
    return this.localStorage;
  }

  getCloudStorage(): StorageInterface {
    return this.cloudStorage;
  }
}

export const storageFactory = StorageFactory.getInstance();
