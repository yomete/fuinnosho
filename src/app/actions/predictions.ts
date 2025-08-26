"use server";

import {
  getWeeklyUsageStats,
  getMonthlyUsageStats,
  getBulkFilmStats,
  getShootingOnlyUsageData,
  type BulkFilmStats,
  type MonthlyUsage,
} from "./usage";
import { createClient } from "@/lib/supabase/server";
import {
  predictWeeklyUsage,
  predictMonthlyUsage,
  WeeklyPrediction,
  MonthlyPrediction,
  TrendAnalysis,
  detectTrend,
  calculateMean,
} from "@/lib/prediction-utils";

export interface PredictiveAnalysis {
  weeklyForecast: WeeklyPrediction;
  monthlyForecast: MonthlyPrediction;
  trendAnalysis: TrendAnalysis;
  shootingInsights: string[];
  stockRecommendations: StockRecommendation[];
  budgetAlert?: BudgetAlert;
  plannedTrips: PlannedTripImpact[];
  bulkFilmInsights?: BulkFilmPredictions;
}

export interface BulkFilmPredictions {
  spoolingEfficiencyTrend: "improving" | "declining" | "stable";
  predictedSpoolingNeed: {
    weeksUntilEmpty: number[];
    recommendedSpooling: {
      filmName: string;
      exposuresToSpool: number;
      cassettesToCreate: number;
    }[];
  };
  wasteAnalysis: {
    totalWastedCassettes: number;
    wastePercentage: number;
    recommendation: string;
  };
}

export interface PlannedTripImpact {
  tripTitle: string;
  tripDate: string;
  tripEndDate: string;
  reservedRolls: number;
  developmentCost: number;
  daysFromNow: number;
  impactsWeek: boolean;
  impactsMonth: boolean;
}

export interface StockRecommendation {
  filmType: string;
  action: "buy" | "sufficient" | "oversupplied";
  reason: string;
  recommendedQuantity?: number;
  urgency: "low" | "medium" | "high";
}

export interface BudgetAlert {
  type: "high" | "unusual" | "trend";
  message: string;
  amount: number;
  comparison: string;
}

export async function getPredictiveAnalysis(): Promise<{
  data: PredictiveAnalysis | null;
  error: string | null;
}> {
  try {
    // Get historical data and planned trips
    const [
      weeklyResult,
      monthlyResult,
      allUsageResult,
      plannedTripsResult,
      bulkStatsResult,
    ] = await Promise.all([
      getWeeklyUsageStats(),
      getMonthlyUsageStats(),
      getShootingOnlyUsageData(), // Use shooting-only data for predictions
      getPlannedTrips(),
      getBulkFilmStats(),
    ]);

    if (weeklyResult.error || monthlyResult.error || allUsageResult.error) {
      throw new Error("Failed to fetch usage data for predictions");
    }

    const weeklyData = weeklyResult.data || [];
    const monthlyData = monthlyResult.data || [];
    const allUsageData = allUsageResult.data || [];
    const plannedTrips = plannedTripsResult.data || [];
    const bulkStats = bulkStatsResult.data;

    // Calculate planned trip impacts
    const weeklyTripImpact = plannedTrips
      .filter((trip) => trip.impactsWeek)
      .reduce((sum, trip) => sum + trip.reservedRolls, 0);

    const monthlyTripImpact = plannedTrips
      .filter((trip) => trip.impactsMonth)
      .reduce((sum, trip) => sum + trip.reservedRolls, 0);

    const monthlyTripCosts = plannedTrips
      .filter((trip) => trip.impactsMonth)
      .reduce((sum, trip) => sum + trip.developmentCost, 0);

    // Generate predictions with trip adjustments
    const baseWeeklyForecast = predictWeeklyUsage(weeklyData);
    const baseMonthlyForecast = predictMonthlyUsage(monthlyData);

    // Enhance predictions with planned trips
    const weeklyForecast = enhanceWeeklyPrediction(
      baseWeeklyForecast,
      weeklyTripImpact
    );
    const monthlyForecast = enhanceMonthlyPrediction(
      baseMonthlyForecast,
      monthlyTripImpact,
      monthlyTripCosts
    );

    // Trend analysis on monthly data
    const monthlyRolls = monthlyData.map((m) => m.rolls_used);
    const trendAnalysis = detectTrend(monthlyRolls);

    // Generate insights with trip awareness
    const shootingInsights = generateShootingInsights(
      weeklyData,
      monthlyData,
      trendAnalysis,
      plannedTrips
    );

    // Stock recommendations with trip planning
    const stockRecommendations = generateStockRecommendations(
      allUsageData,
      weeklyForecast,
      monthlyForecast,
      plannedTrips
    );

    // Budget alerts including planned trips
    const budgetAlert = generateBudgetAlert(monthlyData, monthlyForecast);

    // Bulk film predictions
    const bulkFilmInsights = bulkStats
      ? generateBulkFilmPredictions(bulkStats, monthlyData)
      : undefined;

    const analysis: PredictiveAnalysis = {
      weeklyForecast,
      monthlyForecast,
      trendAnalysis,
      shootingInsights,
      stockRecommendations,
      budgetAlert,
      plannedTrips,
      bulkFilmInsights,
    };

    return { data: analysis, error: null };
  } catch (error) {
    console.error("Error generating predictive analysis:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate predictions",
    };
  }
}

