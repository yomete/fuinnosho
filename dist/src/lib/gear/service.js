import { gearSchema } from "./schema.js";
import { deleteGearById, deleteTripGearReservation, insertGear, insertTripGearReservation, listGearByUser, selectGearById, selectGearForTrip, selectGearReservations, selectGearSummaryById, selectTripGearReservation, updateGearById, } from "./repository.js";
import { selectTripById } from "../trips/repository.js";
function getTripReservationEntry(reservation) {
    return Array.isArray(reservation.trips)
        ? reservation.trips[0]
        : reservation.trips;
}
function normalizeGearInput(data) {
    const validatedData = gearSchema.parse(data);
    return {
        ...validatedData,
        purchase_price: validatedData.purchase_price !== undefined
            ? Number(validatedData.purchase_price)
            : undefined,
    };
}
function filterGear(gear, filters) {
    return gear.filter((item) => {
        if (filters?.type && item.type !== filters.type) {
            return false;
        }
        if (filters?.brand &&
            !item.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
            return false;
        }
        if (filters?.condition && item.condition !== filters.condition) {
            return false;
        }
        return true;
    });
}
async function ensureGearOwned(supabase, gearId, userId) {
    const { data: gear, error } = await selectGearById(supabase, gearId, userId);
    if (error || !gear) {
        throw new Error("Gear not found");
    }
    return gear;
}
async function ensureTripOwned(supabase, tripId, userId) {
    const { data: trip, error } = await selectTripById(supabase, tripId, userId);
    if (error || !trip) {
        throw new Error("Trip not found");
    }
    return trip;
}
export async function createGearForUser(supabase, userId, data) {
    const gearData = normalizeGearInput(data);
    const { data: gear, error } = await insertGear(supabase, {
        ...gearData,
        user_id: userId,
    });
    if (error) {
        throw error;
    }
    return gear;
}
export async function updateGearForUser(supabase, userId, gearId, data) {
    const gearData = normalizeGearInput(data);
    const { error } = await updateGearById(supabase, gearId, gearData, userId);
    if (error) {
        throw error;
    }
    const { data: gear, error: fetchError } = await selectGearById(supabase, gearId, userId);
    if (fetchError) {
        throw fetchError;
    }
    return gear;
}
export async function deleteGearForUser(supabase, userId, gearId) {
    await ensureGearOwned(supabase, gearId, userId);
    const { data: reservations } = await selectGearReservations(supabase, gearId);
    const upcomingReservations = (reservations || []).filter((reservation) => {
        const trip = getTripReservationEntry(reservation);
        const reservationDate = trip?.start_date ?? trip?.trip_date ?? trip?.end_date;
        return reservationDate ? new Date(reservationDate) >= new Date() : false;
    }) || [];
    if (upcomingReservations.length > 0) {
        const tripTitles = upcomingReservations
            .map((reservation) => getTripReservationEntry(reservation)?.title)
            .filter(Boolean)
            .join(", ");
        throw new Error(`Cannot delete gear: it's reserved for upcoming trips: ${tripTitles}`);
    }
    const { error } = await deleteGearById(supabase, gearId, userId);
    if (error) {
        throw error;
    }
}
export async function getGearForUser(supabase, userId, filters) {
    const { data, error } = await listGearByUser(supabase, userId);
    if (error) {
        throw error;
    }
    return filterGear((data || []), filters);
}
export async function getGearByIdForUser(supabase, userId, gearId) {
    const { data, error } = await selectGearById(supabase, gearId, userId);
    if (error) {
        throw error;
    }
    return data;
}
export async function reserveGearForTripForUser(supabase, userId, tripId, gearId) {
    await ensureTripOwned(supabase, tripId, userId);
    await ensureGearOwned(supabase, gearId, userId);
    const { data: existingReservation } = await selectTripGearReservation(supabase, tripId, gearId);
    if (existingReservation) {
        throw new Error("Gear is already reserved for this trip");
    }
    const { data, error } = await insertTripGearReservation(supabase, tripId, gearId);
    if (error) {
        throw error;
    }
    return data;
}
export async function removeGearReservationForUser(supabase, userId, tripId, gearId) {
    await ensureTripOwned(supabase, tripId, userId);
    await ensureGearOwned(supabase, gearId, userId);
    const { error } = await deleteTripGearReservation(supabase, tripId, gearId);
    if (error) {
        throw error;
    }
}
export async function getGearForTripForUser(supabase, userId, tripId) {
    if (!userId) {
        throw new Error("User not authenticated");
    }
    await ensureTripOwned(supabase, tripId, userId);
    const { data, error } = await selectGearForTrip(supabase, tripId);
    if (error) {
        throw error;
    }
    return (data || []);
}
export async function getTripWithGearForUser(supabase, userId, tripId) {
    const trip = await ensureTripOwned(supabase, tripId, userId);
    const gear = await getGearForTripForUser(supabase, userId, tripId);
    return { trip, gear };
}
export async function getGearStatsForUser(supabase, userId, groupBy) {
    const gear = await getGearForUser(supabase, userId);
    const stats = {};
    gear.forEach((item) => {
        const key = String(item[groupBy] || "unknown");
        if (!stats[key]) {
            stats[key] = { count: 0, total_value: 0, gear: [] };
        }
        stats[key].count++;
        stats[key].total_value += item.purchase_price || 0;
        stats[key].gear.push({
            id: item.id,
            name: item.name,
            brand: item.brand,
            type: item.type,
            condition: item.condition,
        });
    });
    return { gear, stats };
}
export async function getGearSummaryForUser(supabase, userId, gearId) {
    const { data, error } = await selectGearSummaryById(supabase, gearId, userId);
    if (error || !data) {
        throw new Error("Gear not found");
    }
    return data;
}
