"use server";

import { createClient } from "@/lib/supabase/server";
import { Film, FilmUsage } from "@/lib/utils";
import { getDevelopmentType, calculateTotalCost } from "@/lib/usage-utils";

export interface UsageData extends FilmUsage {
  film: Film;
  development_cost: number;
  development_type: string;
  film_cost: number;
  total_cost: number;
}

export interface BulkFilmStats {
  totalExposuresSpooled: number;
  totalCassettesCreated: number;
  totalRollsShot: number;
  bulkFilmsSpoiled: Film[];
  activeSpooling: {
    filmName: string;
    remainingExposures: number;
    spooledCassettes: number;
  }[];
}

export interface WeeklyUsage {
  week: string;
  rolls_used: number;
  total_cost: number;
  film_cost: number;
  development_cost: number;
}

export interface MonthlyUsage {
  month: string;
  rolls_used: number;
  total_cost: number;
  film_cost: number;
  development_cost: number;
  film_types: Record<string, number>;
}

export async function getAllUsageData(): Promise<{
  data: UsageData[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get all usage data with film information
    const { data: usageData, error } = await supabase
      .from("film_usage")
      .select(
        `
        *,
        films (*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Enrich data with cost calculations
    const enrichedData: UsageData[] = usageData.map((usage) => {
      const film = usage.films as Film;
      const costs = calculateTotalCost(film, usage.quantity);

      return {
        ...usage,
        film,
        development_cost: costs.developmentCost,
        development_type: getDevelopmentType(film),
        film_cost: costs.filmCost,
        total_cost: costs.totalCost,
      };
    });

    return { data: enrichedData, error: null };
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to fetch usage data",
    };
  }
}

export async function getWeeklyUsageStats(): Promise<{
  data: WeeklyUsage[] | null;
  error: string | null;
}> {
  try {
    const { data: allUsage, error } = await getAllUsageData();

    if (error || !allUsage) {
      return { data: null, error };
    }

    // Group by week
    const weeklyStats = new Map<string, WeeklyUsage>();

    allUsage.forEach((usage) => {
      const date = new Date(usage.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyStats.has(weekKey)) {
        weeklyStats.set(weekKey, {
          week: weekKey,
          rolls_used: 0,
          total_cost: 0,
          film_cost: 0,
          development_cost: 0,
        });
      }

      const week = weeklyStats.get(weekKey)!;
      week.rolls_used += usage.quantity;
      week.total_cost += usage.total_cost;
      week.film_cost += usage.film_cost;
      week.development_cost += usage.development_cost;
    });

    const sortedWeeks = Array.from(weeklyStats.values())
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-12); // Last 12 weeks

    return { data: sortedWeeks, error: null };
  } catch (error) {
    console.error("Error calculating weekly stats:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate weekly stats",
    };
  }
}

export async function getMonthlyUsageStats(): Promise<{
  data: MonthlyUsage[] | null;
  error: string | null;
}> {
  try {
    const { data: allUsage, error } = await getAllUsageData();

    if (error || !allUsage) {
      return { data: null, error };
    }

    // Group by month
    const monthlyStats = new Map<string, MonthlyUsage>();

    allUsage.forEach((usage) => {
      const date = new Date(usage.created_at);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyStats.has(monthKey)) {
        monthlyStats.set(monthKey, {
          month: monthKey,
          rolls_used: 0,
          total_cost: 0,
          film_cost: 0,
          development_cost: 0,
          film_types: {},
        });
      }

      const month = monthlyStats.get(monthKey)!;
      month.rolls_used += usage.quantity;
      month.total_cost += usage.total_cost;
      month.film_cost += usage.film_cost;
      month.development_cost += usage.development_cost;

      // Track film types
      const filmType = usage.development_type;
      month.film_types[filmType] =
        (month.film_types[filmType] || 0) + usage.quantity;
    });

    const sortedMonths = Array.from(monthlyStats.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    return { data: sortedMonths, error: null };
  } catch (error) {
    console.error("Error calculating monthly stats:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate monthly stats",
    };
  }
}

export async function getTripUsageStats(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get trips with film usage
    const { data: trips, error } = await supabase
      .from("trips")
      .select(
        `
        *,
        trip_films (
          quantity,
          films (*)
        )
      `
      )
      .order("start_date", { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate costs for each trip
    const tripStats = trips.map((trip) => {
      let totalRolls = 0;
      let totalCost = 0;
      let filmCost = 0;
      let developmentCost = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trip.trip_films?.forEach((tf: any) => {
        const film = tf.films as Film;
        const costs = calculateTotalCost(film, tf.quantity);

        totalRolls += tf.quantity;
        totalCost += costs.totalCost;
        filmCost += costs.filmCost;
        developmentCost += costs.developmentCost;
      });

      return {
        ...trip,
        total_rolls: totalRolls,
        total_cost: totalCost,
        film_cost: filmCost,
        development_cost: developmentCost,
      };
    });

    return { data: tripStats, error: null };
  } catch (error) {
    console.error("Error fetching trip usage stats:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch trip usage stats",
    };
  }
}

export async function getShootingOnlyUsageData(): Promise<{
  data: UsageData[] | null;
  error: string | null;
}> {
  try {
    const { data: allUsage, error } = await getAllUsageData();
    
    if (error || !allUsage) {
      return { data: null, error };
    }

    // Filter to only include shooting usage (not spooling)
    const shootingUsage = allUsage.filter(usage => 
      usage.usage_type !== 'spool'
    );

    return { data: shootingUsage, error: null };
  } catch (error) {
    console.error("Error fetching shooting usage data:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch shooting usage data",
    };
  }
}

export async function getBulkFilmStats(): Promise<{
  data: BulkFilmStats | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get all bulk films
    const { data: bulkFilms, error: bulkError } = await supabase
      .from("films")
      .select("*")
      .eq("is_bulk_film", true)
      .is("deleted_at", null);

    if (bulkError) {
      throw bulkError;
    }

    // Get all spooling usage
    const { data: spoolingUsage, error: spoolingError } = await supabase
      .from("film_usage")
      .select("*")
      .eq("usage_type", "spool");

    if (spoolingError) {
      throw spoolingError;
    }

    // Get all shooting usage for bulk films  
    const { data: shootingUsage, error: shootingError } = await supabase
      .from("film_usage")
      .select("*")
      .eq("usage_type", "shoot")
      .in("film_id", bulkFilms?.map(f => f.id) || []);

    if (shootingError) {
      throw shootingError;
    }

    // Calculate totals
    const totalExposuresSpooled = spoolingUsage?.reduce((sum, usage) => 
      sum + (usage.exposures_used || 0), 0) || 0;
    
    const totalCassettesCreated = spoolingUsage?.reduce((sum, usage) => 
      sum + usage.quantity, 0) || 0;
    
    const totalRollsShot = shootingUsage?.reduce((sum, usage) => 
      sum + usage.quantity, 0) || 0;

    // Find films that have been completely used up
    const bulkFilmsSpoiled = bulkFilms?.filter(film => 
      (film.bulk_remaining_exposures || 0) === 0
    ) || [];

    // Active spooling status
    const activeSpooling = bulkFilms?.filter(film => 
      (film.bulk_remaining_exposures || 0) > 0
    ).map(film => ({
      filmName: `${film.brand} ${film.name}`,
      remainingExposures: film.bulk_remaining_exposures || 0,
      spooledCassettes: film.spooled_cassettes || 0,
    })) || [];

    const stats: BulkFilmStats = {
      totalExposuresSpooled,
      totalCassettesCreated,
      totalRollsShot,
      bulkFilmsSpoiled,
      activeSpooling,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error("Error fetching bulk film stats:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch bulk film stats",
    };
  }
}
