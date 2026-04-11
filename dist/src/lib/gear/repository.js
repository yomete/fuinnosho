export async function insertGear(supabase, data) {
    return supabase.from("gear").insert(data).select().single();
}
export async function updateGearById(supabase, gearId, data, userId) {
    let query = supabase.from("gear").update(data).eq("id", gearId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query;
}
export async function selectGearById(supabase, gearId, userId) {
    let query = supabase.from("gear").select("*").eq("id", gearId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query.single();
}
export async function selectGearSummaryById(supabase, gearId, userId) {
    let query = supabase
        .from("gear")
        .select("id, name, brand, type")
        .eq("id", gearId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query.single();
}
export async function listGearByUser(supabase, userId) {
    return supabase
        .from("gear")
        .select("*")
        .eq("user_id", userId)
        .order("type", { ascending: true })
        .order("brand", { ascending: true })
        .order("name", { ascending: true });
}
export async function deleteGearById(supabase, gearId, userId) {
    let query = supabase.from("gear").delete().eq("id", gearId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query;
}
export async function selectGearReservations(supabase, gearId) {
    return supabase
        .from("trip_gear")
        .select(`
      trips (title, start_date, end_date)
    `)
        .eq("gear_id", gearId);
}
export async function selectTripGearReservation(supabase, tripId, gearId) {
    return supabase
        .from("trip_gear")
        .select("*")
        .eq("trip_id", tripId)
        .eq("gear_id", gearId)
        .single();
}
export async function insertTripGearReservation(supabase, tripId, gearId) {
    return supabase
        .from("trip_gear")
        .insert({ trip_id: tripId, gear_id: gearId })
        .select()
        .single();
}
export async function deleteTripGearReservation(supabase, tripId, gearId) {
    return supabase
        .from("trip_gear")
        .delete()
        .eq("trip_id", tripId)
        .eq("gear_id", gearId);
}
export async function selectGearForTrip(supabase, tripId) {
    return supabase
        .from("trip_gear")
        .select(`
        *,
        gear (*)
      `)
        .eq("trip_id", tripId);
}
