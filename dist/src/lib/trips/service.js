import { v4 as uuidv4 } from "uuid";
import { tripSchema } from "./schema.js";
import { deleteTripById, deleteTripFilmReservation, insertTrip, insertTripFilmReservation, listFilmUsageForTrip, listFilmsWithAvailabilityByUser, listPastTripsPendingCompletion, listTripFilmsForConsumption, listTripsByUserWithFilmQuantities, selectTripById, selectTripFilmReservation, selectTripWithFilms, updateTripById, updateTripFilmReservation, } from "./repository.js";
const TRIP_STATUS_PRIORITY = {
    ongoing: 0,
    upcoming: 1,
    past: 2,
    completed: 3,
};
function getTripTimeValue(date) {
    return new Date(date).getTime();
}
function compareTripsForDisplay(a, b) {
    const statusDifference = TRIP_STATUS_PRIORITY[a.status] - TRIP_STATUS_PRIORITY[b.status];
    if (statusDifference !== 0) {
        return statusDifference;
    }
    switch (a.status) {
        case "ongoing":
            return getTripTimeValue(a.end_date) - getTripTimeValue(b.end_date);
        case "upcoming":
            return getTripTimeValue(a.start_date) - getTripTimeValue(b.start_date);
        case "past":
        case "completed":
            return getTripTimeValue(b.end_date) - getTripTimeValue(a.end_date);
        default:
            return 0;
    }
}
function deriveTripStatus(trip) {
    if (trip.status === "completed") {
        return "completed";
    }
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (startDate > today) {
        return "upcoming";
    }
    if (endDate < today) {
        return "past";
    }
    return "ongoing";
}
export function buildTripRecord(userId, data) {
    const validatedData = tripSchema.parse(data);
    const timestamp = new Date().toISOString();
    return {
        ...validatedData,
        id: uuidv4(),
        created_at: timestamp,
        updated_at: timestamp,
        user_id: userId,
        status: "upcoming",
    };
}
async function ensureTripOwned(supabase, tripId, userId) {
    const { data: trip, error } = await selectTripById(supabase, tripId, userId);
    if (error || !trip) {
        throw new Error("Trip not found");
    }
    return trip;
}
export async function createTripForUser(supabase, userId, data) {
    const trip = buildTripRecord(userId, data);
    const { error } = await insertTrip(supabase, trip);
    if (error) {
        throw error;
    }
    return trip;
}
export async function updateTripForUser(supabase, userId, tripId, data) {
    const validatedData = tripSchema.parse(data);
    const { error } = await updateTripById(supabase, tripId, validatedData, userId);
    if (error) {
        throw error;
    }
    const { data: updatedTrip, error: fetchError } = await selectTripById(supabase, tripId, userId);
    if (fetchError) {
        throw fetchError;
    }
    return updatedTrip;
}
export async function getTripsForUser(supabase, userId) {
    const { data, error } = await listTripsByUserWithFilmQuantities(supabase, userId);
    if (error) {
        throw error;
    }
    return (data?.map((trip) => {
        const tripFilms = trip.trip_films;
        const reserved_film_count = tripFilms?.reduce((total, tripFilm) => total + tripFilm.quantity, 0) || 0;
        const tripData = { ...trip };
        delete tripData.trip_films;
        return {
            ...tripData,
            reserved_film_count,
            status: deriveTripStatus(tripData),
        };
    }).sort(compareTripsForDisplay) || []);
}
export async function getTripByIdForUser(supabase, userId, tripId) {
    const { data, error } = await selectTripById(supabase, tripId, userId);
    if (error) {
        throw error;
    }
    return data;
}
export async function deleteTripForUser(supabase, userId, tripId) {
    const { error } = await deleteTripById(supabase, tripId, userId);
    if (error) {
        throw error;
    }
}
export async function addFilmToTripForUser(supabase, userId, tripId, filmId, quantity) {
    await ensureTripOwned(supabase, tripId, userId);
    const { data: existingReservation } = await selectTripFilmReservation(supabase, tripId, filmId);
    if (existingReservation) {
        const { error } = await updateTripFilmReservation(supabase, tripId, filmId, existingReservation.quantity + quantity);
        if (error) {
            throw error;
        }
        return;
    }
    const { error } = await insertTripFilmReservation(supabase, tripId, filmId, quantity);
    if (error) {
        throw error;
    }
}
export async function updateFilmQuantityInTripForUser(supabase, userId, tripId, filmId, quantity) {
    if (quantity < 1) {
        throw new Error("Quantity must be at least 1");
    }
    await ensureTripOwned(supabase, tripId, userId);
    const { error } = await updateTripFilmReservation(supabase, tripId, filmId, quantity);
    if (error) {
        throw error;
    }
}
export async function removeFilmFromTripForUser(supabase, userId, tripId, filmId) {
    await ensureTripOwned(supabase, tripId, userId);
    const { error } = await deleteTripFilmReservation(supabase, tripId, filmId);
    if (error) {
        throw error;
    }
}
export async function getTripWithFilmsForUser(supabase, userId, tripId) {
    const trip = await ensureTripOwned(supabase, tripId, userId);
    const { data: tripFilms, error } = await selectTripWithFilms(supabase, tripId);
    if (error) {
        throw error;
    }
    const films = (tripFilms || [])
        .filter((tripFilm) => tripFilm.films)
        .map((tripFilm) => ({
        ...tripFilm.films,
        reserved_quantity: tripFilm.quantity,
    })) || [];
    return { trip, films };
}
export async function getFilmsWithAvailabilityForUser(supabase, userId) {
    const { data, error } = await listFilmsWithAvailabilityByUser(supabase, userId);
    if (error) {
        throw error;
    }
    return (data || []);
}
export async function consumeTripFilmsForUser(supabase, userId, tripId, reduceFilmCount) {
    const trip = await ensureTripOwned(supabase, tripId, userId);
    const { data: tripFilms, error: filmsError } = await listTripFilmsForConsumption(supabase, tripId);
    if (filmsError) {
        return { success: false, error: "Failed to fetch trip films" };
    }
    if (!tripFilms || tripFilms.length === 0) {
        return { success: true };
    }
    const { data: existingUsage, error: usageError } = await listFilmUsageForTrip(supabase, tripId);
    if (usageError) {
        return { success: false, error: "Failed to check existing usage" };
    }
    const alreadyConsumedFilmIds = new Set(existingUsage?.map((usage) => usage.film_id) || []);
    for (const tripFilm of tripFilms) {
        if (alreadyConsumedFilmIds.has(tripFilm.film_id)) {
            continue;
        }
        const result = await reduceFilmCount(tripFilm.film_id, tripFilm.quantity, `Trip: ${trip.title} (completed)`, tripId);
        if (result.error) {
            return {
                success: false,
                error: `Failed to consume film: ${result.error}`,
            };
        }
    }
    return { success: true };
}
export async function updateTripStatusForUser(supabase, userId, tripId, status, reduceFilmCount) {
    if (status === "completed") {
        const consumeResult = await consumeTripFilmsForUser(supabase, userId, tripId, reduceFilmCount);
        if (!consumeResult.success) {
            return {
                success: false,
                error: `Failed to consume films: ${consumeResult.error}`,
            };
        }
    }
    const { error } = await updateTripById(supabase, tripId, { status }, userId);
    if (error) {
        throw error;
    }
    return { success: true };
}
export async function consumePastTripFilmsForUser(supabase, userId, reduceFilmCount) {
    const today = new Date();
    const bufferDate = new Date(today);
    bufferDate.setDate(today.getDate() - 1);
    const { data: pastTrips, error } = await listPastTripsPendingCompletion(supabase, userId, bufferDate.toISOString().split("T")[0]);
    if (error) {
        return { success: false, consumed: 0, error: "Failed to fetch past trips" };
    }
    if (!pastTrips || pastTrips.length === 0) {
        return { success: true, consumed: 0 };
    }
    let consumed = 0;
    for (const trip of pastTrips) {
        const consumeResult = await consumeTripFilmsForUser(supabase, userId, trip.id, reduceFilmCount);
        if (consumeResult.success) {
            await updateTripById(supabase, trip.id, { status: "completed" });
            consumed++;
        }
    }
    return { success: true, consumed };
}
