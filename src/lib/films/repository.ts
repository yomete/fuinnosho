import type { SupabaseClient } from "@supabase/supabase-js";
import type { Film, FilmUsage } from "@/lib/films/types";

type FilmMutation = Omit<Partial<Film>, "deleted_at"> & {
  deleted_at?: string | null;
};

export async function insertFilm(supabase: SupabaseClient, film: Film) {
  return supabase.from("films").insert([film]);
}

export async function updateFilmById(
  supabase: SupabaseClient,
  filmId: string,
  data: FilmMutation,
  userId?: string
) {
  let query = supabase.from("films").update(data).eq("id", filmId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query;
}

export async function selectFilmById(
  supabase: SupabaseClient,
  filmId: string,
  userId?: string,
  includeDeleted: boolean = false
) {
  let query = supabase.from("films").select("*").eq("id", filmId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  return query.single();
}

export async function listFilmsByUser(
  supabase: SupabaseClient,
  userId: string
) {
  return supabase
    .from("films")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
}

export async function listDeletedFilmsByUser(
  supabase: SupabaseClient,
  userId: string
) {
  return supabase
    .from("films")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", "not.null")
    .order("deleted_at", { ascending: false });
}

export async function softDeleteFilmById(
  supabase: SupabaseClient,
  filmId: string,
  userId?: string
) {
  return updateFilmById(
    supabase,
    filmId,
    { deleted_at: new Date().toISOString() },
    userId
  );
}

export async function restoreFilmById(
  supabase: SupabaseClient,
  filmId: string,
  userId?: string
) {
  return updateFilmById(supabase, filmId, { deleted_at: null }, userId);
}

export async function deleteFilmById(
  supabase: SupabaseClient,
  filmId: string,
  userId?: string
) {
  let query = supabase.from("films").delete().eq("id", filmId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query;
}

export async function selectFilmUsageHistory(
  supabase: SupabaseClient,
  filmId: string
) {
  return supabase
    .from("film_usage")
    .select("*")
    .eq("film_id", filmId)
    .order("created_at", { ascending: false });
}

export async function insertFilmUsage(
  supabase: SupabaseClient,
  usage: Omit<FilmUsage, "id" | "created_at"> &
    Partial<Pick<FilmUsage, "created_at">>
) {
  return supabase.from("film_usage").insert({
    ...usage,
    created_at: usage.created_at ?? new Date().toISOString(),
  });
}

export async function selectFilmCountState(
  supabase: SupabaseClient,
  filmId: string,
  userId?: string
) {
  let query = supabase
    .from("films")
    .select("count, is_bulk_film, spooled_cassettes, user_id")
    .eq("id", filmId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.single();
}

export async function selectBulkFilmState(
  supabase: SupabaseClient,
  filmId: string,
  userId?: string
) {
  let query = supabase
    .from("films")
    .select("bulk_remaining_exposures, spooled_cassettes, is_bulk_film, format")
    .eq("id", filmId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.single();
}

export async function selectBulkRollState(
  supabase: SupabaseClient,
  filmId: string,
  userId?: string
) {
  let query = supabase
    .from("films")
    .select("bulk_quantity, bulk_rolls_used, is_bulk_film")
    .eq("id", filmId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.single();
}

export async function selectFilmForTripReservations(
  supabase: SupabaseClient,
  filmId: string
) {
  return supabase
    .from("trip_films")
    .select(`
      quantity,
      created_at,
      trips!inner(
        id,
        title,
        description,
        start_date,
        end_date,
        status
      )
    `)
    .eq("film_id", filmId);
}