interface SeasonalData {
  monthlyMultipliers: Record<string, number>;
  peakMonths: string[];
  lowMonths: string[];
  seasonalTrend: string;
  bestShootingMonths: string[];
  quietestMonths: string[];
}

export async function getSeasonalPatterns(): Promise<{
  data: SeasonalData | null;
  error: string | null;
}> {
  try {
    const { data: monthlyData, error } = await getMonthlyUsageStats();

    if (error || !monthlyData) {
      return { data: null, error: error || "No monthly data available" };
    }

    // Group by month (1-12)
    const monthlyAverages: Record<number, number[]> = {};
    const monthlyDevelopmentCosts: Record<number, number[]> = {};

    monthlyData.forEach((data) => {
      const month = parseInt(data.month.split("-")[1]);

      if (!monthlyAverages[month]) {
        monthlyAverages[month] = [];
        monthlyDevelopmentCosts[month] = [];
      }

      monthlyAverages[month].push(data.rolls_used);
      monthlyDevelopmentCosts[month].push(data.development_cost);
    });

    // Calculate seasonal patterns
    const overallAverage = calculateMean(monthlyData.map((d) => d.rolls_used));
    const monthlyMultipliers: Record<string, number> = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyAverages[month];
      if (monthData && monthData.length > 0) {
        const monthAverage = calculateMean(monthData);
        monthlyMultipliers[monthNames[month - 1]] =
          overallAverage > 0 ? monthAverage / overallAverage : 1.0;
      } else {
        monthlyMultipliers[monthNames[month - 1]] = 1.0;
      }
    }

    // Identify peak and low months
    const multiplierEntries = Object.entries(monthlyMultipliers);
    const peakMonths = multiplierEntries
      .filter(([, multiplier]) => multiplier > 1.2)
      .map(([month]) => month);

    const lowMonths = multiplierEntries
      .filter(([, multiplier]) => multiplier < 0.8)
      .map(([month]) => month);

    const patterns = {
      monthlyMultipliers,
      peakMonths,
      lowMonths,
      seasonalTrend: peakMonths.length > 0 ? "seasonal" : "consistent",
      bestShootingMonths: peakMonths.slice(0, 3),
      quietestMonths: lowMonths.slice(0, 3),
    };

    return { data: patterns, error: null };
  } catch (error) {
    console.error("Error calculating seasonal patterns:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate seasonal patterns",
    };
  }
}

// Helper functions
function enhanceWeeklyPrediction(
  basePrediction: WeeklyPrediction,
  tripImpact: number
): WeeklyPrediction {
  if (tripImpact === 0) return basePrediction;

  return {
    ...basePrediction,
    conservative: basePrediction.conservative + tripImpact,
    expected: basePrediction.expected + tripImpact,
    optimistic: basePrediction.optimistic + tripImpact,
    developmentCost: {
      min: basePrediction.developmentCost.min,
      max: basePrediction.developmentCost.max,
      expected: basePrediction.developmentCost.expected,
    },
    patternInsights: [
      ...basePrediction.patternInsights,
      `📅 +${tripImpact} rolls from planned trips`,
    ],
  };
}

