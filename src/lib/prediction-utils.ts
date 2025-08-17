import { WeeklyUsage, MonthlyUsage } from "@/app/actions/usage";

// Core prediction data types
export interface WeeklyPrediction {
  conservative: number;    // 25th percentile
  expected: number;        // 50th percentile  
  optimistic: number;      // 75th percentile
  confidence: number;      // 0-100%
  trend: 'increasing' | 'stable' | 'decreasing';
  developmentCost: { min: number; max: number; expected: number };
  patternInsights: string[];
}

export interface MonthlyPrediction {
  conservative: number;
  expected: number;
  optimistic: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  developmentCost: { min: number; max: number; expected: number };
  seasonalMultiplier: number;
  peakPeriod: boolean;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: number;        // 0-100%
  changeRate: number;      // % change per period
  significance: boolean;   // statistically significant
}

export interface SeasonalPattern {
  monthlyMultipliers: Record<string, number>;
  peakMonths: string[];
  lowMonths: string[];
  weekdayPreference: Record<string, number>;
}

// Basic statistical functions
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (Math.floor(index) === index) {
    return sorted[index];
  }
  
  const lower = sorted[Math.floor(index)];
  const upper = sorted[Math.ceil(index)];
  const weight = index - Math.floor(index);
  
  return lower + (upper - lower) * weight;
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// Moving average calculations
export function calculateMovingAverage(data: number[], periods: number): number {
  if (data.length === 0 || periods <= 0) return 0;
  
  const recentData = data.slice(-periods);
  return calculateMean(recentData);
}

export function exponentialSmoothing(data: number[], alpha: number = 0.3): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];
  
  let smoothed = data[0];
  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i] + (1 - alpha) * smoothed;
  }
  
  return smoothed;
}

