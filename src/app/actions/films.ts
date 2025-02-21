"use server";

import { Film } from "@/components/dashboard/Films/utils";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const filmSchema = z.object({
  barcode: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  iso: z.number().min(1),
  format: z.string().min(1),
  type: z.string().min(1),
  expiration_date: z.string().min(1),
  price: z.number().min(1).optional(),
  count: z.number().min(1).optional(),
  notes: z.string().optional(),
});

export type FilmSchema = z.infer<typeof filmSchema>;

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

    const { data: updatedFilm, error } = await supabase
      .from("films")
      .update(data)
      .eq("id", id)
      .select();

    console.log("🚀 ~ updatedFilm:", updatedFilm);
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
    if (userError || !user) throw new Error("Unauthorized");

    const validatedData = filmSchema.parse(data);

    const { error } = await supabase.from("films").insert([
      {
        ...validatedData,
        user_id: user.id,
        created_at: new Date().toISOString(),
      },
    ]);

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

export async function getFilms(): Promise<{ data: Film[] | null; error: any }> {
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
