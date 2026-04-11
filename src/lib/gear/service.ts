import type { SupabaseClient } from "@supabase/supabase-js";
import type { Gear, TripGear } from "./types.js";
import type { GearSchema } from "./schema.js";
import { gearSchema } from "./schema.js";
import {
  deleteGearById,
  deleteTripGearReservation,
  insertGear,
  insertTripGearReservation,
  listGearByUser,
  selectGearById,
  selectGearForTrip,
  selectGearReservations,
  selectGearSummaryById,
  selectTripGearReservation,
  updateGearById,
} from "./repository.js";
import { selectTripById } from "../trips/repository.js";

type GearFilters = {
  type?: string;
  brand?: string;
  condition?: string;
};

type TripReservationSummary = {
  trips:
    | {
        title: string;
        start_date?: string;
        end_date?: string;
        trip_date?: string;
      }
    | Array<{
    title: string;
    start_date?: string;
    end_date?: string;
    trip_date?: string;
  }>;
};

function getTripReservationEntry(reservation: TripReservationSummary) {
  return Array.isArray(reservation.trips)
    ? reservation.trips[0]
    : reservation.trips;
}

function normalizeGearInput(data: GearSchema) {
  const validatedData = gearSchema.parse(data);

  return {
    ...validatedData,
    purchase_price:
      validatedData.purchase_price !== undefined
        ? Number(validatedData.purchase_price)
        : undefined,
  };
}

function filterGear(gear: Gear[], filters?: GearFilters) {
  return gear.filter((item) => {
    if (filters?.type && item.type !== filters.type) {
      return false;
    }

    if (
      filters?.brand &&
      !item.brand.toLowerCase().includes(filters.brand.toLowerCase())
    ) {
      return false;
    }

    if (filters?.condition && item.condition !== filters.condition) {
      return false;
    }

    return true;
  });
}

async function ensureGearOwned(
  supabase: SupabaseClient,
  gearId: string,
  userId: string
) {
  const { data: gear, error } = await selectGearById(supabase, gearId, userId);

  if (error || !gear) {
    throw new Error("Gear not found");
  }

  return gear;
}

async function ensureTripOwned(
  supabase: SupabaseClient,
  tripId: string,
  userId: string
) {
  const { data: trip, error } = await selectTripById(supabase, tripId, userId);

  if (error || !trip) {
    throw new Error("Trip not found");
  }

  return trip;
}

export async function createGearForUser(
  supabase: SupabaseClient,
  userId: string,
  data: GearSchema
) {
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

export async function updateGearForUser(
  supabase: SupabaseClient,
  userId: string,
  gearId: string,
  data: GearSchema
) {
  const gearData = normalizeGearInput(data);
  const { error } = await updateGearById(supabase, gearId, gearData, userId);

  if (error) {
    throw error;
  }

  const { data: gear, error: fetchError } = await selectGearById(
    supabase,
    gearId,
    userId
  );

  if (fetchError) {
    throw fetchError;
  }

  return gear;
}

export async function deleteGearForUser(
  supabase: SupabaseClient,
  userId: string,
  gearId: string
) {
  await ensureGearOwned(supabase, gearId, userId);

  const { data: reservations } = await selectGearReservations(supabase, gearId);
  const upcomingReservations =
    ((reservations || []) as unknown as TripReservationSummary[]).filter(
      (reservation) => {
        const trip = getTripReservationEntry(reservation);
        const reservationDate =
          trip?.start_date ?? trip?.trip_date ?? trip?.end_date;

        return reservationDate ? new Date(reservationDate) >= new Date() : false;
      }
    ) || [];

  if (upcomingReservations.length > 0) {
    const tripTitles = upcomingReservations
      .map((reservation) => getTripReservationEntry(reservation)?.title)
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Cannot delete gear: it's reserved for upcoming trips: ${tripTitles}`
    );
  }

  const { error } = await deleteGearById(supabase, gearId, userId);

  if (error) {
    throw error;
  }
}

export async function getGearForUser(
  supabase: SupabaseClient,
  userId: string,
  filters?: GearFilters
) {
  const { data, error } = await listGearByUser(supabase, userId);

  if (error) {
    throw error;
  }

  return filterGear((data || []) as Gear[], filters);
}

export async function getGearByIdForUser(
  supabase: SupabaseClient,
  userId: string,
  gearId: string
) {
  const { data, error } = await selectGearById(supabase, gearId, userId);

  if (error) {
    throw error;
  }

  return data;
}

export async function reserveGearForTripForUser(
  supabase: SupabaseClient,
  userId: string,
  tripId: string,
  gearId: string
) {
  await ensureTripOwned(supabase, tripId, userId);
  await ensureGearOwned(supabase, gearId, userId);

  const { data: existingReservation } = await selectTripGearReservation(
    supabase,
    tripId,
    gearId
  );

  if (existingReservation) {
    throw new Error("Gear is already reserved for this trip");
  }

  const { data, error } = await insertTripGearReservation(supabase, tripId, gearId);

  if (error) {
    throw error;
  }

  return data;
}

export async function removeGearReservationForUser(
  supabase: SupabaseClient,
  userId: string,
  tripId: string,
  gearId: string
) {
  await ensureTripOwned(supabase, tripId, userId);
  await ensureGearOwned(supabase, gearId, userId);

  const { error } = await deleteTripGearReservation(supabase, tripId, gearId);

  if (error) {
    throw error;
  }
}

export async function getGearForTripForUser(
  supabase: SupabaseClient,
  userId: string,
  tripId: string
) {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  await ensureTripOwned(supabase, tripId, userId);

  const { data, error } = await selectGearForTrip(supabase, tripId);

  if (error) {
    throw error;
  }

  return (data || []) as (TripGear & { gear: Gear })[];
}

export async function getTripWithGearForUser(
  supabase: SupabaseClient,
  userId: string,
  tripId: string
) {
  const trip = await ensureTripOwned(supabase, tripId, userId);
  const gear = await getGearForTripForUser(supabase, userId, tripId);

  return { trip, gear };
}

export async function getGearStatsForUser(
  supabase: SupabaseClient,
  userId: string,
  groupBy: keyof Gear
) {
  const gear = await getGearForUser(supabase, userId);
  const stats: Record<
    string,
    {
      count: number;
      total_value: number;
      gear: Array<{
        id: string;
        name: string;
        brand: string;
        type: string;
        condition: string;
      }>;
    }
  > = {};

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

export async function getGearSummaryForUser(
  supabase: SupabaseClient,
  userId: string,
  gearId: string
) {
  const { data, error } = await selectGearSummaryById(supabase, gearId, userId);

  if (error || !data) {
    throw new Error("Gear not found");
  }

  return data;
}
