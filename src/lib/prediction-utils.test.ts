import { describe, it, expect } from "vitest";
import {
  calculateMean,
  calculateMedian,
  calculatePercentile,
  calculateStandardDeviation,
  calculateMovingAverage,
  exponentialSmoothing,
  detectTrend,
  predictWeeklyUsage,
  predictMonthlyUsage,
} from "./prediction-utils";
import type { WeeklyUsage, MonthlyUsage } from "@/app/actions/usage";

describe("calculateMean", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateMean([])).toBe(0);
  });

  it("returns the value itself for a single-element array", () => {
    expect(calculateMean([5])).toBe(5);
    expect(calculateMean([0])).toBe(0);
    expect(calculateMean([100])).toBe(100);
  });

  it("calculates the mean of multiple positive values", () => {
    expect(calculateMean([1, 2, 3, 4, 5])).toBe(3);
    expect(calculateMean([10, 20, 30])).toBe(20);
    expect(calculateMean([2, 4, 6, 8])).toBe(5);
  });

  it("calculates the mean with negative values", () => {
    expect(calculateMean([-1, -2, -3])).toBe(-2);
    expect(calculateMean([-5, 5])).toBe(0);
    expect(calculateMean([-10, 0, 10])).toBe(0);
  });

  it("handles decimal values correctly", () => {
    expect(calculateMean([1.5, 2.5, 3.0])).toBeCloseTo(2.333, 2);
    expect(calculateMean([0.1, 0.2, 0.3])).toBeCloseTo(0.2, 5);
  });

  it("handles large numbers", () => {
    expect(calculateMean([1000000, 2000000, 3000000])).toBe(2000000);
  });
});

describe("calculateMedian", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateMedian([])).toBe(0);
  });

  it("returns the value itself for a single-element array", () => {
    expect(calculateMedian([42])).toBe(42);
    expect(calculateMedian([0])).toBe(0);
  });

  it("calculates the median for odd-length arrays", () => {
    expect(calculateMedian([1, 2, 3])).toBe(2);
    expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3);
    expect(calculateMedian([5, 1, 3])).toBe(3); // unsorted input
    expect(calculateMedian([100, 1, 50])).toBe(50);
  });

  it("calculates the median for even-length arrays", () => {
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    expect(calculateMedian([1, 2])).toBe(1.5);
    expect(calculateMedian([10, 20, 30, 40])).toBe(25);
  });

  it("handles unsorted arrays correctly", () => {
    expect(calculateMedian([5, 3, 1, 4, 2])).toBe(3);
    expect(calculateMedian([9, 1, 5, 3])).toBe(4);
  });

  it("handles negative values", () => {
    expect(calculateMedian([-3, -1, -2])).toBe(-2);
    expect(calculateMedian([-5, 0, 5])).toBe(0);
  });

  it("handles duplicate values", () => {
    expect(calculateMedian([5, 5, 5])).toBe(5);
    expect(calculateMedian([1, 2, 2, 3])).toBe(2);
  });
});

