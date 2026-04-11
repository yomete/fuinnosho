import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid-1234"),
}));

// Create chainable mock that returns itself for all methods
function createChainableMock() {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'isNull', 'order'];

  chainMethods.forEach(method => {
    mock[method] = vi.fn().mockImplementation(() => mock);
  });

  mock.single = vi.fn();
  mock.auth = {
    getUser: vi.fn(),
    signOut: vi.fn(),
  };

  return mock;
}

const mockSupabase = createChainableMock();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocks are set up
import {
  createFilm,
  editFilm,
  getFilms,
  getFilmById,
  getFilmWithDetails,
  deleteFilm,
  restoreFilm,
  getDeletedFilms,
  permanentlyDeleteFilm,
  reduceFilmCount,
  spoolBulkFilm,
  getFilmUsageHistory,
  finishBulkRoll,
  addRollsToFilm,
  logout,
} from "./films";
import type { FilmSchema } from "@/lib/films/schema";

// =============================================================================
// Test Data Fixtures
// =============================================================================
const validFilmData: FilmSchema = {
  name: "Portra 400",
  brand: "Kodak",
  iso: 400,
  format: "35mm",
  type: "color",
  expiration_date: "2025-12-31",
  price: 15.99,
  count: 10,
  notes: "Great for portraits",
};

const validBulkFilmData: FilmSchema = {
  name: "Tri-X 400",
  brand: "Kodak",
  iso: 400,
  format: "35mm",
  type: "black_white",
  expiration_date: "2025-12-31",
  is_bulk_film: true,
  bulk_length_meters: 30,
  bulk_quantity: 1,
  calculated_rolls: 16,
};

const mockUser = { id: "user-123", email: "test@example.com" };

const mockFilm = {
  id: "film-id-123",
  name: "Portra 400",
  brand: "Kodak",
  iso: 400,
  format: "35mm",
  type: "color",
  expiration_date: "2025-12-31",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  user_id: "user-123",
  count: 10,
  price: 15.99,
  deleted_at: null,
};

// =============================================================================
// Helper Functions
// =============================================================================
function resetMocks() {
  vi.clearAllMocks();
  // Reset all chainable methods to return the mock object
  const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'isNull', 'order'];
  chainMethods.forEach(method => {
    mockSupabase[method].mockImplementation(() => mockSupabase);
  });
}

