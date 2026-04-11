import { describe, it, expect } from "vitest";
import {
  cn,
  calculateTripDuration,
  formatTripDuration,
  formatDate,
  formatTripDateRange,
  getConditionColor,
  getTripStatusColor,
  getGearTypeIcon,
  calculateRollsFromBulkFilm,
  getBulkFilmInfo,
  filmSchema,
  tripSchema,
  gearSchema,
} from "./utils";

// =============================================================================
// cn() - Class name merging utility
// =============================================================================
describe("cn", () => {
  it("merges multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar");
  });

  it("handles arrays of class names", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("merges tailwind classes correctly (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles complex tailwind merging", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
  });

  it("handles object syntax", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });
});

// =============================================================================
// Date/Duration Functions
// =============================================================================
describe("calculateTripDuration", () => {
  it("returns 1 for same day trip", () => {
    expect(calculateTripDuration("2024-01-15", "2024-01-15")).toBe(1);
  });

  it("returns 2 for consecutive days", () => {
    expect(calculateTripDuration("2024-01-15", "2024-01-16")).toBe(2);
  });

  it("calculates multi-day trips correctly", () => {
    expect(calculateTripDuration("2024-01-01", "2024-01-07")).toBe(7);
    expect(calculateTripDuration("2024-01-01", "2024-01-31")).toBe(31);
  });

  it("handles month boundaries", () => {
    expect(calculateTripDuration("2024-01-30", "2024-02-02")).toBe(4);
  });

  it("handles year boundaries", () => {
    expect(calculateTripDuration("2023-12-30", "2024-01-02")).toBe(4);
  });

  it("handles leap year", () => {
    expect(calculateTripDuration("2024-02-28", "2024-03-01")).toBe(3);
  });

  it("handles dates in reverse order (uses absolute difference)", () => {
    expect(calculateTripDuration("2024-01-20", "2024-01-15")).toBe(6);
  });

  it("handles long trips spanning multiple months", () => {
    expect(calculateTripDuration("2024-01-01", "2024-03-31")).toBe(91);
  });
});

describe("formatTripDuration", () => {
  it("formats 1 day trip", () => {
    expect(formatTripDuration("2024-01-15", "2024-01-15")).toBe("1 day");
  });

  it("formats 2-6 day trips", () => {
    expect(formatTripDuration("2024-01-15", "2024-01-16")).toBe("2 days");
    expect(formatTripDuration("2024-01-15", "2024-01-20")).toBe("6 days");
  });

  it("formats exactly 1 week", () => {
    expect(formatTripDuration("2024-01-01", "2024-01-07")).toBe("1 week");
  });

  it("formats multiple whole weeks", () => {
    expect(formatTripDuration("2024-01-01", "2024-01-14")).toBe("2 weeks");
    expect(formatTripDuration("2024-01-01", "2024-01-21")).toBe("3 weeks");
  });

  it("formats weeks with remaining days", () => {
    expect(formatTripDuration("2024-01-01", "2024-01-08")).toBe("1 week, 1 day");
    expect(formatTripDuration("2024-01-01", "2024-01-10")).toBe("1 week, 3 days");
    expect(formatTripDuration("2024-01-01", "2024-01-17")).toBe("2 weeks, 3 days");
  });

  it("handles trips longer than 52 weeks", () => {
    // 366 days (leap year) = 52 weeks, 2 days
    expect(formatTripDuration("2024-01-01", "2024-12-31")).toBe("52 weeks, 2 days");
  });

  it("handles very long trips", () => {
    // 2024 is a leap year (366 days) + 2025 (365 days) = 731 days
    // 731 days = 104 weeks, 3 days
    expect(formatTripDuration("2024-01-01", "2025-12-31")).toBe("104 weeks, 3 days");
  });
});

describe("formatDate", () => {
  it("formats date in DD.MM.YYYY format", () => {
    expect(formatDate("2024-01-15")).toBe("15.01.2024");
  });

  it("pads single digit days and months", () => {
    expect(formatDate("2024-01-05")).toBe("05.01.2024");
    expect(formatDate("2024-09-05")).toBe("05.09.2024");
  });

  it("handles end of year dates", () => {
    expect(formatDate("2024-12-31")).toBe("31.12.2024");
  });

  it("handles ISO datetime strings", () => {
    expect(formatDate("2024-06-15T10:30:00Z")).toBe("15.06.2024");
  });
});