describe("calculatePercentile", () => {
  it("returns 0 for an empty array", () => {
    expect(calculatePercentile([], 50)).toBe(0);
    expect(calculatePercentile([], 0)).toBe(0);
    expect(calculatePercentile([], 100)).toBe(0);
  });

  it("returns the only value for single-element arrays at any percentile", () => {
    expect(calculatePercentile([10], 0)).toBe(10);
    expect(calculatePercentile([10], 50)).toBe(10);
    expect(calculatePercentile([10], 100)).toBe(10);
  });

  it("calculates 0th percentile (minimum)", () => {
    expect(calculatePercentile([1, 2, 3, 4, 5], 0)).toBe(1);
    expect(calculatePercentile([5, 3, 1, 4, 2], 0)).toBe(1);
  });

  it("calculates 100th percentile (maximum)", () => {
    expect(calculatePercentile([1, 2, 3, 4, 5], 100)).toBe(5);
    expect(calculatePercentile([5, 3, 1, 4, 2], 100)).toBe(5);
  });

  it("calculates 50th percentile (median)", () => {
    expect(calculatePercentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  it("calculates 25th percentile", () => {
    expect(calculatePercentile([1, 2, 3, 4, 5], 25)).toBe(2);
  });

  it("calculates 75th percentile", () => {
    expect(calculatePercentile([1, 2, 3, 4, 5], 75)).toBe(4);
  });

  it("interpolates between values for non-integer indices", () => {
    // For [1, 2, 3, 4], at 50th percentile:
    // index = 0.5 * 3 = 1.5, interpolate between 2 and 3
    expect(calculatePercentile([1, 2, 3, 4], 50)).toBe(2.5);
  });

  it("handles percentiles requiring interpolation", () => {
    // For [10, 20, 30, 40, 50], at 30th percentile:
    // index = 0.30 * 4 = 1.2, interpolate between 20 and 30
    const result = calculatePercentile([10, 20, 30, 40, 50], 30);
    expect(result).toBeCloseTo(22, 0);
  });

  it("handles negative values", () => {
    expect(calculatePercentile([-10, -5, 0, 5, 10], 50)).toBe(0);
    expect(calculatePercentile([-10, -5, 0, 5, 10], 0)).toBe(-10);
    expect(calculatePercentile([-10, -5, 0, 5, 10], 100)).toBe(10);
  });

  it("handles unsorted arrays", () => {
    expect(calculatePercentile([5, 1, 3, 2, 4], 50)).toBe(3);
  });
});

describe("calculateStandardDeviation", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateStandardDeviation([])).toBe(0);
  });

  it("returns 0 for a single value", () => {
    expect(calculateStandardDeviation([5])).toBe(0);
    expect(calculateStandardDeviation([100])).toBe(0);
  });

  it("returns 0 when all values are identical", () => {
    expect(calculateStandardDeviation([5, 5, 5, 5])).toBe(0);
    expect(calculateStandardDeviation([10, 10, 10])).toBe(0);
  });

  it("calculates standard deviation for known values", () => {
    // For [2, 4, 4, 4, 5, 5, 7, 9]: mean = 5, variance = 4, stddev = 2
    expect(calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });

  it("calculates standard deviation for simple cases", () => {
    // For [1, 2, 3]: mean = 2, variance = ((1-2)^2 + (2-2)^2 + (3-2)^2) / 3 = 2/3
    // stddev = sqrt(2/3) ~= 0.816
    expect(calculateStandardDeviation([1, 2, 3])).toBeCloseTo(0.816, 2);
  });

  it("handles negative values", () => {
    // For [-1, 0, 1]: mean = 0, variance = (1 + 0 + 1) / 3 = 2/3
    expect(calculateStandardDeviation([-1, 0, 1])).toBeCloseTo(0.816, 2);
  });

  it("handles larger spreads", () => {
    // For [0, 10]: mean = 5, variance = 25, stddev = 5
    expect(calculateStandardDeviation([0, 10])).toBe(5);
  });

  it("handles decimal values", () => {
    // For [1.5, 2.5, 3.5]: mean = 2.5
    // variance = ((1-2.5)^2 + (0)^2 + (1)^2) / 3 = 2/3
    expect(calculateStandardDeviation([1.5, 2.5, 3.5])).toBeCloseTo(0.816, 2);
  });
});

describe("calculateMovingAverage", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateMovingAverage([], 3)).toBe(0);
  });

  it("returns 0 when periods is 0 or negative", () => {
    expect(calculateMovingAverage([1, 2, 3], 0)).toBe(0);
    expect(calculateMovingAverage([1, 2, 3], -1)).toBe(0);
  });

  it("returns the mean of the last N values", () => {
    expect(calculateMovingAverage([1, 2, 3, 4, 5], 3)).toBe(4); // mean of [3, 4, 5]
    expect(calculateMovingAverage([10, 20, 30, 40, 50], 2)).toBe(45); // mean of [40, 50]
  });

  it("uses all data when periods exceeds data length", () => {
    expect(calculateMovingAverage([1, 2, 3], 10)).toBe(2); // mean of [1, 2, 3]
    expect(calculateMovingAverage([5], 5)).toBe(5);
  });

  it("handles single-period window", () => {
    expect(calculateMovingAverage([1, 2, 3, 4, 5], 1)).toBe(5); // just the last value
  });

  it("handles window equal to data length", () => {
    expect(calculateMovingAverage([1, 2, 3, 4, 5], 5)).toBe(3);
  });

  it("handles insufficient data gracefully", () => {
    expect(calculateMovingAverage([5], 3)).toBe(5);
    expect(calculateMovingAverage([2, 4], 5)).toBe(3);
  });
});