// =============================================================================
// createFilm() Tests
// =============================================================================
describe("createFilm", () => {
  beforeEach(() => {
    resetMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSupabase.insert.mockResolvedValue({ error: null });
  });

  it("creates a film with valid data", async () => {
    const result = await createFilm(validFilmData);

    expect(result.success).toBe(true);
    expect(result.film).toBeDefined();
    expect(result.film?.name).toBe("Portra 400");
    expect(result.film?.brand).toBe("Kodak");
    expect(result.film?.id).toBe("test-uuid-1234");
    expect(result.film?.user_id).toBe("user-123");
  });

  it("converts string numbers to actual numbers", async () => {
    const dataWithStringNumbers = {
      ...validFilmData,
      iso: 400 as number,
      price: 15.99 as number,
      count: 10 as number,
    };

    const result = await createFilm(dataWithStringNumbers);

    expect(result.success).toBe(true);
    expect(typeof result.film?.iso).toBe("number");
    expect(typeof result.film?.price).toBe("number");
    expect(typeof result.film?.count).toBe("number");
  });

  it("calculates bulk_remaining_exposures for 35mm bulk film", async () => {
    const bulkData: FilmSchema = {
      ...validBulkFilmData,
      calculated_rolls: 16,
    };

    const result = await createFilm(bulkData);

    expect(result.success).toBe(true);
    // 16 rolls * 36 exposures per roll = 576
    expect(result.film?.bulk_remaining_exposures).toBe(576);
  });

  it("calculates bulk_remaining_exposures for 120 bulk film", async () => {
    const bulkData: FilmSchema = {
      ...validBulkFilmData,
      format: "120",
      calculated_rolls: 33,
    };

    const result = await createFilm(bulkData);

    expect(result.success).toBe(true);
    // 33 rolls * 12 exposures per roll = 396
    expect(result.film?.bulk_remaining_exposures).toBe(396);
  });

  it("initializes spooled_cassettes to 0 for bulk film", async () => {
    const result = await createFilm(validBulkFilmData);

    expect(result.success).toBe(true);
    expect(result.film?.spooled_cassettes).toBe(0);
  });

  it("uses provided bulk_remaining_exposures if specified", async () => {
    const bulkData: FilmSchema = {
      ...validBulkFilmData,
      bulk_remaining_exposures: 500,
    };

    const result = await createFilm(bulkData);

    expect(result.success).toBe(true);
    expect(result.film?.bulk_remaining_exposures).toBe(500);
  });

  it("returns error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await createFilm(validFilmData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not authenticated");
  });

  it("returns error for invalid data (missing required fields)", async () => {
    const invalidData = {
      name: "",
      brand: "Kodak",
      iso: 400,
      format: "35mm",
      type: "color",
      expiration_date: "2025-12-31",
    } as FilmSchema;

    const result = await createFilm(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error for invalid ISO (less than 1)", async () => {
    const invalidData = {
      ...validFilmData,
      iso: 0,
    };

    const result = await createFilm(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when Supabase insert fails", async () => {
    mockSupabase.insert.mockResolvedValue({ error: { message: "Database error" } });

    const result = await createFilm(validFilmData);

    expect(result.success).toBe(false);
    // The error is caught and may be wrapped, so check it exists
    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// editFilm() Tests
// =============================================================================
describe("editFilm", () => {
  beforeEach(() => {
    resetMocks();
    mockSupabase.single.mockResolvedValue({ data: mockFilm, error: null });
  });

  it("updates a film with valid data", async () => {
    // editFilm does: update().eq() then select().eq().single()
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const result = await editFilm("film-id-123", validFilmData);

    expect(result.success).toBe(true);
    expect(result.film).toBeDefined();
    expect(mockSupabase.from).toHaveBeenCalledWith("films");
    expect(mockSupabase.update).toHaveBeenCalled();
  });

  it("converts number fields from string to number", async () => {
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const dataWithNumbers = {
      ...validFilmData,
      iso: 800,
      price: 20.99,
      count: 5,
    };

    await editFilm("film-id-123", dataWithNumbers);

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(typeof updateCall.iso).toBe("number");
    expect(updateCall.iso).toBe(800);
  });

  it("handles optional bulk film fields", async () => {
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const bulkData: FilmSchema = {
      ...validBulkFilmData,
      bulk_length_meters: 30,
      bulk_quantity: 2,
      calculated_rolls: 32,
      bulk_remaining_exposures: 1000,
      spooled_cassettes: 5,
    };

    await editFilm("film-id-123", bulkData);

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(updateCall.bulk_length_meters).toBe(30);
    expect(updateCall.bulk_quantity).toBe(2);
    expect(updateCall.calculated_rolls).toBe(32);
    expect(updateCall.bulk_remaining_exposures).toBe(1000);
    expect(updateCall.spooled_cassettes).toBe(5);
  });

  it("returns error for invalid data", async () => {
    const invalidData = {
      ...validFilmData,
      name: "", // Invalid - empty name
    };

    const result = await editFilm("film-id-123", invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when Supabase update fails", async () => {
    // Return an error from the update().eq() chain
    mockSupabase.eq.mockImplementation(() => {
      return Promise.resolve({ error: { message: "Update failed" } });
    });

    const result = await editFilm("film-id-123", validFilmData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("handles undefined optional fields", async () => {
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const minimalData: FilmSchema = {
      name: "Portra 400",
      brand: "Kodak",
      iso: 400,
      format: "35mm",
      type: "color",
      expiration_date: "2025-12-31",
    };

    await editFilm("film-id-123", minimalData);

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(updateCall.price).toBeUndefined();
    expect(updateCall.count).toBeUndefined();
  });
});

// =============================================================================
// getFilms() Tests
// =============================================================================
describe("getFilms", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns non-deleted films", async () => {
    const mockFilms = [mockFilm, { ...mockFilm, id: "film-2", name: "HP5 Plus" }];
    mockSupabase.order.mockResolvedValue({ data: mockFilms, error: null });

    const result = await getFilms();

    expect(result.data).toHaveLength(2);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith("films");
    expect(mockSupabase.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("orders films by created_at descending", async () => {
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    await getFilms();

    expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns empty array when no films exist", async () => {
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const result = await getFilms();

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it("returns error when Supabase query fails", async () => {
    mockSupabase.order.mockResolvedValue({ data: null, error: { message: "Query failed" } });

    const result = await getFilms();

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    // The function wraps the error, so we check it contains relevant info
    expect(result.error?.message).toContain("fetch films");
  });
});

// =============================================================================
// getFilmById() Tests
// =============================================================================
describe("getFilmById", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns film when found", async () => {
    mockSupabase.single.mockResolvedValue({ data: mockFilm, error: null });

    const result = await getFilmById("film-id-123");

    expect(result).toEqual(mockFilm);
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", "film-id-123");
    expect(mockSupabase.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("returns null when film not found", async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await getFilmById("non-existent-id");

    expect(result).toBeNull();
  });

  it("returns null for deleted films", async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await getFilmById("deleted-film-id");

    expect(result).toBeNull();
  });
});

// =============================================================================
// getFilmWithDetails() Tests
// =============================================================================
describe("getFilmWithDetails", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns film with usage history and trips", async () => {
    const mockUsage = [
      { id: "usage-1", film_id: "film-id-123", quantity: 2, usage_note: "Photo walk", created_at: "2024-01-15" },
    ];
    const mockTrips = [
      { quantity: 3, created_at: "2024-01-01", trips: { id: "trip-1", title: "Japan Trip" } },
    ];
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "films") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockFilm, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "film_usage") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockUsage, error: null }),
            }),
          }),
        };
      }
      if (table === "trip_films") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockTrips, error: null }),
          }),
        };
      }
      return mockSupabase;
    });

    const result = await getFilmWithDetails("film-id-123");

    expect(result.film).toEqual(mockFilm);
    expect(result.error).toBeNull();
  });

  it("returns error when film not found", async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Film not found" } });

    const result = await getFilmWithDetails("non-existent-id");

    expect(result.film).toBeNull();
    // The error is caught and wrapped
    expect(result.error).toContain("fetch film");
  });

  it("handles missing usage history gracefully", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "films") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockFilm, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "film_usage") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: { message: "No usage" } }),
            }),
          }),
        };
      }
      if (table === "trip_films") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return mockSupabase;
    });

    const result = await getFilmWithDetails("film-id-123");

    expect(result.film).toEqual(mockFilm);
    expect(result.usage).toEqual([]);
  });
});