describe("formatTripDateRange", () => {
  it("returns single date for same day trip", () => {
    expect(formatTripDateRange("2024-01-15", "2024-01-15")).toBe("15.01.2024");
  });

  it("returns date range for multi-day trip", () => {
    expect(formatTripDateRange("2024-01-15", "2024-01-20")).toBe("15.01.2024 - 20.01.2024");
  });

  it("handles month boundaries", () => {
    expect(formatTripDateRange("2024-01-30", "2024-02-05")).toBe("30.01.2024 - 05.02.2024");
  });

  it("handles year boundaries", () => {
    expect(formatTripDateRange("2023-12-30", "2024-01-05")).toBe("30.12.2023 - 05.01.2024");
  });
});

// =============================================================================
// Color Mapping Functions
// =============================================================================
describe("getConditionColor", () => {
  it("returns green for excellent condition", () => {
    expect(getConditionColor("excellent")).toBe("text-green-600 bg-green-50");
  });

  it("returns blue for good condition", () => {
    expect(getConditionColor("good")).toBe("text-blue-600 bg-blue-50");
  });

  it("returns yellow for fair condition", () => {
    expect(getConditionColor("fair")).toBe("text-yellow-600 bg-yellow-50");
  });

  it("returns red for poor condition", () => {
    expect(getConditionColor("poor")).toBe("text-red-600 bg-red-50");
  });

  it("returns gray for unknown condition", () => {
    expect(getConditionColor("unknown")).toBe("text-gray-600 bg-gray-50");
    expect(getConditionColor("")).toBe("text-gray-600 bg-gray-50");
  });
});

describe("getTripStatusColor", () => {
  it("returns blue for upcoming trips", () => {
    expect(getTripStatusColor("upcoming")).toBe("text-blue-600 bg-blue-50");
  });

  it("returns orange for ongoing trips", () => {
    expect(getTripStatusColor("ongoing")).toBe("text-orange-600 bg-orange-50");
  });

  it("returns gray for past trips", () => {
    expect(getTripStatusColor("past")).toBe("text-gray-600 bg-gray-50");
  });

  it("returns green for completed trips", () => {
    expect(getTripStatusColor("completed")).toBe("text-green-600 bg-green-50");
  });
});

describe("getGearTypeIcon", () => {
  it("returns camera icon", () => {
    expect(getGearTypeIcon("camera")).toBe("\u{1F4F7}");
  });

  it("returns lens icon", () => {
    expect(getGearTypeIcon("lens")).toBe("\u{1F50D}");
  });

  it("returns flash icon", () => {
    expect(getGearTypeIcon("flash")).toBe("\u26A1");
  });

  it("returns accessory icon", () => {
    expect(getGearTypeIcon("accessory")).toBe("\u{1F527}");
  });

  it("returns tripod icon", () => {
    expect(getGearTypeIcon("tripod")).toBe("\u{1F4D0}");
  });

  it("returns filter icon", () => {
    expect(getGearTypeIcon("filter")).toBe("\u{1F31F}");
  });

  it("returns bag icon", () => {
    expect(getGearTypeIcon("bag")).toBe("\u{1F45C}");
  });

  it("returns default package icon for unknown type", () => {
    expect(getGearTypeIcon("unknown")).toBe("\u{1F4E6}");
    expect(getGearTypeIcon("")).toBe("\u{1F4E6}");
  });
});