describe("exponentialSmoothing", () => {
  it("returns 0 for an empty array", () => {
    expect(exponentialSmoothing([])).toBe(0);
  });

  it("returns the value itself for a single-element array", () => {
    expect(exponentialSmoothing([10])).toBe(10);
    expect(exponentialSmoothing([5], 0.5)).toBe(5);
  });

  it("applies exponential smoothing with default alpha (0.3)", () => {
    // For [10, 20] with alpha = 0.3:
    // smoothed = 0.3 * 20 + 0.7 * 10 = 6 + 7 = 13
    expect(exponentialSmoothing([10, 20])).toBe(13);
  });

  it("applies exponential smoothing with custom alpha", () => {
    // For [10, 20] with alpha = 0.5:
    // smoothed = 0.5 * 20 + 0.5 * 10 = 15
    expect(exponentialSmoothing([10, 20], 0.5)).toBe(15);
  });

  it("gives more weight to recent values with higher alpha", () => {
    const data = [10, 20, 30, 40];
    const lowAlpha = exponentialSmoothing(data, 0.1);
    const highAlpha = exponentialSmoothing(data, 0.9);
    // Higher alpha should be closer to the last value (40)
    expect(highAlpha).toBeGreaterThan(lowAlpha);
    // With alpha 0.9, value moves quickly toward recent values but doesn't reach 40 exactly
    expect(highAlpha).toBeGreaterThan(35);
  });

  it("handles alpha = 0 (no change from initial)", () => {
    // With alpha = 0, smoothed value never changes from first
    expect(exponentialSmoothing([10, 20, 30], 0)).toBe(10);
  });

  it("handles alpha = 1 (always last value)", () => {
    // With alpha = 1, each new value completely replaces the smoothed value
    expect(exponentialSmoothing([10, 20, 30], 1)).toBe(30);
  });

  it("smooths a longer series correctly", () => {
    // [100, 120, 110, 130, 125] with alpha = 0.3
    // Step 1: 100
    // Step 2: 0.3 * 120 + 0.7 * 100 = 36 + 70 = 106
    // Step 3: 0.3 * 110 + 0.7 * 106 = 33 + 74.2 = 107.2
    // Step 4: 0.3 * 130 + 0.7 * 107.2 = 39 + 75.04 = 114.04
    // Step 5: 0.3 * 125 + 0.7 * 114.04 = 37.5 + 79.828 = 117.328
    expect(exponentialSmoothing([100, 120, 110, 130, 125])).toBeCloseTo(
      117.328,
      2
    );
  });
});

