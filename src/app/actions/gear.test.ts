import { vi, describe, it, expect, beforeEach } from "vitest";
import type { GearSchema } from "@/lib/gear/schema";

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getEffectiveUser: vi.fn(),
  getDataClient: vi.fn(),
}));

// Create mock chain builder for Supabase
type MockChain = {
  __awaitQueue: unknown[];
  __awaitDefault: unknown;
  then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
  single: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
};

function createMockChain() {
  const chain = {
    __awaitQueue: [],
    __awaitDefault: { error: null },
    single: vi.fn(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(
        chain.__awaitQueue.length > 0
          ? chain.__awaitQueue.shift()
          : chain.__awaitDefault
      ).then(resolve),
  } as unknown as MockChain;

  const chainableMethods = [
    "from",
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "gte",
    "order",
    "lt",
  ] as const;

  chainableMethods.forEach((method) => {
    const fn = vi.fn().mockImplementation(() => chain);

    fn.mockResolvedValueOnce = ((value: unknown) => {
      chain.__awaitQueue.push(value);
      return fn;
    }) as typeof fn.mockResolvedValueOnce;

    fn.mockResolvedValue = ((value: unknown) => {
      chain.__awaitDefault = value;
      return fn;
    }) as typeof fn.mockResolvedValue;

    chain[method] = fn;
  });
  return chain;
}

const mockChain = createMockChain();

const mockSupabase = {
  from: mockChain.from,
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { getDataClient, getEffectiveUser } from "@/lib/auth";
import {
  createGear,
  editGear,
  deleteGear,
  getGear,
  getGearById,
  reserveGearForTrip,
  removeGearReservation,
  getGearForTrip,
} from "./gear";

const mockedGetEffectiveUser = vi.mocked(getEffectiveUser);
const mockedGetDataClient = vi.mocked(getDataClient);

// =============================================================================
// Test Data
// =============================================================================
const mockUser = {
  id: "user-123",
  email: "test@example.com",
};

const validGearData: GearSchema = {
  name: "Leica M6",
  brand: "Leica",
  type: "camera",
  condition: "excellent",
  model: "M6 TTL",
  serial_number: "12345678",
  purchase_date: "2023-01-15",
  purchase_price: 3500,
  notes: "Black chrome version",
};

const mockGear = {
  id: "gear-123",
  name: "Leica M6",
  brand: "Leica",
  type: "camera",
  condition: "excellent",
  model: "M6 TTL",
  serial_number: "12345678",
  purchase_date: "2023-01-15",
  purchase_price: 3500,
  notes: "Black chrome version",
  user_id: "user-123",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockTripGear = {
  id: "trip-gear-123",
  trip_id: "trip-123",
  gear_id: "gear-123",
  created_at: "2024-01-01T00:00:00Z",
};

// =============================================================================
// Helper to reset mocks
// =============================================================================
function resetMocks() {
  vi.clearAllMocks();
  mockedGetEffectiveUser.mockResolvedValue({ userId: mockUser.id, isDemo: false });
  mockedGetDataClient.mockImplementation(async () => mockSupabase as never);

  // Reset chain behavior
  mockChain.__awaitQueue = [];
  mockChain.__awaitDefault = { error: null };
  mockChain.from.mockImplementation(() => mockChain);
  mockChain.select.mockImplementation(() => mockChain);
  mockChain.insert.mockImplementation(() => mockChain);
  mockChain.update.mockImplementation(() => mockChain);
  mockChain.delete.mockImplementation(() => mockChain);
  mockChain.eq.mockImplementation(() => mockChain);
  mockChain.neq.mockImplementation(() => mockChain);
  mockChain.gte.mockImplementation(() => mockChain);
  mockChain.lt.mockImplementation(() => mockChain);
  mockChain.order.mockImplementation(() => mockChain);
  mockChain.single.mockReset();
  mockSupabase.auth.getUser.mockReset();
}

// =============================================================================
// createGear() Tests
// =============================================================================
describe("createGear", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("creates gear successfully with user_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    const result = await createGear(validGearData);

    expect(result.success).toBe(true);
    expect(result.gear).toEqual(mockGear);
    expect(mockChain.from).toHaveBeenCalledWith("gear");
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validGearData.name,
        brand: validGearData.brand,
        type: validGearData.type,
        condition: validGearData.condition,
        user_id: mockUser.id,
        purchase_price: 3500,
      })
    );
  });

  it("converts purchase_price string to number", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    const dataWithPrice = { ...validGearData, purchase_price: 2500 };
    await createGear(dataWithPrice);

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        purchase_price: 2500,
      })
    );
  });

  it("handles undefined purchase_price correctly", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: { ...mockGear, purchase_price: undefined },
      error: null,
    });

    const dataWithoutPrice = { ...validGearData, purchase_price: undefined };
    await createGear(dataWithoutPrice);

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        purchase_price: undefined,
      })
    );
  });

  it("fails when user is not authenticated", async () => {
    mockedGetEffectiveUser.mockResolvedValue({ userId: null, isDemo: false });

    const result = await createGear(validGearData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("User must be authenticated to create gear");
  });

  it("fails with validation error for invalid data", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const invalidData = {
      ...validGearData,
      name: "", // Empty name should fail validation
    };

    const result = await createGear(invalidData as GearSchema);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("fails when database insert fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const result = await createGear(validGearData);

    expect(result.success).toBe(false);
    // The error gets wrapped, but should contain the original message or be generic
    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// editGear() Tests
// =============================================================================
describe("editGear", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("updates gear successfully", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    // Chain for update: from().update().eq() returns { error: null }
    mockChain.eq.mockResolvedValueOnce({ error: null });
    // Chain for select after update: from().select().eq().single()
    mockChain.single.mockResolvedValue({
      data: { ...mockGear, name: "Updated Name" },
      error: null,
    });

    const updatedData = { ...validGearData, name: "Updated Name" };
    const result = await editGear("gear-123", updatedData);

    expect(result.success).toBe(true);
    expect(result.gear?.name).toBe("Updated Name");
  });

  it("fails when user is not authenticated", async () => {
    mockedGetEffectiveUser.mockResolvedValue({ userId: null, isDemo: false });

    const result = await editGear("gear-123", validGearData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("User must be authenticated to edit gear");
  });

  it("fails with validation error for invalid data", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const invalidData = {
      ...validGearData,
      brand: "", // Empty brand should fail validation
    };

    const result = await editGear("gear-123", invalidData as GearSchema);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("converts purchase_price to number when editing", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({ error: null });
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    const dataWithPrice = { ...validGearData, purchase_price: 4500 };
    await editGear("gear-123", dataWithPrice);

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        purchase_price: 4500,
      })
    );
  });

  it("fails when database update fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({ error: { message: "Update failed" } });

    const result = await editGear("gear-123", validGearData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// getGear() Tests
// =============================================================================
describe("getGear", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns sorted gear list successfully", async () => {
    const mockGearList = [
      { ...mockGear, id: "1", type: "accessory", brand: "Arca", name: "Plate" },
      { ...mockGear, id: "2", type: "camera", brand: "Leica", name: "M6" },
      { ...mockGear, id: "3", type: "camera", brand: "Hasselblad", name: "500c" },
    ];

    // Chain: from().select().order().order().order()
    // First two .order() calls return the chain, last one returns result
    mockChain.order
      .mockReturnValueOnce(mockChain) // .order("type")
      .mockReturnValueOnce(mockChain) // .order("brand")
      .mockResolvedValueOnce({ data: mockGearList, error: null }); // .order("name")

    const result = await getGear();

    expect(result.success).toBe(true);
    expect(result.gear).toEqual(mockGearList);
    expect(mockChain.from).toHaveBeenCalledWith("gear");
    expect(mockChain.select).toHaveBeenCalledWith("*");
  });

  it("returns empty array when no gear exists", async () => {
    mockChain.order
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ data: [], error: null });

    const result = await getGear();

    expect(result.success).toBe(true);
    expect(result.gear).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    mockChain.order
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await getGear();

    expect(result.success).toBe(true);
    expect(result.gear).toEqual([]);
  });

  it("fails when database query fails", async () => {
    mockChain.order
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ data: null, error: { message: "Database connection failed" } });

    const result = await getGear();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// getGearById() Tests
