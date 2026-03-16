"use server";

import { Gear, TripGear } from "@/lib/utils";
import { getEffectiveUser, getDataClient } from "@/lib/auth";
import { GearSchema, gearSchema } from "@/lib/utils";
import { revalidatePath } from "next/cache";

interface GearResponse {
  success: boolean;
  error?: string;
  gear?: Gear;
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
    // Validate the data
    const validatedData = gearSchema.parse(data);

    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to create gear");
    }

    const supabase = await getDataClient();

    // Convert number fields from string to number if needed and add user_id
    const processedData = {
      ...validatedData,
      purchase_price: validatedData.purchase_price ? Number(validatedData.purchase_price) : undefined,
      user_id: userId,
    };

    const { data: gear, error } = await supabase
      .from("gear")
      .insert(processedData)
      .select()
      .single();

    if (error) {
      throw error;
    }

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
    // Validate the data
    const validatedData = gearSchema.parse(data);

    const { userId } = await getEffectiveUser();

    if (!userId) {
      throw new Error("User must be authenticated to edit gear");
    }

    const supabase = await getDataClient();

    // Convert number fields from string to number if needed
    const processedData = {
      ...validatedData,
      purchase_price: validatedData.purchase_price ? Number(validatedData.purchase_price) : undefined,
    };

    const { error } = await supabase
      .from("gear")
      .update(processedData)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    // Fetch the updated gear to return
    const { data: updatedGear } = await supabase
      .from("gear")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    revalidatePath("/gear");
    return { success: true, gear: updatedGear };
  } catch (error) {
    console.error("Error editing gear:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update gear",
    };
  }
}

export async function deleteGear(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();

    // Verify gear belongs to current user
    const { data: ownedGear, error: ownerError } = await supabase
      .from("gear")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (ownerError || !ownedGear) {
      return { success: false, error: "Gear not found" };
    }

    // Check if gear is reserved for any upcoming trips
    const { data: reservations } = await supabase
      .from("trip_gear")
      .select(`
        trips (
          title,
          trip_date
        )
      `)
      .eq("gear_id", id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upcomingReservations = reservations?.filter((r: any) => {
      const tripDate = new Date(r.trips.trip_date);
      const today = new Date();
      return tripDate >= today;
    }) || [];

    if (upcomingReservations.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tripTitles = upcomingReservations.map((r: any) => r.trips.title).join(", ");
      return {
        success: false,
        error: `Cannot delete gear: it's reserved for upcoming trips: ${tripTitles}`
      };
    }

    const { error } = await supabase
      .from("gear")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

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
    const supabase = await getDataClient();
    const { data: gear, error } = await supabase
      .from("gear")
      .select("*")
      .eq("user_id", userId)
      .order("type", { ascending: true })
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return { success: true, gear: gear || [] };
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
    const supabase = await getDataClient();
    const { data: gear, error } = await supabase
      .from("gear")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, gear };
  } catch (error) {
    console.error("Error fetching gear:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch gear",
    };
  }
}

// Trip-gear reservation functions
export async function reserveGearForTrip(
  tripId: string,
  gearId: string
): Promise<TripGearResponse> {
  try {
    const { userId } = await getEffectiveUser();
    const supabase = await getDataClient();

    // Verify gear belongs to current user
    const { data: ownedGear, error: ownerError } = await supabase
      .from("gear")
      .select("id")
      .eq("id", gearId)
      .eq("user_id", userId)
      .single();

    if (ownerError || !ownedGear) {
      return { success: false, error: "Gear not found" };
    }

    // Check if gear is already reserved for this trip
    const { data: existingReservation } = await supabase
      .from("trip_gear")
      .select("id")
      .eq("trip_id", tripId)
      .eq("gear_id", gearId)
      .single();

    if (existingReservation) {
      return {
        success: false,
        error: "Gear is already reserved for this trip"
      };
    }

    const { data: tripGear, error } = await supabase
      .from("trip_gear")
      .insert({
        trip_id: tripId,
        gear_id: gearId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

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
    const supabase = await getDataClient();

    // Verify gear belongs to current user
    const { data: ownedGear, error: ownerError } = await supabase
      .from("gear")
      .select("id")
      .eq("id", gearId)
      .eq("user_id", userId)
      .single();

    if (ownerError || !ownedGear) {
      return { success: false, error: "Gear not found" };
    }

    const { error } = await supabase
      .from("trip_gear")
      .delete()
      .eq("trip_id", tripId)
      .eq("gear_id", gearId);

    if (error) {
      throw error;
    }

    revalidatePath("/trips");
    revalidatePath("/gear");
    return { success: true };
  } catch (error) {
    console.error("Error removing gear reservation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove gear reservation",
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
    const supabase = await getDataClient();

    // Verify trip belongs to current user
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id")
      .eq("id", tripId)
      .eq("user_id", userId)
      .single();

    if (tripError || !trip) {
      return { success: false, error: "Trip not found" };
    }

    const { data: tripGear, error } = await supabase
      .from("trip_gear")
      .select(`
        *,
        gear (*)
      `)
      .eq("trip_id", tripId);

    if (error) {
      throw error;
    }

    return { success: true, gear: tripGear || [] };
  } catch (error) {
    console.error("Error fetching gear for trip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch trip gear",
    };
  }
}