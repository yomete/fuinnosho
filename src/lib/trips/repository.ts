import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trip } from "@/lib/trips/types";

type TripMutation = Partial<Omit<Trip, "id" | "created_at" | "user_id">>;

export async function insertTrip(supabase: SupabaseClient, trip: Trip) {
  return supabase.from("trips").insert([trip]);
}

export async function updateTripById(
  supabase: SupabaseClient,
  tripId: string,
  data: TripMutation,
  userId?: string | null
) {
  let query = supabase.from("trips").update(data).eq("id", tripId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query;
}

export async function selectTripById(
  supabase: SupabaseClient,
  tripId: string,
  userId?: string | null
) {
  let query = supabase.from("trips").select("*").eq("id", tripId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.single();
}

export async function selectTripTitleById(
  supabase: SupabaseClient,
  tripId: string,
  userId?: string | null
) {
  let query = supabase.from("trips").select("title").eq("id", tripId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.single();
}

export async function listTripsByUserWithFilmQuantities(
  supabase: SupabaseClient,
  userId: string
) {
  return supabase
    .from("trips")
    .select(`
      *,
      trip_films (
        quantity
      )
    `)
    .eq("user_id", userId)
    .order("start_date", { ascending: true });
}

export async function deleteTripById(
  supabase: SupabaseClient,
  tripId: string,
  userId?: string | null
) {
  let query = supabase.from("trips").delete().eq("id", tripId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query;
}

export async function selectTripFilmReservation(
  supabase: SupabaseClient,
  tripId: string,
  filmId: string
) {
  return supabase
    .from("trip_films")
    .select("*")
    .eq("trip_id", tripId)
    .eq("film_id", filmId)
    .single();
}

export async function insertTripFilmReservation(
  supabase: SupabaseClient,
  tripId: string,
  filmId: string,
  quantity: number
) {
  return supabase.from("trip_films").insert([{ trip_id: tripId, film_id: filmId, quantity }]);
}

export async function updateTripFilmReservation(
  supabase: SupabaseClient,
  tripId: string,
  filmId: string,
  quantity: number
) {
  return supabase
    .from("trip_films")
    .update({ quantity })
    .eq("trip_id", tripId)
    .eq("film_id", filmId);
}

export async function deleteTripFilmReservation(
  supabase: SupabaseClient,
  tripId: string,
  filmId: string
) {
  return supabase
    .from("trip_films")
    .delete()
    .eq("trip_id", tripId)
    .eq("film_id", filmId);
}

export async function selectTripWithFilms(
  supabase: SupabaseClient,
  tripId: string
) {
  return supabase
    .from("trip_films")
    .select(`
      quantity,
      films (
        id,
        name,
        brand,
        iso,
        format,
        type
      )
    `)
    .eq("trip_id", tripId);
}

export async function listFilmsWithAvailabilityByUser(
  supabase: SupabaseClient,
  userId: string
) {
  return supabase
    .from("films_with_availability")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function listPastTripsPendingCompletion(
  supabase: SupabaseClient,
  userId: string,
  beforeDate: string
) {
  return supabase
    .from("trips")
    .select("id, title, end_date")
    .eq("user_id", userId)
    .neq("status", "completed")
    .lt("end_date", beforeDate);
}

export async function listTripFilmsForConsumption(
  supabase: SupabaseClient,
  tripId: string
) {
  return supabase.from("trip_films").select("film_id, quantity").eq("trip_id", tripId);
}

export async function listFilmUsageForTrip(
  supabase: SupabaseClient,
  tripId: string
) {
  return supabase.from("film_usage").select("film_id").eq("trip_id", tripId);
}
