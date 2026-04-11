import type { SupabaseClient } from "@supabase/supabase-js";
import type { Gear } from "./types.js";

type GearMutation = Partial<Omit<Gear, "id" | "created_at" | "updated_at">>;

export async function insertGear(
  supabase: SupabaseClient,
  data: Omit<Gear, "id" | "created_at" | "updated_at">
) {
  return supabase.from("gear").insert(data).select().single();
}

export async function updateGearById(
  supabase: SupabaseClient,
  gearId: string,
  data: GearMutation,
  userId?: string | null
) {
  let query = supabase.from("gear").update(data).eq("id", gearId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query;
}

export async function selectGearById(
  supabase: SupabaseClient,
  gearId: string,
  userId?: string | null
) {
  let query = supabase.from("gear").select("*").eq("id", gearId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.single();
}

export async function selectGearSummaryById(
  supabase: SupabaseClient,
  gearId: string,
  userId?: string | null
) {
  let query = supabase
    .from("gear")
    .select("id, name, brand, type")
    .eq("id", gearId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.single();
}

export async function listGearByUser(
  supabase: SupabaseClient,
  userId: string
) {
  return supabase
    .from("gear")
    .select("*")
    .eq("user_id", userId)
    .order("type", { ascending: true })
    .order("brand", { ascending: true })
    .order("name", { ascending: true });
}

export async function deleteGearById(
  supabase: SupabaseClient,
  gearId: string,
  userId?: string | null
) {
  let query = supabase.from("gear").delete().eq("id", gearId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query;
}

export async function selectGearReservations(
  supabase: SupabaseClient,
  gearId: string
) {
  return supabase
    .from("trip_gear")
    .select(`
      trips (title, start_date, end_date)
    `)
    .eq("gear_id", gearId);
}

export async function selectTripGearReservation(
  supabase: SupabaseClient,
  tripId: string,
  gearId: string
) {
  return supabase
    .from("trip_gear")
    .select("*")
    .eq("trip_id", tripId)
    .eq("gear_id", gearId)
    .single();
}

export async function insertTripGearReservation(
  supabase: SupabaseClient,
  tripId: string,
  gearId: string
) {
  return supabase
    .from("trip_gear")
    .insert({ trip_id: tripId, gear_id: gearId })
    .select()
    .single();
}

export async function deleteTripGearReservation(
  supabase: SupabaseClient,
  tripId: string,
  gearId: string
) {
  return supabase
    .from("trip_gear")
    .delete()
    .eq("trip_id", tripId)
    .eq("gear_id", gearId);
}

export async function selectGearForTrip(
  supabase: SupabaseClient,
  tripId: string
) {
  return supabase
    .from("trip_gear")
    .select(`
        *,
        gear (*)
      `)
    .eq("trip_id", tripId);
}
