"use server";

import { Film } from "@/components/dashboard/Films/utils";
import { createClient } from "@/lib/supabase/server";
import { FilmSchema, filmSchema } from "@/lib/utils";

interface CreateFilmResponse {
  success: boolean;
  error?: string;
}

export async function editFilm(
  id: string,
  data: FilmSchema
): Promise<CreateFilmResponse> {
  try {
    const supabase = await createClient();

    // Check user authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Validate the data
    const validatedData = filmSchema.parse(data);

    // Convert number fields from string to number if needed
    const processedData = {
      ...validatedData,
      iso: Number(validatedData.iso),
      price: validatedData.price ? Number(validatedData.price) : null,
      count: validatedData.count ? Number(validatedData.count) : null,
    };

    const { error } = await supabase
      .from("films")
      .update(processedData)
      .eq("id", id)
      .eq("user_id", user.id); // Ensure user can only update their own records

    console.log("🚀 ~ error:", error);

    if (error) throw error;

    return { success: true };
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
    const supabase = await createClient();

    // Get the current user's ID
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("🚀 ~ userError:", userError);
    console.log("🚀 ~ user:", user);

    if (userError || !user) throw new Error("Unauthorized");

    const validatedData = filmSchema.parse(data);
    console.log("🚀 ~ validatedData:", validatedData);

    const { error } = await supabase.from("films").insert([
      {
        ...validatedData,
        user_id: user.id,
        created_at: new Date().toISOString(),
      },
    ]);

    console.log("🚀 ~ error:", error);

    if (error) throw error;

    return { success: true };
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
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("films")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching films:", error);
    return { data: null, error };
  }

  return { data, error: null };
}
