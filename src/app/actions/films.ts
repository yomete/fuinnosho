"use server";

import { Film, FilmUsage } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { FilmSchema, filmSchema } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

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
      bulk_length_meters: validatedData.bulk_length_meters ? Number(validatedData.bulk_length_meters) : undefined,
      bulk_quantity: validatedData.bulk_quantity ? Number(validatedData.bulk_quantity) : undefined,
      calculated_rolls: validatedData.calculated_rolls ? Number(validatedData.calculated_rolls) : undefined,
    };

    // Update in Supabase (don't include id, created_at, or user_id in update)
    const supabase = await createClient();
    const { error } = await supabase
      .from("films")
      .update(processedData)
      .eq("id", id);

    if (error) {
      throw error;
    }

    // Fetch the updated film to return
    const { data: updatedFilm } = await supabase
      .from("films")
      .select("*")
      .eq("id", id)
      .single();

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

    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Generate a unique ID for the film
    const filmId = uuidv4();

    // Create film with ID, timestamp, and user_id
    const newFilm: Film = {
      ...validatedData,
      id: filmId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id,
      iso: Number(validatedData.iso),
      price: validatedData.price ? Number(validatedData.price) : undefined,
      count: validatedData.count ? Number(validatedData.count) : undefined,
      bulk_length_meters: validatedData.bulk_length_meters ? Number(validatedData.bulk_length_meters) : undefined,
      bulk_quantity: validatedData.bulk_quantity ? Number(validatedData.bulk_quantity) : undefined,
      calculated_rolls: validatedData.calculated_rolls ? Number(validatedData.calculated_rolls) : undefined,
    };

    // Save to Supabase
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

export async function reduceFilmCount(
  filmId: string,
  quantity: number,
  usageNote: string
) {
  const supabase = await createClient();

  const { data: film, error: filmError } = await supabase
    .from("films")
    .select("count")
    .eq("id", filmId)
    .single();

  if (filmError || !film) {
    return { error: "Film not found" };
  }

  const currentCount = film.count || 0;
  const newCount = Math.max(0, currentCount - quantity);

  const { error: updateError } = await supabase
    .from("films")
    .update({ count: newCount })
    .eq("id", filmId);

  if (updateError) {
    return { error: updateError.message };
  }

  const { error: usageError } = await supabase.from("film_usage").insert({
    film_id: filmId,
    quantity,
    usage_note: usageNote,
  });

  console.log(
    "🚀 ~ const{error:usageError}=awaitsupabase.from ~ usageError:",
    usageError
  );

  if (usageError) {
    return { error: "Failed to record usage" };
  }

  revalidatePath("/films");
  return { success: true, newCount };
}

export async function getFilmUsageHistory(filmId: string): Promise<{
  data: FilmUsage[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("film_usage")
      .select("*")
      .eq("film_id", filmId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching film usage history:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch usage history",
    };
  }
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