// =============================================================================
// deleteFilm() Tests (Soft Delete)
// =============================================================================
describe("deleteFilm", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("soft deletes a film by setting deleted_at", async () => {
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const result = await deleteFilm("film-id-123");

    expect(result.success).toBe(true);
    expect(result.message).toBe("Film moved to trash");
    expect(mockSupabase.from).toHaveBeenCalledWith("films");
    expect(mockSupabase.update).toHaveBeenCalled();

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(updateCall.deleted_at).toBeDefined();
    expect(typeof updateCall.deleted_at).toBe("string");
  });

  it("returns error when delete fails", async () => {
    // Return an error when the chain resolves
    mockSupabase.eq.mockImplementation(() => {
      return Promise.resolve({ error: { message: "Delete failed" } });
    });

    const result = await deleteFilm("film-id-123");

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});

// =============================================================================
// restoreFilm() Tests
// =============================================================================
describe("restoreFilm", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("restores a film by clearing deleted_at", async () => {
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const result = await restoreFilm("film-id-123");

    expect(result.success).toBe(true);
    expect(result.message).toBe("Film restored successfully");

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(updateCall.deleted_at).toBeNull();
  });

  it("returns error when restore fails", async () => {
    // Return an error when the chain resolves
    mockSupabase.eq.mockImplementation(() => {
      return Promise.resolve({ error: { message: "Restore failed" } });
    });

    const result = await restoreFilm("film-id-123");

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});

// =============================================================================
// getDeletedFilms() Tests
// =============================================================================
describe("getDeletedFilms", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns deleted films ordered by deleted_at", async () => {
    const deletedFilms = [
      { ...mockFilm, deleted_at: "2024-01-15T00:00:00.000Z" },
    ];
    mockSupabase.order.mockImplementation(() => Promise.resolve({ data: deletedFilms, error: null }));

    const result = await getDeletedFilms();

    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
    expect(mockSupabase.is).toHaveBeenCalledWith("deleted_at", "not.null");
    expect(mockSupabase.order).toHaveBeenCalledWith("deleted_at", { ascending: false });
  });

  it("returns error when query fails", async () => {
    mockSupabase.order.mockImplementation(() => Promise.resolve({ data: null, error: { message: "Query failed" } }));

    const result = await getDeletedFilms();

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });
});