function enhanceMonthlyPrediction(
  basePrediction: MonthlyPrediction,
  tripImpact: number,
  tripCosts: number
): MonthlyPrediction {
  if (tripImpact === 0) return basePrediction;

  return {
    ...basePrediction,
    conservative: basePrediction.conservative + tripImpact,
    expected: basePrediction.expected + tripImpact,
    optimistic: basePrediction.optimistic + tripImpact,
    developmentCost: {
      min: basePrediction.developmentCost.min + tripCosts,
      max: basePrediction.developmentCost.max + tripCosts,
      expected: basePrediction.developmentCost.expected + tripCosts,
    },
  };
}

interface UsageData {
  rolls_used: number;
  development_cost: number;
}

function generateShootingInsights(
  weeklyData: UsageData[],
  monthlyData: UsageData[],
  trend: TrendAnalysis,
  plannedTrips: PlannedTripImpact[]
): string[] {
  const insights: string[] = [];

  if (weeklyData.length === 0 || monthlyData.length === 0) {
    insights.push("Collecting data to generate personalized insights");
    return insights;
  }

  // Overall activity level
  const recentWeeks = weeklyData.slice(-4);
  const avgRecentWeekly = calculateMean(recentWeeks.map((w) => w.rolls_used));
  const avgOverallWeekly = calculateMean(weeklyData.map((w) => w.rolls_used));

  if (avgRecentWeekly > avgOverallWeekly * 1.5) {
    insights.push("🔥 You're in a very active shooting period!");
  } else if (avgRecentWeekly < avgOverallWeekly * 0.6) {
    insights.push("📷 Taking a break from shooting lately");
  }

  // Trend insights
  if (trend.significance) {
    if (trend.direction === "up" && trend.strength > 50) {
      insights.push(
        `📈 Strong upward trend: +${Math.abs(trend.changeRate).toFixed(
          1
        )}% per month`
      );
    } else if (trend.direction === "down" && trend.strength > 50) {
      insights.push(
        `📉 Declining usage: ${Math.abs(trend.changeRate).toFixed(
          1
        )}% per month`
      );
    }
  }

  // Consistency insights
  const monthlyRolls = monthlyData.map((m) => m.rolls_used);
  const monthlyStdDev = calculateStandardDeviation(monthlyRolls);
  const monthlyMean = calculateMean(monthlyRolls);
  const consistency = monthlyStdDev / monthlyMean;

  if (consistency < 0.3) {
    insights.push("🎯 Very consistent shooting habits");
  } else if (consistency > 0.8) {
    insights.push("🎲 Variable shooting patterns - you adapt to opportunities");
  }

  // Recent vs historical comparison
  const recentMonth = monthlyData[monthlyData.length - 1];
  const historicalAvg = calculateMean(
    monthlyData.slice(0, -1).map((m) => m.rolls_used)
  );

  if (recentMonth && recentMonth.rolls_used > historicalAvg * 1.3) {
    insights.push("🚀 Last month was above average for you");
  }

  // Planned trip insights
  const upcomingTrips = plannedTrips.filter((trip) => trip.daysFromNow <= 30);
  if (upcomingTrips.length > 0) {
    const totalTripRolls = upcomingTrips.reduce(
      (sum, trip) => sum + trip.reservedRolls,
      0
    );
    if (upcomingTrips.length === 1) {
      insights.push(
        `🎒 "${upcomingTrips[0].tripTitle}" planned in ${upcomingTrips[0].daysFromNow} days (${upcomingTrips[0].reservedRolls} rolls)`
      );
    } else {
      insights.push(
        `🗓️ ${upcomingTrips.length} trips planned this month (${totalTripRolls} rolls total)`
      );
    }
  }

  // Trip frequency insights
  if (plannedTrips.length > 2) {
    insights.push(
      "📸 You're a frequent trip planner - great for consistent shooting!"
    );
  }

  return insights;
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}

interface AllUsageData {
  development_type: string;
  quantity: number;
}

