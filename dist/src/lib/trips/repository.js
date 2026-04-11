export async function insertTrip(supabase, trip) {
    return supabase.from("trips").insert([trip]);
}
export async function updateTripById(supabase, tripId, data, userId) {
    let query = supabase.from("trips").update(data).eq("id", tripId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query;
}
export async function selectTripById(supabase, tripId, userId) {
    let query = supabase.from("trips").select("*").eq("id", tripId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query.single();
}
export async function selectTripTitleById(supabase, tripId, userId) {
    let query = supabase.from("trips").select("title").eq("id", tripId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query.single();
}
export async function listTripsByUserWithFilmQuantities(supabase, userId) {
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
export async function deleteTripById(supabase, tripId, userId) {
    let query = supabase.from("trips").delete().eq("id", tripId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query;
}
export async function selectTripFilmReservation(supabase, tripId, filmId) {
    return supabase
        .from("trip_films")
        .select("*")
        .eq("trip_id", tripId)
        .eq("film_id", filmId)
        .single();
}
export async function insertTripFilmReservation(supabase, tripId, filmId, quantity) {
    return supabase.from("trip_films").insert([{ trip_id: tripId, film_id: filmId, quantity }]);
}
export async function updateTripFilmReservation(supabase, tripId, filmId, quantity) {
    return supabase
        .from("trip_films")
        .update({ quantity })
        .eq("trip_id", tripId)
        .eq("film_id", filmId);
}
export async function deleteTripFilmReservation(supabase, tripId, filmId) {
    return supabase
        .from("trip_films")
        .delete()
        .eq("trip_id", tripId)
        .eq("film_id", filmId);
}
export async function selectTripWithFilms(supabase, tripId) {
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
export async function listFilmsWithAvailabilityByUser(supabase, userId) {
    return supabase
        .from("films_with_availability")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
}
export async function listPastTripsPendingCompletion(supabase, userId, beforeDate) {
    return supabase
        .from("trips")
        .select("id, title, end_date")
        .eq("user_id", userId)
        .neq("status", "completed")
        .lt("end_date", beforeDate);
}
export async function listTripFilmsForConsumption(supabase, tripId) {
    return supabase.from("trip_films").select("film_id, quantity").eq("trip_id", tripId);
}
export async function listFilmUsageForTrip(supabase, tripId) {
    return supabase.from("film_usage").select("film_id").eq("trip_id", tripId);
}
