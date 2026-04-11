"use server";

import { getEffectiveUser, getDataClient } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Gear, TripGear } from "@/lib/gear/types";
import type { GearSchema } from "@/lib/gear/schema";
import {
  createGearForUser,
  deleteGearForUser,
  getGearByIdForUser,
  getGearForTripForUser,
  getGearForUser,
  removeGearReservationForUser,
  reserveGearForTripForUser,
  updateGearForUser,
} from "@/lib/gear/service";

interface GearResponse {
  success: boolean;
  error?: string;
  gear?: Gear | null;
}

interface GearListResponse {
  success: boolean;
  error?: string;
  gear?: Gear[];
}

interface TripGearResponse {
  success: boolean;
  error?: string;
  tripGear?: TripGear;
}

export async function createGear(data: GearSchema): Promise<GearResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to create gear");
    }

    const supabase = await getDataClient();
    const gear = await createGearForUser(supabase, userId, data);

    revalidatePath("/gear");
    return { success: true, gear };
  } catch (error) {
    console.error("Error creating gear:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create gear",
    };
  }
}

export async function editGear(
  id: string,
  data: GearSchema
): Promise<GearResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to edit gear");
    }

    const supabase = await getDataClient();
    const gear = await updateGearForUser(supabase, userId, id, data);

    revalidatePath("/gear");
    return { success: true, gear };
  } catch (error) {
    console.error("Error editing gear:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update gear",
    };
  }
}

export async function deleteGear(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to delete gear");
    }

    const supabase = await getDataClient();
    await deleteGearForUser(supabase, userId, id);

    revalidatePath("/gear");
    return { success: true };
  } catch (error) {
    console.error("Error deleting gear:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete gear",
    };
  }
}

export async function getGear(): Promise<GearListResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const gear = await getGearForUser(supabase, userId);

    return { success: true, gear };
  } catch (error) {
    console.error("Error fetching gear:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch gear",
    };
  }
}

export async function getGearById(id: string): Promise<GearResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const gear = await getGearByIdForUser(supabase, userId, id);

    return { success: true, gear };
  } catch (error) {
    console.error("Error fetching gear:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch gear",
    };
  }
}

export async function reserveGearForTrip(
  tripId: string,
  gearId: string
): Promise<TripGearResponse> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const tripGear = await reserveGearForTripForUser(supabase, userId, tripId, gearId);

    revalidatePath("/trips");
    revalidatePath("/gear");
    return { success: true, tripGear };
  } catch (error) {
    console.error("Error reserving gear for trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reserve gear",
    };
  }
}

export async function removeGearReservation(
  tripId: string,
  gearId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    await removeGearReservationForUser(supabase, userId, tripId, gearId);

    revalidatePath("/trips");
    revalidatePath("/gear");
    return { success: true };
  } catch (error) {
    console.error("Error removing gear reservation:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove gear reservation",
    };
  }
}

export async function getGearForTrip(tripId: string): Promise<{
  success: boolean;
  error?: string;
  gear?: (TripGear & { gear: Gear })[];
}> {
  try {
    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const supabase = await getDataClient();
    const gear = await getGearForTripForUser(supabase, userId, tripId);

    return { success: true, gear: gear || [] };
  } catch (error) {
    console.error("Error fetching gear for trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch trip gear",
    };
  }
}