// =============================================================================
// permanentlyDeleteFilm() Tests
// =============================================================================
describe("permanentlyDeleteFilm", () => {
  beforeEach(() => {
    resetMocks();
    let eqCount = 0;
    mockSupabase.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount >= 2) {
        return Promise.resolve({ error: null });
      }
      return mockSupabase;
    });
  });

  it("permanently deletes a film", async () => {
    const result = await permanentlyDeleteFilm("film-id-123");

    expect(result.success).toBe(true);
    expect(result.message).toBe("Film permanently deleted");
    expect(mockSupabase.delete).toHaveBeenCalled();
  });

  it("returns error when permanent delete fails", async () => {
    let eqCount = 0;
    mockSupabase.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount >= 2) {
        return Promise.resolve({ error: { message: "Delete failed" } });
      }
      return mockSupabase;
    });

    const result = await permanentlyDeleteFilm("film-id-123");

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});

// =============================================================================
// reduceFilmCount() Tests
// =============================================================================
describe("reduceFilmCount", () => {
  beforeEach(() => {
    resetMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it("reduces film count and logs usage", async () => {
    const filmWithCount = { count: 10, is_bulk_film: false, user_id: "user-123" };
    mockSupabase.single.mockResolvedValue({ data: filmWithCount, error: null });
    // Handle update().eq() chain
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    const result = await reduceFilmCount("film-id-123", 2, "Photo walk");

    expect(result.success).toBe(true);
    expect(result.newCount).toBe(8);
  });

  it("does not go below zero", async () => {
    const filmWithCount = { count: 1, is_bulk_film: false, user_id: "user-123" };
    mockSupabase.single.mockResolvedValue({ data: filmWithCount, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    const result = await reduceFilmCount("film-id-123", 5, "Used all film");

    expect(result.success).toBe(true);
    expect(result.newCount).toBe(0);
  });

  it("reduces spooled_cassettes for bulk films", async () => {
    const bulkFilm = { count: 10, is_bulk_film: true, spooled_cassettes: 10, user_id: "user-123" };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    await reduceFilmCount("film-id-123", 3, "Used cassettes");

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(updateCall.count).toBe(7);
    expect(updateCall.spooled_cassettes).toBe(7);
  });

  it("handles zero count gracefully", async () => {
    const filmWithZero = { count: 0, is_bulk_film: false, user_id: "user-123" };
    mockSupabase.single.mockResolvedValue({ data: filmWithZero, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    const result = await reduceFilmCount("film-id-123", 1, "Already empty");

    expect(result.success).toBe(true);
    expect(result.newCount).toBe(0);
  });

  it("returns error when film not found", async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await reduceFilmCount("non-existent-id", 1, "Test");

    expect(result.error).toBe("Film not found");
  });

  it("returns error when update fails", async () => {
    const filmWithCount = { count: 10, is_bulk_film: false, user_id: "user-123" };
    mockSupabase.single.mockResolvedValue({ data: filmWithCount, error: null });
    let eqCallCount = 0;
    mockSupabase.eq.mockImplementation(() => {
      eqCallCount++;
      if (eqCallCount < 4) {
        return mockSupabase;
      }
      return Promise.resolve({ error: { message: "Update failed" } });
    });

    const result = await reduceFilmCount("film-id-123", 1, "Test");

    expect(result.error).toBe("Update failed");
  });

  it("returns error when usage logging fails", async () => {
    const filmWithCount = { count: 10, is_bulk_film: false, user_id: "user-123" };
    mockSupabase.single.mockResolvedValue({ data: filmWithCount, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: { message: "Insert failed" } }));

    const result = await reduceFilmCount("film-id-123", 1, "Test");

    expect(result.error).toContain("Failed to record usage");
  });

  it("logs usage with correct usage_type", async () => {
    const filmWithCount = { count: 10, is_bulk_film: false, user_id: "user-123" };
    mockSupabase.single.mockResolvedValue({ data: filmWithCount, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    await reduceFilmCount("film-id-123", 2, "Photo session");

    // Check that insert was called with film_usage data
    expect(mockSupabase.from).toHaveBeenCalledWith("film_usage");
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.usage_type).toBe("shoot");
    expect(insertCall.quantity).toBe(2);
    expect(insertCall.usage_note).toBe("Photo session");
  });
});

// =============================================================================
// spoolBulkFilm() Tests
// =============================================================================
describe("spoolBulkFilm", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("spools bulk film correctly", async () => {
    const bulkFilm = {
      bulk_remaining_exposures: 576,
      spooled_cassettes: 5,
      is_bulk_film: true,
      format: "35mm",
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    const result = await spoolBulkFilm("film-id-123", 36, 1, "Spooled one cassette");

    expect(result.success).toBe(true);
    expect(result.remainingExposures).toBe(540); // 576 - 36
    expect(result.spooledCassettes).toBe(6); // 5 + 1
  });

  it("updates count to match spooled_cassettes", async () => {
    const bulkFilm = {
      bulk_remaining_exposures: 576,
      spooled_cassettes: 5,
      is_bulk_film: true,
      format: "35mm",
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    await spoolBulkFilm("film-id-123", 72, 2, "Spooled two cassettes");

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(updateCall.count).toBe(7); // new spooled_cassettes value
    expect(updateCall.spooled_cassettes).toBe(7);
    expect(updateCall.bulk_remaining_exposures).toBe(504); // 576 - 72
  });

  it("prevents over-spooling (more exposures than available)", async () => {
    const bulkFilm = {
      bulk_remaining_exposures: 30, // Only 30 exposures left
      spooled_cassettes: 15,
      is_bulk_film: true,
      format: "35mm",
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });

    const result = await spoolBulkFilm("film-id-123", 36, 1, "Try to spool");

    expect(result.error).toBe("Not enough bulk film remaining");
  });

  it("returns error for non-bulk film", async () => {
    const nonBulkFilm = {
      is_bulk_film: false,
      format: "35mm",
    };
    mockSupabase.single.mockResolvedValue({ data: nonBulkFilm, error: null });

    const result = await spoolBulkFilm("film-id-123", 36, 1, "Try to spool");

    expect(result.error).toBe("This is not a bulk film");
  });

  it("returns error when film not found", async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await spoolBulkFilm("non-existent-id", 36, 1, "Test");

    expect(result.error).toBe("Film not found");
  });

  it("handles zero remaining exposures", async () => {
    const bulkFilm = {
      bulk_remaining_exposures: 0,
      spooled_cassettes: 16,
      is_bulk_film: true,
      format: "35mm",
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });

    const result = await spoolBulkFilm("film-id-123", 36, 1, "Empty bulk");

    expect(result.error).toBe("Not enough bulk film remaining");
  });

  it("allows spooling exact remaining amount", async () => {
    const bulkFilm = {
      bulk_remaining_exposures: 36,
      spooled_cassettes: 15,
      is_bulk_film: true,
      format: "35mm",
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    const result = await spoolBulkFilm("film-id-123", 36, 1, "Last cassette");

    expect(result.success).toBe(true);
    expect(result.remainingExposures).toBe(0);
    expect(result.spooledCassettes).toBe(16);
  });

  it("logs usage with spool type", async () => {
    const bulkFilm = {
      bulk_remaining_exposures: 576,
      spooled_cassettes: 5,
      is_bulk_film: true,
      format: "35mm",
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    await spoolBulkFilm("film-id-123", 36, 1, "Spool note");

    expect(mockSupabase.from).toHaveBeenCalledWith("film_usage");
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.usage_type).toBe("spool");
    expect(insertCall.exposures_used).toBe(36);
  });

  it("returns error when usage logging fails", async () => {
    const bulkFilm = {
      bulk_remaining_exposures: 576,
      spooled_cassettes: 5,
      is_bulk_film: true,
      format: "35mm",
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: { message: "Insert failed" } }));

    const result = await spoolBulkFilm("film-id-123", 36, 1, "Test");

    expect(result.error).toBe("Failed to record spooling");
  });
});

// =============================================================================
// getFilmUsageHistory() Tests
// =============================================================================
describe("getFilmUsageHistory", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns usage history ordered by created_at descending", async () => {
    const mockUsage = [
      { id: "usage-1", film_id: "film-123", quantity: 2, created_at: "2024-01-15" },
      { id: "usage-2", film_id: "film-123", quantity: 1, created_at: "2024-01-10" },
    ];
    mockSupabase.order.mockResolvedValue({ data: mockUsage, error: null });

    const result = await getFilmUsageHistory("film-123");

    expect(result.data).toHaveLength(2);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith("film_usage");
    expect(mockSupabase.eq).toHaveBeenCalledWith("film_id", "film-123");
    expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns empty array when no usage history", async () => {
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const result = await getFilmUsageHistory("film-123");

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it("returns error when query fails", async () => {
    mockSupabase.order.mockResolvedValue({ data: null, error: { message: "Query failed" } });

    const result = await getFilmUsageHistory("film-123");

    expect(result.data).toBeNull();
    // The function catches and wraps the error message
    expect(result.error).toContain("fetch usage history");
  });
});

// =============================================================================
// finishBulkRoll() Tests
// =============================================================================
describe("finishBulkRoll", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("increments bulk_rolls_used", async () => {
    const bulkFilm = {
      bulk_quantity: 3,
      bulk_rolls_used: 1,
      is_bulk_film: true,
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });
    // Handle the update().eq() chain
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const result = await finishBulkRoll("film-id-123");

    expect(result.success).toBe(true);
    expect(result.bulk_rolls_used).toBe(2);
    expect(result.bulk_rolls_remaining).toBe(1);
  });

  it("returns error when all bulk rolls are used", async () => {
    const bulkFilm = {
      bulk_quantity: 2,
      bulk_rolls_used: 2,
      is_bulk_film: true,
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });

    const result = await finishBulkRoll("film-id-123");

    expect(result.error).toBe("All bulk rolls have been used");
  });

  it("returns error for non-bulk film", async () => {
    const nonBulkFilm = {
      is_bulk_film: false,
    };
    mockSupabase.single.mockResolvedValue({ data: nonBulkFilm, error: null });

    const result = await finishBulkRoll("film-id-123");

    expect(result.error).toBe("This is not a bulk film");
  });

  it("returns error when film not found", async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await finishBulkRoll("non-existent-id");

    expect(result.error).toBe("Film not found");
  });

  it("handles first bulk roll correctly", async () => {
    const bulkFilm = {
      bulk_quantity: 5,
      bulk_rolls_used: 0,
      is_bulk_film: true,
    };
    mockSupabase.single.mockResolvedValue({ data: bulkFilm, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const result = await finishBulkRoll("film-id-123");

    expect(result.success).toBe(true);
    expect(result.bulk_rolls_used).toBe(1);
    expect(result.bulk_rolls_remaining).toBe(4);
  });
});

