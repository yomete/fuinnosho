"use server";

import {
  Film,
  DevelopmentSession,
  DevelopmentSessionSchema,
  developmentSessionSchema,
  SessionFilm,
  SessionChemistryUsage,
  ChemistryInventory,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

interface CreateSessionResponse {
  success: boolean;
  error?: string;
  session?: DevelopmentSession;
}

// Get films from completed trips
export async function getFilmsFromCompletedTrips(
  processType?: 'black_white' | 'color'
): Promise<{
  data: Film[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();

    // Get all film IDs from completed trips
    const { data: completedTrips, error: tripsError } = await supabase
      .from("trips")
      .select(`
        id,
        title,
        trip_films (
          film_id,
          quantity,
          films (*)
        )
      `)
      .eq("status", "completed");

    if (tripsError) {
      throw tripsError;
    }

    if (!completedTrips) {
      return { data: [], error: null };
    }

    // Get already developed films and their quantities
    const { data: developedSessions } = await supabase
      .from("session_films")
      .select("film_id, quantity");

    const developedQuantities = new Map<string, number>();
    developedSessions?.forEach((sf) => {
      const current = developedQuantities.get(sf.film_id) || 0;
      developedQuantities.set(sf.film_id, current + sf.quantity);
    });

    // Extract unique films and aggregate quantities with trip info
    const filmsMap = new Map<string, Film & { totalQuantity: number; trips: Array<{ id: string; title: string; quantity: number }> }>();

    completedTrips.forEach((trip) => {
      trip.trip_films?.forEach((tf: any) => {
        if (tf.films) {
          const film = tf.films as unknown as Film;
          const quantity = tf.quantity || 1;

          // Filter by process type if specified
          if (processType) {
            const isBlackWhite = film.type?.toLowerCase().includes('black') ||
                                 film.type?.toLowerCase().includes('b&w') ||
                                 film.type?.toLowerCase().includes('bw');

            if (processType === 'black_white' && !isBlackWhite) return;
            if (processType === 'color' && isBlackWhite) return;
          }

          // Aggregate quantities for the same film and track trips
          if (filmsMap.has(film.id)) {
            const existing = filmsMap.get(film.id)!;
            existing.totalQuantity += quantity;
            existing.trips.push({ id: trip.id, title: trip.title, quantity });
          } else {
            filmsMap.set(film.id, {
              ...film,
              totalQuantity: quantity,
              trips: [{ id: trip.id, title: trip.title, quantity }]
            });
          }
        }
      });
    });

    // Subtract already developed quantities and filter out fully developed films
    const films = Array.from(filmsMap.values())
      .map(film => {
        const developedQty = developedQuantities.get(film.id) || 0;
        const remainingQty = film.totalQuantity - developedQty;
        return {
          ...film,
          count: remainingQty,
        };
      })
      .filter(film => film.count > 0); // Only show films with remaining rolls

    return { data: films, error: null };
  } catch (error) {
    console.error("Error fetching films from completed trips:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to fetch films"),
    };
  }
}