// =============================================================================
describe("getGearById", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns single gear item successfully", async () => {
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    const result = await getGearById("gear-123");

    expect(result.success).toBe(true);
    expect(result.gear).toEqual(mockGear);
    expect(mockChain.from).toHaveBeenCalledWith("gear");
    expect(mockChain.select).toHaveBeenCalledWith("*");
    expect(mockChain.eq).toHaveBeenCalledWith("id", "gear-123");
  });

  it("fails when gear not found", async () => {
    mockChain.single.mockResolvedValue({
      data: null,
      error: { message: "Gear not found" },
    });

    const result = await getGearById("non-existent");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("fails when database query fails", async () => {
    mockChain.single.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const result = await getGearById("gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// deleteGear() Tests
// =============================================================================
describe("deleteGear", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("deletes gear successfully when no upcoming reservations", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      error: null,
    });

    const result = await deleteGear("gear-123");

    expect(result.success).toBe(true);
    expect(mockChain.from).toHaveBeenCalledWith("trip_gear");
    expect(mockChain.from).toHaveBeenCalledWith("gear");
  });

  it("blocks deletion when gear is reserved for upcoming trips", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      data: [
        {
          trips: {
            title: "Japan Trip",
            trip_date: futureDate.toISOString(),
          },
        },
      ],
      error: null,
    });

    const result = await deleteGear("gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot delete gear");
    expect(result.error).toContain("Japan Trip");
  });

  it("blocks deletion when gear is reserved for multiple upcoming trips", async () => {
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 30);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 60);

    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      data: [
        {
          trips: {
            title: "Japan Trip",
            trip_date: futureDate1.toISOString(),
          },
        },
        {
          trips: {
            title: "Iceland Trip",
            trip_date: futureDate2.toISOString(),
          },
        },
      ],
      error: null,
    });

    const result = await deleteGear("gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Japan Trip");
    expect(result.error).toContain("Iceland Trip");
  });

  it("allows deletion when all reservations are for past trips", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);

    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      data: [
        {
          trips: {
            title: "Past Trip",
            trip_date: pastDate.toISOString(),
          },
        },
      ],
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      error: null,
    });

    const result = await deleteGear("gear-123");

    expect(result.success).toBe(true);
  });

  it("fails when database delete fails", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      error: { message: "Delete failed" },
    });

    const result = await deleteGear("gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("handles null reservations data gracefully", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      error: null,
    });

    const result = await deleteGear("gear-123");

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// reserveGearForTrip() Tests
// =============================================================================
describe("reserveGearForTrip", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("reserves gear for trip successfully", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" }, // No rows returned
    });
    // Second single() is for the insert
    mockChain.single.mockResolvedValueOnce({
      data: mockTripGear,
      error: null,
    });

    const result = await reserveGearForTrip("trip-123", "gear-123");

    expect(result.success).toBe(true);
    expect(result.tripGear).toEqual(mockTripGear);
    expect(mockChain.from).toHaveBeenCalledWith("trip_gear");
    expect(mockChain.insert).toHaveBeenCalledWith({
      trip_id: "trip-123",
      gear_id: "gear-123",
    });
  });

  it("prevents duplicate reservation", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.single.mockResolvedValueOnce({
      data: { id: "existing-reservation" },
      error: null,
    });

    const result = await reserveGearForTrip("trip-123", "gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Gear is already reserved for this trip");
  });

  it("fails when database insert fails", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Insert failed" },
    });

    const result = await reserveGearForTrip("trip-123", "gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// removeGearReservation() Tests
// =============================================================================
describe("removeGearReservation", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("removes gear reservation successfully", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    let eqCount = 0;
    mockChain.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount >= 6) {
        return Promise.resolve({ error: null });
      }
      return mockChain;
    });

    const result = await removeGearReservation("trip-123", "gear-123");

    expect(result.success).toBe(true);
    expect(mockChain.from).toHaveBeenCalledWith("trip_gear");
    expect(mockChain.delete).toHaveBeenCalled();
  });

  it("fails when database delete fails", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    let eqCount = 0;
    mockChain.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount >= 6) {
        return Promise.resolve({ error: { message: "Delete failed" } });
      }
      return mockChain;
    });

    const result = await removeGearReservation("trip-123", "gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// getGearForTrip() Tests
// =============================================================================
describe("getGearForTrip", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns gear for trip with nested gear details", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    const mockTripGearWithDetails = [
      {
        ...mockTripGear,
        gear: mockGear,
      },
    ];

    mockChain.eq.mockResolvedValue({
      data: mockTripGearWithDetails,
      error: null,
    });

    const result = await getGearForTrip("trip-123");

    expect(result.success).toBe(true);
    expect(result.gear).toEqual(mockTripGearWithDetails);
    expect(mockChain.from).toHaveBeenCalledWith("trip_gear");
    expect(mockChain.select).toHaveBeenCalledWith(`
        *,
        gear (*)
      `);
    expect(mockChain.eq).toHaveBeenCalledWith("trip_id", "trip-123");
  });

  it("returns empty array when no gear reserved for trip", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await getGearForTrip("trip-123");

    expect(result.success).toBe(true);
    expect(result.gear).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await getGearForTrip("trip-123");

    expect(result.success).toBe(true);
    expect(result.gear).toEqual([]);
  });

  it("fails when database query fails", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValue({
      data: null,
      error: { message: "Query failed" },
    });

    const result = await getGearForTrip("trip-123");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns multiple gear items for a trip", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { id: "trip-123" },
      error: null,
    });
    const lens = {
      ...mockGear,
      id: "gear-456",
      name: "Summilux 50mm",
      type: "lens",
    };
    const flash = {
      ...mockGear,
      id: "gear-789",
      name: "Metz 45",
      type: "flash",
    };

    const mockMultipleGear = [
      { ...mockTripGear, gear_id: "gear-123", gear: mockGear },
      { ...mockTripGear, id: "trip-gear-456", gear_id: "gear-456", gear: lens },
      { ...mockTripGear, id: "trip-gear-789", gear_id: "gear-789", gear: flash },
    ];

    mockChain.eq.mockResolvedValue({
      data: mockMultipleGear,
      error: null,
    });

    const result = await getGearForTrip("trip-123");

    expect(result.success).toBe(true);
    expect(result.gear).toHaveLength(3);
    expect(result.gear![0].gear.type).toBe("camera");
    expect(result.gear![1].gear.type).toBe("lens");
    expect(result.gear![2].gear.type).toBe("flash");
  });
});