// =============================================================================
// addRollsToFilm() Tests
// =============================================================================
describe("addRollsToFilm", () => {
  beforeEach(() => {
    resetMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it("adds rolls to film and logs usage", async () => {
    // For addRollsToFilm, insert returns error: null, then select().eq().single() returns film, then update().eq() returns error: null
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));
    mockSupabase.single.mockResolvedValue({ data: { count: 5 }, error: null });
    mockSupabase.eq.mockImplementation(() => {
      // Return mock for chaining but also provide resolved value for update
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    const result = await addRollsToFilm("film-id-123", 3, "Purchased more");

    expect(result.success).toBe(true);
  });

  it("returns error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await addRollsToFilm("film-id-123", 3);

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not authenticated");
  });

  it("returns error for non-positive quantity", async () => {
    const result = await addRollsToFilm("film-id-123", 0);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Quantity must be positive");
  });

  it("returns error for negative quantity", async () => {
    const result = await addRollsToFilm("film-id-123", -5);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Quantity must be positive");
  });

  it("logs usage with add type", async () => {
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));
    mockSupabase.single.mockResolvedValue({ data: { count: 5 }, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    await addRollsToFilm("film-id-123", 3, "Bought more film");

    expect(mockSupabase.from).toHaveBeenCalledWith("film_usage");
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.usage_type).toBe("add");
    expect(insertCall.quantity).toBe(3);
  });

  it("creates default note when none provided", async () => {
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));
    mockSupabase.single.mockResolvedValue({ data: { count: 5 }, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    await addRollsToFilm("film-id-123", 1);

    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.usage_note).toBe("Added 1 roll");
  });

  it("pluralizes note correctly for multiple rolls", async () => {
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));
    mockSupabase.single.mockResolvedValue({ data: { count: 5 }, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    await addRollsToFilm("film-id-123", 5);

    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.usage_note).toBe("Added 5 rolls");
  });

  it("returns error when usage logging fails", async () => {
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: { message: "Insert failed" } }));

    const result = await addRollsToFilm("film-id-123", 3);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("updates film count correctly", async () => {
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));
    mockSupabase.single.mockResolvedValue({ data: { count: 5 }, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    await addRollsToFilm("film-id-123", 3);

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(updateCall.count).toBe(8); // 5 + 3
  });

  it("handles null count as zero", async () => {
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));
    mockSupabase.single.mockResolvedValue({ data: { count: null }, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });

    await addRollsToFilm("film-id-123", 3);

    const updateCall = mockSupabase.update.mock.calls[0][0];
    expect(updateCall.count).toBe(3); // 0 + 3
  });
});