// =============================================================================
// Bulk Film Calculations
// =============================================================================
describe("calculateRollsFromBulkFilm", () => {
  it("calculates rolls for 35mm bulk film", () => {
    // 30m of 35mm, 1.65m per roll, 90% efficiency
    // (30 * 0.9) / 1.65 = 16.36, floor = 16
    expect(calculateRollsFromBulkFilm(30, "35mm")).toBe(16);
  });

  it("calculates rolls for 120 bulk film", () => {
    // 30m of 120, 0.8m per roll, 90% efficiency
    // (30 * 0.9) / 0.8 = 33.75, floor = 33
    expect(calculateRollsFromBulkFilm(30, "120")).toBe(33);
  });

  it("returns 0 for 4x5 format (no bulk support)", () => {
    expect(calculateRollsFromBulkFilm(30, "4x5")).toBe(0);
  });

  it("returns 0 for unknown format", () => {
    expect(calculateRollsFromBulkFilm(30, "unknown")).toBe(0);
  });

  it("handles multiple bulk quantity", () => {
    // 30m * 2 = 60m effective, but calculation is per bulk then multiplied
    // 16 rolls per bulk * 2 = 32
    expect(calculateRollsFromBulkFilm(30, "35mm", 2)).toBe(32);
  });

  it("handles small bulk lengths", () => {
    // 5m of 35mm
    // (5 * 0.9) / 1.65 = 2.72, floor = 2
    expect(calculateRollsFromBulkFilm(5, "35mm")).toBe(2);
  });

  it("handles very large bulk lengths", () => {
    // 100m of 35mm
    // (100 * 0.9) / 1.65 = 54.54, floor = 54
    expect(calculateRollsFromBulkFilm(100, "35mm")).toBe(54);
  });

  it("handles 0 length", () => {
    expect(calculateRollsFromBulkFilm(0, "35mm")).toBe(0);
  });
});

describe("getBulkFilmInfo", () => {
  it("returns bulk info for 35mm", () => {
    const info = getBulkFilmInfo("35mm");
    expect(info).toEqual({
      supportsBulk: true,
      lengthPerRoll: 1.65,
      format: "35mm",
    });
  });

  it("returns bulk info for 120", () => {
    const info = getBulkFilmInfo("120");
    expect(info).toEqual({
      supportsBulk: true,
      lengthPerRoll: 0.8,
      format: "120",
    });
  });

  it("returns no bulk support for 4x5", () => {
    const info = getBulkFilmInfo("4x5");
    expect(info).toEqual({
      supportsBulk: false,
      lengthPerRoll: 0,
      format: "4x5",
    });
  });

  it("returns null for unknown format", () => {
    expect(getBulkFilmInfo("unknown")).toBeNull();
    expect(getBulkFilmInfo("")).toBeNull();
  });
});