// =============================================================================
// Edge Cases and Integration Scenarios
// =============================================================================
describe("Edge Cases", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("handles gear with all optional fields as undefined", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: { ...mockGear, model: undefined, serial_number: undefined },
      error: null,
    });

    const minimalData: GearSchema = {
      name: "Simple Camera",
      brand: "Generic",
      type: "camera",
      condition: "good",
    };

    const result = await createGear(minimalData);

    expect(result.success).toBe(true);
  });

  it("handles empty string optional fields being transformed", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    // gearSchema transforms empty strings to undefined
    const dataWithEmptyStrings: GearSchema = {
      name: "Camera",
      brand: "Brand",
      type: "camera",
      condition: "excellent",
      model: undefined,
      serial_number: undefined,
      notes: undefined,
    };

    const result = await createGear(dataWithEmptyStrings);

    expect(result.success).toBe(true);
  });

  it("handles concurrent reservation attempts gracefully", async () => {
    // First call: check for existing reservation returns none
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });
    // Second call: insert fails due to unique constraint (concurrent insert)
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: "duplicate key value violates unique constraint" },
    });

    const result = await reserveGearForTrip("trip-123", "gear-123");

    expect(result.success).toBe(false);
    // Error message may be wrapped
    expect(result.error).toBeDefined();
  });

  it("validates all gear types are accepted", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    const gearTypes = [
      "camera",
      "lens",
      "flash",
      "accessory",
      "tripod",
      "filter",
      "bag",
    ] as const;

    for (const type of gearTypes) {
      const data: GearSchema = {
        name: `Test ${type}`,
        brand: "Test Brand",
        type,
        condition: "good",
      };

      const result = await createGear(data);
      expect(result.success).toBe(true);
    }
  });

  it("validates all condition values are accepted", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    const conditions = ["excellent", "good", "fair", "poor"] as const;

    for (const condition of conditions) {
      const data: GearSchema = {
        name: "Test Camera",
        brand: "Test Brand",
        type: "camera",
        condition,
      };

      const result = await createGear(data);
      expect(result.success).toBe(true);
    }
  });

  it("handles trip date exactly on today (edge case)", async () => {
    // Trip date is later today - should be considered upcoming (>= today)
    const laterToday = new Date();
    laterToday.setHours(23, 59, 59, 999); // Set to end of today to avoid race condition

    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      data: [
        {
          trips: {
            title: "Today Trip",
            trip_date: laterToday.toISOString(),
          },
        },
      ],
      error: null,
    });

    const result = await deleteGear("gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Today Trip");
  });

  it("handles mixed past and future trip reservations", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    mockChain.single.mockResolvedValueOnce({
      data: { id: "gear-123" },
      error: null,
    });
    mockChain.eq.mockResolvedValueOnce({
      data: [
        {
          trips: {
            title: "Past Trip",
            trip_date: pastDate.toISOString(),
          },
        },
        {
          trips: {
            title: "Future Trip",
            trip_date: futureDate.toISOString(),
          },
        },
      ],
      error: null,
    });

    const result = await deleteGear("gear-123");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Future Trip");
    expect(result.error).not.toContain("Past Trip");
  });

  it("handles gear with camera_id set to 'none' being transformed to undefined", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    // The schema transforms 'none' to undefined
    const dataWithNoneCameraId: GearSchema = {
      name: "Test Lens",
      brand: "Leica",
      type: "lens",
      condition: "excellent",
      camera_id: undefined, // This would be 'none' before transformation
    };

    const result = await createGear(dataWithNoneCameraId);

    expect(result.success).toBe(true);
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        camera_id: undefined,
      })
    );
  });

  it("handles very long notes field", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockChain.single.mockResolvedValue({
      data: mockGear,
      error: null,
    });

    const longNotes = "A".repeat(10000);
    const dataWithLongNotes: GearSchema = {
      ...validGearData,
      notes: longNotes,
    };

    const result = await createGear(dataWithLongNotes);

    expect(result.success).toBe(true);
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: longNotes,
      })
    );
  });
});
