const LOADED_SELECT = `
  *,
  camera:gear!loaded_films_camera_id_fkey (
    id, name, brand, model
  ),
  film:films!loaded_films_film_id_fkey (
    id, name, brand, iso, format, type, expiration_date, is_bulk_film
  )
`;
export async function listActiveLoadedFilmsByUser(supabase, userId) {
    return supabase
        .from("loaded_films")
        .select(LOADED_SELECT)
        .eq("user_id", userId)
        .is("unloaded_at", null)
        .order("loaded_at", { ascending: false });
}
export async function selectLoadedFilmById(supabase, loadedId, userId) {
    let query = supabase
        .from("loaded_films")
        .select(LOADED_SELECT)
        .eq("id", loadedId);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query.single();
}
export async function selectActiveLoadForCamera(supabase, cameraId, userId) {
    return supabase
        .from("loaded_films")
        .select("id")
        .eq("camera_id", cameraId)
        .eq("user_id", userId)
        .is("unloaded_at", null)
        .maybeSingle();
}
export async function insertLoadedFilm(supabase, data) {
    return supabase.from("loaded_films").insert(data).select(LOADED_SELECT).single();
}
export async function markLoadedFilmUnloaded(supabase, loadedId, userId, outcome) {
    return supabase
        .from("loaded_films")
        .update({
        unloaded_at: new Date().toISOString(),
        outcome,
    })
        .eq("id", loadedId)
        .eq("user_id", userId)
        .is("unloaded_at", null)
        .select("id")
        .maybeSingle();
}
/** Undo an unload that could not be completed (stock update failed). */
export async function revertLoadedFilmUnload(supabase, loadedId, userId) {
    return supabase
        .from("loaded_films")
        .update({ unloaded_at: null, outcome: null })
        .eq("id", loadedId)
        .eq("user_id", userId);
}
export async function listCamerasByUser(supabase, userId) {
    return supabase
        .from("gear")
        .select("id, name, brand, model")
        .eq("user_id", userId)
        .eq("type", "camera")
        .order("name", { ascending: true });
}
export async function selectCameraById(supabase, cameraId, userId) {
    return supabase
        .from("gear")
        .select("id, name, brand, model, type")
        .eq("id", cameraId)
        .eq("user_id", userId)
        .single();
}
/**
 * Every EI a film stock has been loaded at, newest first. Callers collapse this
 * to one value per film to prefill the next load.
 */
export async function listShotAtIsoHistoryByUser(supabase, userId) {
    return supabase
        .from("loaded_films")
        .select("film_id, shot_at_iso, loaded_at")
        .eq("user_id", userId)
        .not("shot_at_iso", "is", null)
        .order("loaded_at", { ascending: false });
}