function generateStockRecommendations(
  allUsageData: AllUsageData[],
  weeklyForecast: WeeklyPrediction,
  monthlyForecast: MonthlyPrediction,
  plannedTrips: PlannedTripImpact[]
): StockRecommendation[] {
  const recommendations: StockRecommendation[] = [];

  if (allUsageData.length === 0) {
    return [
      {
        filmType: "General",
        action: "sufficient",
        reason: "Not enough usage data for specific recommendations",
        urgency: "low",
      },
    ];
  }

  // Analyze usage by film type
  const typeUsage: Record<string, number> = {};
  allUsageData.forEach((usage) => {
    const type = usage.development_type;
    typeUsage[type] = (typeUsage[type] || 0) + usage.quantity;
  });

  const totalUsage = Object.values(typeUsage).reduce(
    (sum, count) => sum + count,
    0
  );

  // Generate recommendations based on predicted usage + planned trips
  Object.entries(typeUsage).forEach(([filmType, usage]) => {
    const proportion = usage / totalUsage;
    const basePredictedUsage = monthlyForecast.expected * proportion;

    // Estimate trip impact for this film type (assuming similar distribution)
    const plannedTripUsage =
      plannedTrips
        .filter((trip) => trip.impactsMonth)
        .reduce((sum, trip) => sum + trip.reservedRolls, 0) * proportion;

    const totalPredictedUsage = basePredictedUsage + plannedTripUsage;

    let action: "buy" | "sufficient" | "oversupplied" = "sufficient";
    let reason = "";
    let urgency: "low" | "medium" | "high" = "low";
    let recommendedQuantity: number | undefined;

    if (totalPredictedUsage > 8) {
      action = "buy";
      const tripPart =
        plannedTripUsage > 0
          ? ` (${Math.round(plannedTripUsage)} from trips)`
          : "";
      reason = `High predicted usage: ~${Math.round(
        totalPredictedUsage
      )} rolls next month${tripPart}`;
      urgency = "medium";
      recommendedQuantity = Math.ceil(totalPredictedUsage * 1.2); // 20% buffer
    } else if (totalPredictedUsage > 5) {
      action = "buy";
      const tripPart = plannedTripUsage > 0 ? ` (includes trips)` : "";
      reason = `Moderate usage predicted: ~${Math.round(
        totalPredictedUsage
      )} rolls${tripPart}`;
      urgency = "low";
      recommendedQuantity = Math.ceil(totalPredictedUsage);
    } else if (totalPredictedUsage < 2) {
      action = "sufficient";
      reason = "Low predicted usage - current stock should suffice";
    }

    // Weekly urgency adjustment
    if (weeklyForecast.expected > 4 && action === "buy") {
      urgency = urgency === "low" ? "medium" : "high";
    }

    recommendations.push({
      filmType: `${filmType} films`,
      action,
      reason,
      recommendedQuantity,
      urgency,
    });
  });

  return recommendations;
}

function generateBudgetAlert(
  monthlyData: UsageData[],
  monthlyForecast: MonthlyPrediction
): BudgetAlert | undefined {
  if (monthlyData.length < 3) return undefined;

  const historicalCosts = monthlyData.map((m) => m.development_cost);
  const avgCost = calculateMean(historicalCosts);
  const predictedCost = monthlyForecast.developmentCost.expected;

  // High cost alert
  if (predictedCost > avgCost * 1.5) {
    return {
      type: "high",
      message:
        "Next month's predicted lab costs are significantly higher than usual",
      amount: predictedCost,
      comparison: `vs €${avgCost.toFixed(2)} average`,
    };
  }

  // Unusual spending pattern
  if (predictedCost > avgCost * 1.3) {
    return {
      type: "unusual",
      message: "Predicted lab costs are above your typical range",
      amount: predictedCost,
      comparison: `vs €${avgCost.toFixed(2)} average`,
    };
  }

  // Trend-based alert
  const recentTrend = monthlyData.slice(-3).map((m) => m.development_cost);
  const trendDirection = detectTrend(recentTrend);

  if (trendDirection.direction === "up" && trendDirection.strength > 60) {
    return {
      type: "trend",
      message: "Lab costs have been trending upward recently",
      amount: predictedCost,
      comparison: `+${Math.abs(trendDirection.changeRate).toFixed(1)}% trend`,
    };
  }

  return undefined;
}