// Trend analysis
export function detectTrend(values: number[]): TrendAnalysis {
  if (values.length < 3) {
    return {
      direction: 'stable',
      strength: 0,
      changeRate: 0,
      significance: false
    };
  }
  
  // Calculate linear regression slope
  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = calculateMean(xValues);
  const yMean = calculateMean(values);
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = values[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  
  // Calculate correlation coefficient for significance
  let correlation = 0;
  if (denominator !== 0) {
    const yVariance = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    correlation = Math.abs(numerator) / Math.sqrt(denominator * yVariance);
  }
  
  const direction = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable';
  const strength = Math.min(Math.abs(slope) * 50, 100); // Scale to 0-100
  const changeRate = (slope / yMean) * 100; // Percentage change per period
  const significance = correlation > 0.5 && values.length >= 6; // Strong correlation with enough data
  
  return {
    direction,
    strength,
    changeRate,
    significance
  };
}

// Weekly prediction engine
export function predictWeeklyUsage(weeklyData: WeeklyUsage[]): WeeklyPrediction {
  if (weeklyData.length === 0) {
    return {
      conservative: 0,
      expected: 0,
      optimistic: 0,
      confidence: 0,
      trend: 'stable',
      developmentCost: { min: 0, max: 0, expected: 0 },
      patternInsights: ['Not enough data for predictions']
    };
  }
  
  const rollsData = weeklyData.map(w => w.rolls_used);
  const costData = weeklyData.map(w => w.development_cost);
  
  // Calculate multiple prediction methods
  const sma4 = calculateMovingAverage(rollsData, 4);
  const sma8 = calculateMovingAverage(rollsData, 8);
  const expSmoothed = exponentialSmoothing(rollsData);
  const median = calculateMedian(rollsData);
  
  // Trend analysis
  const trend = detectTrend(rollsData);
  const trendAdjustment = trend.direction === 'up' ? 1.1 : trend.direction === 'down' ? 0.9 : 1.0;
  
  // Combine predictions (weighted average)
  const basePrediction = (sma4 * 0.4 + expSmoothed * 0.3 + median * 0.2 + sma8 * 0.1) * trendAdjustment;
  
  // Calculate confidence based on data consistency
  const stdDev = calculateStandardDeviation(rollsData);
  const coefficientOfVariation = stdDev / calculateMean(rollsData);
  const confidence = Math.max(10, Math.min(95, 90 - (coefficientOfVariation * 100)));
  
  // Calculate prediction intervals
  const expected = Math.max(0, Math.round(basePrediction));
  const variance = stdDev * (confidence < 70 ? 2 : confidence < 85 ? 1.5 : 1);
  const conservative = Math.max(0, Math.round(expected - variance));
  const optimistic = Math.round(expected + variance);
  
  // Cost predictions (average cost per roll from recent data)
  const avgCostPerRoll = costData.length > 0 ? calculateMean(costData) / calculateMean(rollsData) : 9;
  const developmentCost = {
    min: conservative * avgCostPerRoll,
    max: optimistic * avgCostPerRoll,
    expected: expected * avgCostPerRoll
  };
  
  // Generate insights
  const patternInsights = generateWeeklyInsights(weeklyData, trend);
  
  return {
    conservative,
    expected,
    optimistic,
    confidence: Math.round(confidence),
    trend: trend.direction === 'up' ? 'increasing' : trend.direction === 'down' ? 'decreasing' : 'stable',
    developmentCost,
    patternInsights
  };
}

// Monthly prediction engine
export function predictMonthlyUsage(monthlyData: MonthlyUsage[]): MonthlyPrediction {
  if (monthlyData.length === 0) {
    return {
      conservative: 0,
      expected: 0,
      optimistic: 0,
      confidence: 0,
      trend: 'stable',
      developmentCost: { min: 0, max: 0, expected: 0 },
      seasonalMultiplier: 1.0,
      peakPeriod: false
    };
  }
  
  const rollsData = monthlyData.map(m => m.rolls_used);
  const costData = monthlyData.map(m => m.development_cost);
  
  // Calculate predictions
  const sma3 = calculateMovingAverage(rollsData, 3);
  const sma6 = calculateMovingAverage(rollsData, 6);
  const expSmoothed = exponentialSmoothing(rollsData);
  
  // Seasonal analysis
  const currentMonth = new Date().getMonth() + 1;
  const seasonalMultiplier = calculateSeasonalMultiplier(monthlyData, currentMonth);
  
  // Trend analysis
  const trend = detectTrend(rollsData);
  const trendAdjustment = trend.direction === 'up' ? 1.15 : trend.direction === 'down' ? 0.85 : 1.0;
  
  // Combine predictions with seasonal adjustment
  const basePrediction = (sma3 * 0.5 + expSmoothed * 0.3 + sma6 * 0.2) * seasonalMultiplier * trendAdjustment;
  
  // Calculate confidence
  const stdDev = calculateStandardDeviation(rollsData);
  const confidence = Math.max(15, Math.min(90, 85 - (stdDev / calculateMean(rollsData)) * 80));
  
  // Prediction intervals
  const expected = Math.max(0, Math.round(basePrediction));
  const variance = stdDev * 1.5;
  const conservative = Math.max(0, Math.round(expected - variance));
  const optimistic = Math.round(expected + variance * 1.2);
  
  // Cost predictions
  const avgCostPerRoll = costData.length > 0 ? calculateMean(costData) / calculateMean(rollsData) : 9;
  const developmentCost = {
    min: conservative * avgCostPerRoll,
    max: optimistic * avgCostPerRoll,
    expected: expected * avgCostPerRoll
  };
  
  // Peak period detection (above average + seasonal boost)
  const yearlyAverage = calculateMean(rollsData);
  const peakPeriod = expected > yearlyAverage * 1.2;
  
  return {
    conservative,
    expected,
    optimistic,
    confidence: Math.round(confidence),
    trend: trend.direction === 'up' ? 'increasing' : trend.direction === 'down' ? 'decreasing' : 'stable',
    developmentCost,
    seasonalMultiplier,
    peakPeriod
  };
}

// Helper function to calculate seasonal multipliers
function calculateSeasonalMultiplier(monthlyData: MonthlyUsage[], targetMonth: number): number {
  if (monthlyData.length < 6) return 1.0;
  
  // Group by month
  const monthlyAverages: Record<number, number[]> = {};
  
  monthlyData.forEach(data => {
    const month = parseInt(data.month.split('-')[1]);
    if (!monthlyAverages[month]) {
      monthlyAverages[month] = [];
    }
    monthlyAverages[month].push(data.rolls_used);
  });
  
  // Calculate overall average
  const overallAverage = calculateMean(monthlyData.map(d => d.rolls_used));
  
  // Calculate target month average
  const targetMonthData = monthlyAverages[targetMonth];
  if (!targetMonthData || targetMonthData.length === 0) return 1.0;
  
  const targetMonthAverage = calculateMean(targetMonthData);
  
  // Return multiplier (how much above/below average this month typically is)
  return overallAverage > 0 ? targetMonthAverage / overallAverage : 1.0;
}

// Generate weekly pattern insights
function generateWeeklyInsights(weeklyData: WeeklyUsage[], trend: TrendAnalysis): string[] {
  const insights: string[] = [];
  
  if (weeklyData.length < 4) {
    insights.push('Collecting more data to improve predictions');
    return insights;
  }
  
  const recentAverage = calculateMean(weeklyData.slice(-4).map(w => w.rolls_used));
  const overallAverage = calculateMean(weeklyData.map(w => w.rolls_used));
  
  // Trend insights
  if (trend.significance) {
    if (trend.direction === 'up') {
      insights.push(`📈 Usage trending up ${Math.abs(trend.changeRate).toFixed(1)}% per week`);
    } else if (trend.direction === 'down') {
      insights.push(`📉 Usage trending down ${Math.abs(trend.changeRate).toFixed(1)}% per week`);
    }
  }
  
  // Recent activity insights
  if (recentAverage > overallAverage * 1.3) {
    insights.push('🔥 You\'ve been shooting more lately');
  } else if (recentAverage < overallAverage * 0.7) {
    insights.push('📱 Quieter shooting period recently');
  }
  
  // Consistency insights
  const stdDev = calculateStandardDeviation(weeklyData.map(w => w.rolls_used));
  const consistency = stdDev / overallAverage;
  
  if (consistency < 0.3) {
    insights.push('🎯 Very consistent shooting pattern');
  } else if (consistency > 0.8) {
    insights.push('🎲 Highly variable shooting pattern');
  }
  
  return insights;
}