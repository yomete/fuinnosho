"use server";

import { Film } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { FilmSchema, filmSchema } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

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
    // Validate the data
    const validatedData = filmSchema.parse(data);

    // Convert number fields from string to number if needed
    const processedData = {
      ...validatedData,
      iso: Number(validatedData.iso),
      price: validatedData.price ? Number(validatedData.price) : undefined,
      count: validatedData.count ? Number(validatedData.count) : undefined,
    };

    // Create the updated film
    const updatedFilm: Film = {
      id,
      barcode: `FUIN-${id.substring(0, 8)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...processedData,
    };

    // Update in Supabase
    const supabase = await createClient();
    const { error } = await supabase
      .from("films")
      .update(updatedFilm)
      .eq("id", id);

    if (error) {
      throw error;
    }

    return { success: true, film: updatedFilm };
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
    const validatedData = filmSchema.parse(data);

    // Generate a unique ID for the film
    const filmId = uuidv4();

    // Create film with ID and timestamp
    const newFilm: Film = {
      ...validatedData,
      id: filmId,
      barcode: `FUIN-${filmId.substring(0, 8)}`, // Generate a simple barcode
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      iso: Number(validatedData.iso),
      price: validatedData.price ? Number(validatedData.price) : undefined,
      count: validatedData.count ? Number(validatedData.count) : undefined,
    };

    // Save to Supabase
    const supabase = await createClient();
    const { error } = await supabase.from("films").insert([newFilm]);

    if (error) {
      throw error;
    }

    return { success: true, film: newFilm };
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("films")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("films")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching film by ID:", error);
    return null;
  }
}

export async function deleteFilm(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: Error;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("films").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return { success: true, message: "Film deleted successfully" };
  } catch (error) {
    console.error("Error deleting film:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to delete film"),
    };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function syncFilms() {
  try {
    const supabase = await createClient();

    // Get all films from Supabase
    const { data: cloudFilms, error: fetchError } = await supabase
      .from("films")
      .select("*");

    if (fetchError) {
      throw new Error("Failed to fetch films from cloud");
    }

    // Return the cloud films to be handled by the client
    return {
      success: true,
      films: cloudFilms || [],
    };
  } catch (error) {
    console.error("Error syncing films:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync films",
    };
  }
}