// =============================================================================
// Zod Schema Validation - filmSchema
// =============================================================================
describe("filmSchema", () => {
  const validFilm = {
    name: "Portra 400",
    brand: "Kodak",
    iso: 400,
    format: "35mm",
    type: "color",
    expiration_date: "2025-12-31",
  };

  it("validates a minimal valid film", () => {
    const result = filmSchema.safeParse(validFilm);
    expect(result.success).toBe(true);
  });

  it("validates a film with all optional fields", () => {
    const fullFilm = {
      ...validFilm,
      price: 15.99,
      count: 10,
      notes: "Great for portraits",
      editing_notes: "Scan at 3200 DPI",
      is_ecn: false,
      is_bulk_film: true,
      bulk_length_meters: 30,
      bulk_quantity: 2,
      bulk_rolls_used: 5,
      calculated_rolls: 32,
      bulk_remaining_exposures: 972,
      spooled_cassettes: 3,
    };
    const result = filmSchema.safeParse(fullFilm);
    expect(result.success).toBe(true);
  });

  it("fails for empty name", () => {
    const result = filmSchema.safeParse({ ...validFilm, name: "" });
    expect(result.success).toBe(false);
  });

  it("fails for empty brand", () => {
    const result = filmSchema.safeParse({ ...validFilm, brand: "" });
    expect(result.success).toBe(false);
  });

  it("fails for ISO < 1", () => {
    const result = filmSchema.safeParse({ ...validFilm, iso: 0 });
    expect(result.success).toBe(false);
  });

  it("fails for empty format", () => {
    const result = filmSchema.safeParse({ ...validFilm, format: "" });
    expect(result.success).toBe(false);
  });

  it("fails for empty type", () => {
    const result = filmSchema.safeParse({ ...validFilm, type: "" });
    expect(result.success).toBe(false);
  });

  it("fails for empty expiration_date", () => {
    const result = filmSchema.safeParse({ ...validFilm, expiration_date: "" });
    expect(result.success).toBe(false);
  });

  it("accepts null for price", () => {
    const result = filmSchema.safeParse({ ...validFilm, price: null });
    expect(result.success).toBe(true);
  });

  it("accepts null for count", () => {
    const result = filmSchema.safeParse({ ...validFilm, count: null });
    expect(result.success).toBe(true);
  });

  it("fails for non-positive bulk_length_meters", () => {
    const result = filmSchema.safeParse({
      ...validFilm,
      is_bulk_film: true,
      bulk_length_meters: 0,
    });
    expect(result.success).toBe(false);
  });

  it("fails for negative bulk_rolls_used", () => {
    const result = filmSchema.safeParse({
      ...validFilm,
      is_bulk_film: true,
      bulk_rolls_used: -1,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Zod Schema Validation - tripSchema
// =============================================================================
describe("tripSchema", () => {
  const validTrip = {
    title: "Japan Photo Trip",
    description: "Photography trip to Tokyo and Kyoto",
    start_date: "2024-06-01",
    end_date: "2024-06-14",
  };

  it("validates a valid trip", () => {
    const result = tripSchema.safeParse(validTrip);
    expect(result.success).toBe(true);
  });

  it("validates same-day trip", () => {
    const result = tripSchema.safeParse({
      ...validTrip,
      end_date: "2024-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("fails for empty title", () => {
    const result = tripSchema.safeParse({ ...validTrip, title: "" });
    expect(result.success).toBe(false);
  });

  it("fails for empty description", () => {
    const result = tripSchema.safeParse({ ...validTrip, description: "" });
    expect(result.success).toBe(false);
  });

  it("fails for empty start_date", () => {
    const result = tripSchema.safeParse({ ...validTrip, start_date: "" });
    expect(result.success).toBe(false);
  });

  it("fails for empty end_date", () => {
    const result = tripSchema.safeParse({ ...validTrip, end_date: "" });
    expect(result.success).toBe(false);
  });

  it("fails when end_date is before start_date", () => {
    const result = tripSchema.safeParse({
      ...validTrip,
      start_date: "2024-06-14",
      end_date: "2024-06-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("end_date");
      expect(result.error.issues[0].message).toBe("End date must be on or after start date");
    }
  });
});

// =============================================================================
// Zod Schema Validation - gearSchema
// =============================================================================
describe("gearSchema", () => {
  const validGear = {
    name: "Leica M6",
    brand: "Leica",
    type: "camera" as const,
    condition: "excellent" as const,
  };

  it("validates minimal valid gear", () => {
    const result = gearSchema.safeParse(validGear);
    expect(result.success).toBe(true);
  });

  it("validates gear with all optional fields", () => {
    const fullGear = {
      ...validGear,
      model: "M6 TTL",
      serial_number: "12345678",
      purchase_date: "2023-01-15",
      purchase_price: 3500,
      notes: "Black chrome version",
      camera_id: "some-uuid",
    };
    const result = gearSchema.safeParse(fullGear);
    expect(result.success).toBe(true);
  });

  it("fails for empty name", () => {
    const result = gearSchema.safeParse({ ...validGear, name: "" });
    expect(result.success).toBe(false);
  });

  it("fails for empty brand", () => {
    const result = gearSchema.safeParse({ ...validGear, brand: "" });
    expect(result.success).toBe(false);
  });

  it("fails for invalid gear type", () => {
    const result = gearSchema.safeParse({ ...validGear, type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("fails for invalid condition", () => {
    const result = gearSchema.safeParse({ ...validGear, condition: "broken" });
    expect(result.success).toBe(false);
  });

  it("validates all gear types", () => {
    const types = ["camera", "lens", "flash", "accessory", "tripod", "filter", "bag"] as const;
    types.forEach((type) => {
      const result = gearSchema.safeParse({ ...validGear, type });
      expect(result.success).toBe(true);
    });
  });

  it("validates all condition values", () => {
    const conditions = ["excellent", "good", "fair", "poor"] as const;
    conditions.forEach((condition) => {
      const result = gearSchema.safeParse({ ...validGear, condition });
      expect(result.success).toBe(true);
    });
  });

  it("transforms empty string model to undefined", () => {
    const result = gearSchema.safeParse({ ...validGear, model: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBeUndefined();
    }
  });

  it("transforms 'none' camera_id to undefined", () => {
    const result = gearSchema.safeParse({ ...validGear, camera_id: "none" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.camera_id).toBeUndefined();
    }
  });

  it("fails for non-positive purchase_price", () => {
    const result = gearSchema.safeParse({ ...validGear, purchase_price: 0 });
    expect(result.success).toBe(false);
  });
});