async function getPlannedTrips(): Promise<{
  data: PlannedTripImpact[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get future trips with film reservations
    const { data: trips, error } = await supabase
      .from("trips")
      .select(
        `
        id,
        title,
        start_date,
        end_date,
        trip_films (
          quantity,
          films (
            type,
            brand
          )
        )
      `
      )
      .gte("start_date", new Date().toISOString().split("T")[0]) // Future trips only
      .order("start_date", { ascending: true });

    if (error) {
      throw error;
    }

    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plannedTrips: PlannedTripImpact[] = trips.map((trip: any) => {
      const tripStartDate = new Date(trip.start_date);
      const daysFromNow = Math.ceil(
        (tripStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate total reserved rolls and estimated development cost
      let totalRolls = 0;
      let totalDevCost = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trip.trip_films?.forEach((tf: any) => {
        totalRolls += tf.quantity;

        // Calculate development cost based on film type
        const film = tf.films;
        const isECN = ["35mmdealer", "safelight"].some((brand) =>
          film?.brand?.toLowerCase().includes(brand.toLowerCase())
        );
        const devCost = isECN ? 9 : film?.type === "Color Negative" ? 6 : 9;
        totalDevCost += devCost * tf.quantity;
      });

      return {
        tripTitle: trip.title,
        tripDate: trip.start_date,
        tripEndDate: trip.end_date,
        reservedRolls: totalRolls,
        developmentCost: totalDevCost,
        daysFromNow,
        impactsWeek: tripStartDate <= oneWeekFromNow,
        impactsMonth: tripStartDate <= oneMonthFromNow,
      };
    });

    return { data: plannedTrips, error: null };
  } catch (error) {
    console.error("Error fetching planned trips:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch planned trips",
    };
  }
}

function generateBulkFilmPredictions(
  bulkStats: BulkFilmStats,
  monthlyData: MonthlyUsage[]
): BulkFilmPredictions {
  // Calculate spooling efficiency trend
  const spooledCassettes = bulkStats.totalCassettesCreated || 0;
  const shotRolls = bulkStats.totalRollsShot || 0;
  const wastedCassettes = Math.max(0, spooledCassettes - shotRolls);
  const wastePercentage =
    spooledCassettes > 0 ? (wastedCassettes / spooledCassettes) * 100 : 0;

  // Determine efficiency trend (simplified for now - could be enhanced with historical data)
  let spoolingEfficiencyTrend: "improving" | "declining" | "stable" = "stable";
  if (wastePercentage < 10) {
    spoolingEfficiencyTrend = "improving";
  } else if (wastePercentage > 30) {
    spoolingEfficiencyTrend = "declining";
  }

  // Calculate weekly consumption rate from monthly data
  const recentMonthly = monthlyData.slice(-3);
  const avgMonthlyUsage =
    recentMonthly.length > 0
      ? recentMonthly.reduce((sum, m) => sum + m.rolls_used, 0) /
        recentMonthly.length
      : 1;
  const avgWeeklyUsage = avgMonthlyUsage / 4.33; // Average weeks per month

  // Predict when active bulk films will run out and recommend spooling
  const weeksUntilEmpty: number[] = [];
  const recommendedSpooling: {
    filmName: string;
    exposuresToSpool: number;
    cassettesToCreate: number;
  }[] = [];

  bulkStats.activeSpooling?.forEach((film) => {
    const currentCassettes = film.spooledCassettes || 0;
    const exposuresPerRoll = film.filmName.includes("120") ? 12 : 36; // Simplified format detection

    // Calculate weeks until current spooled cassettes run out
    const weeksLeft =
      currentCassettes > 0 ? currentCassettes / avgWeeklyUsage : 0;
    weeksUntilEmpty.push(Math.round(weeksLeft));

    // Recommend spooling if less than 2 weeks of cassettes remain
    if (weeksLeft < 2 && film.remainingExposures > 0) {
      const recommendedCassettes = Math.max(4, Math.ceil(avgWeeklyUsage * 4)); // 4 weeks worth
      const exposuresToSpool = Math.min(
        recommendedCassettes * exposuresPerRoll,
        film.remainingExposures
      );

      recommendedSpooling.push({
        filmName: film.filmName,
        exposuresToSpool,
        cassettesToCreate: Math.floor(exposuresToSpool / exposuresPerRoll),
      });
    }
  });

  // Generate waste analysis recommendation
  let wasteRecommendation = "";
  if (wastePercentage > 30) {
    wasteRecommendation =
      "Consider spooling fewer cassettes at once to reduce waste from unused film.";
  } else if (wastePercentage < 5) {
    wasteRecommendation =
      "Excellent spooling efficiency! Your cassette usage is very optimized.";
  } else {
    wasteRecommendation =
      "Good spooling efficiency. Continue monitoring your usage patterns.";
  }

  return {
    spoolingEfficiencyTrend,
    predictedSpoolingNeed: {
      weeksUntilEmpty,
      recommendedSpooling,
    },
    wasteAnalysis: {
      totalWastedCassettes: wastedCassettes,
      wastePercentage,
      recommendation: wasteRecommendation,
    },
  };
}
