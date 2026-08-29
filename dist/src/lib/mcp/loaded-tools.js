import { unloadOutcomeValues } from "../loaded/schema.js";
import { getCameraLoadStatesForUser, getLoadedFilmsForUser, loadFilmIntoCameraForUser, unloadFilmForUser, } from "../loaded/service.js";
function jsonResult(data) {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
}
function describeEntry(entry) {
    return {
        loaded_id: entry.id,
        camera: entry.camera
            ? `${entry.camera.brand} ${entry.camera.name}`
            : entry.camera_id,
        film: entry.film ? `${entry.film.brand} ${entry.film.name}` : entry.film_id,
        film_id: entry.film_id,
        camera_id: entry.camera_id,
        box_speed: entry.film?.iso ?? null,
        shot_at_iso: entry.shot_at_iso ?? null,
        format: entry.film?.format ?? null,
        is_spooled_cassette: Boolean(entry.film?.is_bulk_film),
        notes: entry.notes ?? null,
        loaded_at: entry.loaded_at,
    };
}
export function createLoadedToolHandlers(supabase, userId) {
    function requireUser() {
        if (!userId) {
            throw new Error("A user must be resolved to work with loaded film");
        }
        return userId;
    }
    async function getLoadedFilms(args) {
        const resolvedUserId = requireUser();
        const { include_empty_cameras = true } = args;
        const [cameraStates, loaded] = await Promise.all([
            getCameraLoadStatesForUser(supabase, resolvedUserId),
            getLoadedFilmsForUser(supabase, resolvedUserId),
        ]);
        const emptyCameras = cameraStates
            .filter((state) => !state.loaded)
            .map((state) => ({
            camera_id: state.camera.id,
            camera: `${state.camera.brand} ${state.camera.name}`,
        }));
        return jsonResult({
            summary: {
                cameras_loaded: loaded.length,
                cameras_empty: emptyCameras.length,
            },
            loaded: loaded.map(describeEntry),
            ...(include_empty_cameras ? { empty_cameras: emptyCameras } : {}),
        });
    }
    async function loadFilm(args) {
        const resolvedUserId = requireUser();
        const { camera_id, film_id, shot_at_iso, notes } = args;
        if (!camera_id || !film_id) {
            throw new Error("Missing required fields: camera_id, film_id");
        }
        const entry = await loadFilmIntoCameraForUser(supabase, resolvedUserId, {
            camera_id,
            film_id,
            shot_at_iso,
            notes,
        });
        return jsonResult({
            success: true,
            message: `${entry.film?.brand ?? ""} ${entry.film?.name ?? "Film"} loaded into ${entry.camera ? `${entry.camera.brand} ${entry.camera.name}` : "the camera"}. It is held out of trip reservations until you unload it.`,
            loaded: describeEntry(entry),
        });
    }
    async function unloadFilm(args) {
        const resolvedUserId = requireUser();
        const { loaded_id, outcome, trip_id } = args;
        if (!loaded_id || !outcome) {
            throw new Error("Missing required fields: loaded_id, outcome");
        }
        if (!unloadOutcomeValues.includes(outcome)) {
            throw new Error(`outcome must be one of: ${unloadOutcomeValues.join(", ")}`);
        }
        const entry = await unloadFilmForUser(supabase, resolvedUserId, loaded_id, {
            outcome: outcome,
            trip_id,
        });
        return jsonResult({
            success: true,
            message: outcome === "shot"
                ? `Marked as shot. One roll of ${entry.film?.brand ?? ""} ${entry.film?.name ?? "film"} was consumed and logged to your usage history.`
                : `Roll returned to the shelf unused. Your count is unchanged.`,
            unloaded: describeEntry(entry),
            outcome,
        });
    }
    return { getLoadedFilms, loadFilm, unloadFilm };
}