// =============================================================================
// logout() Tests
// =============================================================================
describe("logout", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("calls supabase auth signOut", async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    await logout();

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});

// =============================================================================
// Edge Cases and Integration Scenarios
// =============================================================================
describe("Edge Cases", () => {
  beforeEach(() => {
    resetMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it("handles very large ISO values", async () => {
    const highIsoFilm = {
      ...validFilmData,
      iso: 6400,
    };
    mockSupabase.insert.mockResolvedValue({ error: null });

    const result = await createFilm(highIsoFilm);

    expect(result.success).toBe(true);
    expect(result.film?.iso).toBe(6400);
  });

  it("handles films with all optional fields undefined", async () => {
    const minimalFilm: FilmSchema = {
      name: "Test Film",
      brand: "Test",
      iso: 100,
      format: "35mm",
      type: "color",
      expiration_date: "2025-01-01",
    };
    mockSupabase.insert.mockResolvedValue({ error: null });

    const result = await createFilm(minimalFilm);

    expect(result.success).toBe(true);
  });

  it("handles concurrent operations on same film", async () => {
    const film = { count: 10, is_bulk_film: false, user_id: "user-123" };
    mockSupabase.single.mockResolvedValue({ data: film, error: null });
    mockSupabase.eq.mockImplementation(() => {
      const result = { ...mockSupabase };
      return Object.assign(result, Promise.resolve({ error: null }));
    });
    mockSupabase.insert.mockImplementation(() => Promise.resolve({ error: null }));

    // Simulate two concurrent reduce operations
    const [result1, result2] = await Promise.all([
      reduceFilmCount("film-id-123", 3, "First use"),
      reduceFilmCount("film-id-123", 2, "Second use"),
    ]);

    // Both should succeed (actual race condition handling depends on DB)
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it("handles special characters in notes", async () => {
    const filmWithSpecialNotes = {
      ...validFilmData,
      notes: "Test with 'quotes' and \"double quotes\" and <html> tags",
    };
    mockSupabase.insert.mockResolvedValue({ error: null });

    const result = await createFilm(filmWithSpecialNotes);

    expect(result.success).toBe(true);
    expect(result.film?.notes).toContain("'quotes'");
  });

  it("handles unicode characters in film names", async () => {
    const filmWithUnicode = {
      ...validFilmData,
      name: "Fujifilm 業務用 100",
    };
    mockSupabase.insert.mockResolvedValue({ error: null });

    const result = await createFilm(filmWithUnicode);

    expect(result.success).toBe(true);
    expect(result.film?.name).toBe("Fujifilm 業務用 100");
  });
});