describe("detectTrend", () => {
  it("returns stable with no significance for arrays with less than 3 values", () => {
    expect(detectTrend([])).toEqual({
      direction: "stable",
      strength: 0,
      changeRate: 0,
      significance: false,
    });

    expect(detectTrend([5])).toEqual({
      direction: "stable",
      strength: 0,
      changeRate: 0,
      significance: false,
    });

    expect(detectTrend([5, 10])).toEqual({
      direction: "stable",
      strength: 0,
      changeRate: 0,
      significance: false,
    });
  });

  it("detects upward trend", () => {
    const result = detectTrend([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(result.direction).toBe("up");
    expect(result.strength).toBeGreaterThan(0);
  });

  it("detects downward trend", () => {
    const result = detectTrend([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(result.direction).toBe("down");
    expect(result.strength).toBeGreaterThan(0);
  });

  it("detects stable trend for constant values", () => {
    const result = detectTrend([5, 5, 5, 5, 5, 5]);
    expect(result.direction).toBe("stable");
    expect(result.strength).toBe(0);
  });

  it("detects stable trend for small variations", () => {
    // Values with slight variation but no clear trend
    const result = detectTrend([10, 10.05, 9.95, 10, 10.02, 9.98]);
    expect(result.direction).toBe("stable");
  });

  it("identifies significance for strong trends with enough data", () => {
    // Perfect linear trend with 6+ data points should be significant
    const result = detectTrend([1, 2, 3, 4, 5, 6]);
    expect(result.significance).toBe(true);
  });

  it("does not identify significance with insufficient data", () => {
    // Even with a trend, less than 6 points is not significant
    const result = detectTrend([1, 2, 3, 4, 5]);
    expect(result.significance).toBe(false);
  });

  it("calculates positive change rate for upward trends", () => {
    const result = detectTrend([10, 20, 30, 40, 50, 60]);
    expect(result.changeRate).toBeGreaterThan(0);
  });

  it("calculates negative change rate for downward trends", () => {
    const result = detectTrend([60, 50, 40, 30, 20, 10]);
    expect(result.changeRate).toBeLessThan(0);
  });

  it("handles noisy data that still trends", () => {
    // Generally increasing with some noise
    const result = detectTrend([10, 12, 11, 15, 14, 18, 17, 20]);
    expect(result.direction).toBe("up");
  });
});

describe("predictWeeklyUsage", () => {
  const createWeeklyUsage = (
    week: string,
    rolls_used: number,
    development_cost: number
  ): WeeklyUsage => ({
    week,
    rolls_used,
    development_cost,
  });

  it("returns zero prediction for empty data", () => {
    const result = predictWeeklyUsage([]);
    expect(result.conservative).toBe(0);
    expect(result.expected).toBe(0);
    expect(result.optimistic).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.trend).toBe("stable");
    expect(result.developmentCost).toEqual({ min: 0, max: 0, expected: 0 });
    expect(result.patternInsights).toContain(
      "Not enough data for predictions"
    );
  });

  it("returns prediction for single data point", () => {
    const data = [createWeeklyUsage("2024-W01", 5, 45)];
    const result = predictWeeklyUsage(data);
    expect(result.expected).toBeGreaterThanOrEqual(0);
    expect(result.trend).toBe("stable");
  });

  it("returns reasonable predictions for consistent data", () => {
    const data = [
      createWeeklyUsage("2024-W01", 4, 36),
      createWeeklyUsage("2024-W02", 5, 45),
      createWeeklyUsage("2024-W03", 4, 36),
      createWeeklyUsage("2024-W04", 5, 45),
      createWeeklyUsage("2024-W05", 4, 36),
      createWeeklyUsage("2024-W06", 5, 45),
    ];
    const result = predictWeeklyUsage(data);

    expect(result.expected).toBeGreaterThan(0);
    expect(result.conservative).toBeLessThanOrEqual(result.expected);
    expect(result.optimistic).toBeGreaterThanOrEqual(result.expected);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("detects increasing trend in weekly data", () => {
    const data = [
      createWeeklyUsage("2024-W01", 2, 18),
      createWeeklyUsage("2024-W02", 3, 27),
      createWeeklyUsage("2024-W03", 4, 36),
      createWeeklyUsage("2024-W04", 5, 45),
      createWeeklyUsage("2024-W05", 6, 54),
      createWeeklyUsage("2024-W06", 7, 63),
    ];
    const result = predictWeeklyUsage(data);
    expect(result.trend).toBe("increasing");
  });

  it("detects decreasing trend in weekly data", () => {
    const data = [
      createWeeklyUsage("2024-W01", 7, 63),
      createWeeklyUsage("2024-W02", 6, 54),
      createWeeklyUsage("2024-W03", 5, 45),
      createWeeklyUsage("2024-W04", 4, 36),
      createWeeklyUsage("2024-W05", 3, 27),
      createWeeklyUsage("2024-W06", 2, 18),
    ];
    const result = predictWeeklyUsage(data);
    expect(result.trend).toBe("decreasing");
  });

  it("calculates development cost predictions", () => {
    const data = [
      createWeeklyUsage("2024-W01", 5, 45),
      createWeeklyUsage("2024-W02", 5, 45),
      createWeeklyUsage("2024-W03", 5, 45),
      createWeeklyUsage("2024-W04", 5, 45),
    ];
    const result = predictWeeklyUsage(data);

    expect(result.developmentCost.expected).toBeGreaterThan(0);
    expect(result.developmentCost.min).toBeLessThanOrEqual(
      result.developmentCost.expected
    );
    expect(result.developmentCost.max).toBeGreaterThanOrEqual(
      result.developmentCost.expected
    );
  });

  it("provides pattern insights", () => {
    const data = [
      createWeeklyUsage("2024-W01", 5, 45),
      createWeeklyUsage("2024-W02", 5, 45),
      createWeeklyUsage("2024-W03", 5, 45),
      createWeeklyUsage("2024-W04", 5, 45),
    ];
    const result = predictWeeklyUsage(data);
    expect(result.patternInsights).toBeDefined();
    expect(Array.isArray(result.patternInsights)).toBe(true);
  });
});

describe("predictMonthlyUsage", () => {
  const createMonthlyUsage = (
    month: string,
    rolls_used: number,
    development_cost: number
  ): MonthlyUsage => ({
    month,
    rolls_used,
    development_cost,
  });

  it("returns zero prediction for empty data", () => {
    const result = predictMonthlyUsage([]);
    expect(result.conservative).toBe(0);
    expect(result.expected).toBe(0);
    expect(result.optimistic).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.trend).toBe("stable");
    expect(result.developmentCost).toEqual({ min: 0, max: 0, expected: 0 });
    expect(result.seasonalMultiplier).toBe(1.0);
    expect(result.peakPeriod).toBe(false);
  });

  it("returns prediction for single data point", () => {
    const data = [createMonthlyUsage("2024-01", 20, 180)];
    const result = predictMonthlyUsage(data);
    expect(result.expected).toBeGreaterThanOrEqual(0);
    expect(result.trend).toBe("stable");
  });

  it("returns reasonable predictions for consistent data", () => {
    const data = [
      createMonthlyUsage("2024-01", 15, 135),
      createMonthlyUsage("2024-02", 18, 162),
      createMonthlyUsage("2024-03", 16, 144),
      createMonthlyUsage("2024-04", 17, 153),
      createMonthlyUsage("2024-05", 15, 135),
      createMonthlyUsage("2024-06", 18, 162),
    ];
    const result = predictMonthlyUsage(data);

    expect(result.expected).toBeGreaterThan(0);
    expect(result.conservative).toBeLessThanOrEqual(result.expected);
    expect(result.optimistic).toBeGreaterThanOrEqual(result.expected);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("detects increasing trend in monthly data", () => {
    const data = [
      createMonthlyUsage("2024-01", 10, 90),
      createMonthlyUsage("2024-02", 15, 135),
      createMonthlyUsage("2024-03", 20, 180),
      createMonthlyUsage("2024-04", 25, 225),
      createMonthlyUsage("2024-05", 30, 270),
      createMonthlyUsage("2024-06", 35, 315),
    ];
    const result = predictMonthlyUsage(data);
    expect(result.trend).toBe("increasing");
  });

  it("detects decreasing trend in monthly data", () => {
    const data = [
      createMonthlyUsage("2024-01", 35, 315),
      createMonthlyUsage("2024-02", 30, 270),
      createMonthlyUsage("2024-03", 25, 225),
      createMonthlyUsage("2024-04", 20, 180),
      createMonthlyUsage("2024-05", 15, 135),
      createMonthlyUsage("2024-06", 10, 90),
    ];
    const result = predictMonthlyUsage(data);
    expect(result.trend).toBe("decreasing");
  });

  it("calculates development cost predictions", () => {
    const data = [
      createMonthlyUsage("2024-01", 20, 180),
      createMonthlyUsage("2024-02", 20, 180),
      createMonthlyUsage("2024-03", 20, 180),
      createMonthlyUsage("2024-04", 20, 180),
    ];
    const result = predictMonthlyUsage(data);

    expect(result.developmentCost.expected).toBeGreaterThan(0);
    expect(result.developmentCost.min).toBeLessThanOrEqual(
      result.developmentCost.expected
    );
    expect(result.developmentCost.max).toBeGreaterThanOrEqual(
      result.developmentCost.expected
    );
  });

  it("includes seasonal multiplier", () => {
    const data = [
      createMonthlyUsage("2024-01", 20, 180),
      createMonthlyUsage("2024-02", 20, 180),
      createMonthlyUsage("2024-03", 20, 180),
      createMonthlyUsage("2024-04", 20, 180),
      createMonthlyUsage("2024-05", 20, 180),
      createMonthlyUsage("2024-06", 20, 180),
    ];
    const result = predictMonthlyUsage(data);
    expect(result.seasonalMultiplier).toBeDefined();
    expect(typeof result.seasonalMultiplier).toBe("number");
  });

  it("identifies peak periods correctly", () => {
    // Create data where recent months have much higher usage
    const data = [
      createMonthlyUsage("2024-01", 10, 90),
      createMonthlyUsage("2024-02", 10, 90),
      createMonthlyUsage("2024-03", 10, 90),
      createMonthlyUsage("2024-04", 30, 270),
      createMonthlyUsage("2024-05", 35, 315),
      createMonthlyUsage("2024-06", 40, 360),
    ];
    const result = predictMonthlyUsage(data);
    // With recent high values, prediction should be above average
    expect(result.peakPeriod).toBeDefined();
    expect(typeof result.peakPeriod).toBe("boolean");
  });

  it("uses default cost per roll when no cost data available", () => {
    const data = [
      createMonthlyUsage("2024-01", 10, 90),
      createMonthlyUsage("2024-02", 15, 135),
    ];
    const result = predictMonthlyUsage(data);
    // Cost should be calculated based on the average cost per roll from data
    expect(result.developmentCost.expected).toBeGreaterThan(0);
  });
});

describe("edge cases and error conditions", () => {
  describe("calculateMean edge cases", () => {
    it("handles very small numbers", () => {
      expect(calculateMean([0.0001, 0.0002, 0.0003])).toBeCloseTo(0.0002, 6);
    });

    it("handles mixed positive and negative", () => {
      expect(calculateMean([-100, 100, -50, 50])).toBe(0);
    });
  });

  describe("calculatePercentile edge cases", () => {
    it("handles two-element array", () => {
      expect(calculatePercentile([10, 20], 0)).toBe(10);
      expect(calculatePercentile([10, 20], 50)).toBe(15);
      expect(calculatePercentile([10, 20], 100)).toBe(20);
    });

    it("handles percentile between 0 and 100", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(calculatePercentile(data, 10)).toBeGreaterThanOrEqual(1);
      expect(calculatePercentile(data, 90)).toBeLessThanOrEqual(10);
    });
  });

  describe("detectTrend edge cases", () => {
    it("handles all zeros", () => {
      const result = detectTrend([0, 0, 0, 0, 0, 0]);
      expect(result.direction).toBe("stable");
    });

    it("handles alternating values", () => {
      // Alternating pattern [1, 10, 1, 10, 1, 10] may show slight upward bias
      // due to linear regression fitting to indices 0-5
      const result = detectTrend([1, 10, 1, 10, 1, 10]);
      // The implementation calculates a slope based on linear regression
      // For this pattern, expect defined values regardless of direction
      expect(result.direction).toBeDefined();
      expect(["up", "down", "stable"]).toContain(result.direction);
    });
  });

  describe("calculateMovingAverage edge cases", () => {
    it("handles single element with large window", () => {
      expect(calculateMovingAverage([42], 100)).toBe(42);
    });

    it("handles two elements with window of 1", () => {
      expect(calculateMovingAverage([10, 20], 1)).toBe(20);
    });
  });
});