// Create development session with films and chemistry usage
export async function createDevelopmentSession(
  data: DevelopmentSessionSchema
): Promise<CreateSessionResponse> {
  try {
    const validatedData = developmentSessionSchema.parse(data);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const sessionId = uuidv4();

    // Calculate total cost from chemistry usage
    let totalCost = 0;
    for (const chemUsage of validatedData.chemistry_usage) {
      const { data: chemistry } = await supabase
        .from("chemistry_inventory")
        .select("cost, original_volume_ml")
        .eq("id", chemUsage.chemistry_id)
        .single();

      if (chemistry && chemistry.cost) {
        const costPerMl = chemistry.cost / chemistry.original_volume_ml;
        totalCost += costPerMl * chemUsage.volume_used_ml;
      }
    }

    // Create the session
    const newSession: Omit<DevelopmentSession, 'session_films' | 'session_chemistry_usage'> = {
      id: sessionId,
      user_id: user.id,
      session_date: validatedData.session_date,
      process_type: validatedData.process_type,
      temperature_celsius: validatedData.temperature_celsius,
      notes: validatedData.notes,
      total_cost: totalCost,
      created_at: new Date().toISOString(),
    };

    const { error: sessionError } = await supabase
      .from("development_sessions")
      .insert([newSession]);

    if (sessionError) {
      throw sessionError;
    }

    // Insert session_films records
    const sessionFilms = validatedData.film_ids.map((filmId) => ({
      id: uuidv4(),
      session_id: sessionId,
      film_id: filmId,
      quantity: validatedData.film_quantities?.[filmId] || 1,
      created_at: new Date().toISOString(),
    }));

    const { error: filmsError } = await supabase
      .from("session_films")
      .insert(sessionFilms);

    if (filmsError) {
      throw filmsError;
    }

    // Insert session_chemistry_usage records and update chemistry inventory
    for (const chemUsage of validatedData.chemistry_usage) {
      // Insert usage record
      const usageRecord = {
        id: uuidv4(),
        session_id: sessionId,
        chemistry_id: chemUsage.chemistry_id,
        volume_used_ml: chemUsage.volume_used_ml,
        dilution_ratio: chemUsage.dilution_ratio,
        development_time_minutes: chemUsage.development_time_minutes,
        notes: chemUsage.notes,
        created_at: new Date().toISOString(),
      };

      const { error: usageError } = await supabase
        .from("session_chemistry_usage")
        .insert([usageRecord]);

      if (usageError) {
        throw usageError;
      }

      // Update chemistry inventory (deduct volume, increment times_used)
      const { data: chemistry } = await supabase
        .from("chemistry_inventory")
        .select("*")
        .eq("id", chemUsage.chemistry_id)
        .single();

      if (chemistry) {
        const newVolume = Math.max(0, chemistry.volume_ml - chemUsage.volume_used_ml);
        const newTimesUsed = chemistry.times_used + 1;
        const newTotalProcessed = chemistry.total_volume_processed_ml +
          (validatedData.film_ids.length * chemUsage.volume_used_ml);

        await supabase
          .from("chemistry_inventory")
          .update({
            volume_ml: newVolume,
            times_used: newTimesUsed,
            total_volume_processed_ml: newTotalProcessed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", chemUsage.chemistry_id);
      }
    }

    revalidatePath("/develop");
    revalidatePath("/chemistry");
    return { success: true, session: newSession };
  } catch (error) {
    console.error("Error creating development session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create development session",
    };
  }
}

// Get all development sessions
export async function getDevelopmentSessions(
  processType?: 'black_white' | 'color'
): Promise<{
  data: (DevelopmentSession & {
    session_films?: (SessionFilm & { film?: Film })[];
    session_chemistry_usage?: (SessionChemistryUsage & { chemistry?: ChemistryInventory })[];
  })[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("development_sessions")
      .select(`
        *,
        session_films (
          *,
          film:films (*)
        ),
        session_chemistry_usage (
          *,
          chemistry:chemistry_inventory (*)
        )
      `)
      .order("session_date", { ascending: false });

    if (processType) {
      query = query.eq("process_type", processType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching development sessions:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to fetch development sessions"),
    };
  }
}

// Get a single development session by ID
export async function getDevelopmentSessionById(
  id: string
): Promise<{
  data: (DevelopmentSession & {
    session_films?: (SessionFilm & { film?: Film })[];
    session_chemistry_usage?: (SessionChemistryUsage & { chemistry?: ChemistryInventory })[];
  }) | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("development_sessions")
      .select(`
        *,
        session_films (
          *,
          film:films (*)
        ),
        session_chemistry_usage (
          *,
          chemistry:chemistry_inventory (*)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching development session:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to fetch development session"),
    };
  }
}

// Delete development session
export async function deleteDevelopmentSession(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get session chemistry usage to reverse the inventory updates
    const { data: sessionData } = await supabase
      .from("development_sessions")
      .select(`
        *,
        session_chemistry_usage (*)
      `)
      .eq("id", id)
      .single();

    if (sessionData && sessionData.session_chemistry_usage) {
      // Reverse chemistry inventory updates
      for (const usage of sessionData.session_chemistry_usage as SessionChemistryUsage[]) {
        const { data: chemistry } = await supabase
          .from("chemistry_inventory")
          .select("*")
          .eq("id", usage.chemistry_id)
          .single();

        if (chemistry) {
          const newVolume = chemistry.volume_ml + usage.volume_used_ml;
          const newTimesUsed = Math.max(0, chemistry.times_used - 1);
          const newTotalProcessed = Math.max(0, chemistry.total_volume_processed_ml - usage.volume_used_ml);

          await supabase
            .from("chemistry_inventory")
            .update({
              volume_ml: newVolume,
              times_used: newTimesUsed,
              total_volume_processed_ml: newTotalProcessed,
              updated_at: new Date().toISOString(),
            })
            .eq("id", usage.chemistry_id);
        }
      }
    }

    // Delete the session (cascade will delete session_films and session_chemistry_usage)
    const { error } = await supabase
      .from("development_sessions")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    revalidatePath("/develop");
    revalidatePath("/chemistry");
    return { success: true };
  } catch (error) {
    console.error("Error deleting development session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete development session",
    };
  }
}

// Mark films as externally developed (lab developed)
export async function markFilmsAsExternallyDeveloped(
  filmId: string,
  quantity: number,
  processType: 'black_white' | 'color'
): Promise<CreateSessionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const sessionId = uuidv4();

    // Create a minimal session record for external development
    const newSession: Omit<DevelopmentSession, 'session_films' | 'session_chemistry_usage'> = {
      id: sessionId,
      user_id: user.id,
      session_date: new Date().toISOString().split('T')[0],
      process_type: processType,
      temperature_celsius: undefined,
      notes: "Developed externally (lab)",
      total_cost: 0,
      created_at: new Date().toISOString(),
    };

    const { error: sessionError } = await supabase
      .from("development_sessions")
      .insert([newSession]);

    if (sessionError) {
      throw sessionError;
    }

    // Insert session_films record
    const sessionFilm = {
      id: uuidv4(),
      session_id: sessionId,
      film_id: filmId,
      quantity: quantity,
      created_at: new Date().toISOString(),
    };

    const { error: filmsError } = await supabase
      .from("session_films")
      .insert([sessionFilm]);

    if (filmsError) {
      throw filmsError;
    }

    revalidatePath("/develop");
    revalidatePath("/develop/history");

    return { success: true, session: newSession as DevelopmentSession };
  } catch (error) {
    console.error("Error marking film as externally developed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark film as externally developed",
    };
  }
}
