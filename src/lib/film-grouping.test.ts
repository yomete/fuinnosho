import { describe, it, expect } from "vitest";
import {
  groupFilms,
  createGroupKey,
  isFilmGroup,
  expandGroup,
  applyExpansionState,
  FilmGroup,
  TableRow,
} from "./film-grouping";
import { Film } from "./utils";

// Helper function to create mock Film objects
function createMockFilm(overrides: Partial<Film> = {}): Film {
  return {
    id: "film-1",
    name: "Portra 400",
    brand: "Kodak",
    iso: 400,
    format: "35mm",
    type: "Color Negative",
    expiration_date: "2025-12-31",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    user_id: "user-123",
    count: 1,
    price: 15.99,
    ...overrides,
  };
}

describe("createGroupKey", () => {
  it("creates a key with all fields present", () => {
    const film = createMockFilm({
      name: "Portra 400",
      brand: "Kodak",
      format: "35mm",
      iso: 400,
      type: "Color Negative",
      is_ecn: false,
    });

    const key = createGroupKey(film);
    expect(key).toBe("Portra 400|Kodak|35mm|400|Color Negative|false");
  });

  it("creates a key when is_ecn is true", () => {
    const film = createMockFilm({
      name: "Vision3 500T",
      brand: "Kodak",
      format: "35mm",
      iso: 500,
      type: "Color Negative",
      is_ecn: true,
    });

    const key = createGroupKey(film);
    expect(key).toBe("Vision3 500T|Kodak|35mm|500|Color Negative|true");
  });

  it("defaults is_ecn to false when undefined", () => {
    const film = createMockFilm({
      name: "HP5 Plus",
      brand: "Ilford",
      format: "120",
      iso: 400,
      type: "Black & White",
      is_ecn: undefined,
    });

    const key = createGroupKey(film);
    expect(key).toBe("HP5 Plus|Ilford|120|400|Black & White|false");
  });

  it("handles films with different formats", () => {
    const film35mm = createMockFilm({ format: "35mm" });
    const film120 = createMockFilm({ format: "120" });
    const film4x5 = createMockFilm({ format: "4x5" });

    expect(createGroupKey(film35mm)).toContain("|35mm|");
    expect(createGroupKey(film120)).toContain("|120|");
    expect(createGroupKey(film4x5)).toContain("|4x5|");
  });

  it("creates different keys for films with different ISO values", () => {
    const film100 = createMockFilm({ iso: 100 });
    const film400 = createMockFilm({ iso: 400 });

    expect(createGroupKey(film100)).not.toBe(createGroupKey(film400));
  });

  it("creates different keys for films with different types", () => {
    const colorFilm = createMockFilm({ type: "Color Negative" });
    const bwFilm = createMockFilm({ type: "Black & White" });

    expect(createGroupKey(colorFilm)).not.toBe(createGroupKey(bwFilm));
  });
});

describe("isFilmGroup", () => {
  it("returns true for FilmGroup objects", () => {
    const group: FilmGroup = {
      id: "group-1",
      groupKey: "test-key",
      isGroup: true,
      isExpanded: false,
      films: [],
      name: "Test",
      brand: "Test",
      iso: 400,
      format: "35mm",
      type: "Color Negative",
      total_count: 0,
      total_available: 0,
      total_reserved: 0,
      earliest_expiration: "2025-12-31",
      count: 0,
      available_count: 0,
      reserved_quantity: 0,
      expiration_date: "2025-12-31",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    expect(isFilmGroup(group)).toBe(true);
  });

  it("returns false for Film objects", () => {
    const film = createMockFilm();
    expect(isFilmGroup(film)).toBe(false);
  });

  it("returns false for objects with isGroup set to false", () => {
    const notAGroup = {
      ...createMockFilm(),
      isGroup: false,
    } as unknown as TableRow;

    expect(isFilmGroup(notAGroup)).toBe(false);
  });

  it("returns false for objects without isGroup property", () => {
    const plainFilm = createMockFilm();
    expect(isFilmGroup(plainFilm)).toBe(false);
  });
});

describe("groupFilms", () => {
  describe("with empty array", () => {
    it("returns empty array", () => {
      const result = groupFilms([]);
      expect(result).toEqual([]);
    });

    it("returns empty array when grouping is disabled", () => {
      const result = groupFilms([], { enableGrouping: false });
      expect(result).toEqual([]);
    });
  });

  describe("with single film", () => {
    it("returns the film as-is (not grouped)", () => {
      const film = createMockFilm({ id: "single-film" });
      const result = groupFilms([film]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(film);
      expect(isFilmGroup(result[0])).toBe(false);
    });
  });

  describe("with grouping disabled", () => {
    it("returns films as-is without grouping", () => {
      const film1 = createMockFilm({ id: "film-1" });
      const film2 = createMockFilm({ id: "film-2" });
      const film3 = createMockFilm({ id: "film-3", name: "Different Film" });

      const result = groupFilms([film1, film2, film3], { enableGrouping: false });

      expect(result).toHaveLength(3);
      expect(result).toEqual([film1, film2, film3]);
    });
  });

  describe("with multiple films - same key", () => {
    it("groups films with identical identifying properties", () => {
      const film1 = createMockFilm({
        id: "film-1",
        count: 2,
        expiration_date: "2025-06-01",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-02-01T00:00:00Z",
      });
      const film2 = createMockFilm({
        id: "film-2",
        count: 3,
        expiration_date: "2025-12-31",
        created_at: "2024-02-15T00:00:00Z",
        updated_at: "2024-03-01T00:00:00Z",
      });

      const result = groupFilms([film1, film2]);

      expect(result).toHaveLength(1);
      expect(isFilmGroup(result[0])).toBe(true);

      const group = result[0] as FilmGroup;
      expect(group.films).toHaveLength(2);
      expect(group.films).toContain(film1);
      expect(group.films).toContain(film2);
    });

    it("aggregates total_count from all films", () => {
      const film1 = createMockFilm({ id: "film-1", count: 5 });
      const film2 = createMockFilm({ id: "film-2", count: 3 });
      const film3 = createMockFilm({ id: "film-3", count: 2 });

      const result = groupFilms([film1, film2, film3]);
      const group = result[0] as FilmGroup;

      expect(group.total_count).toBe(10);
      expect(group.count).toBe(10); // Compatibility mapping
    });

    it("aggregates total_available from available_count when present", () => {
      const film1 = createMockFilm({
        id: "film-1",
        count: 5,
        available_count: 4,
      });
      const film2 = createMockFilm({
        id: "film-2",
        count: 3,
        available_count: 2,
      });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.total_available).toBe(6);
      expect(group.available_count).toBe(6); // Compatibility mapping
    });

    it("falls back to count when available_count is not a number", () => {
      const film1 = createMockFilm({
        id: "film-1",
        count: 5,
        available_count: undefined,
      });
      const film2 = createMockFilm({
        id: "film-2",
        count: 3,
        available_count: undefined,
      });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.total_available).toBe(8);
    });

    it("aggregates reserved_quantity from all films", () => {
      const film1 = createMockFilm({
        id: "film-1",
        reserved_quantity: 2,
      });
      const film2 = createMockFilm({
        id: "film-2",
        reserved_quantity: 1,
      });
      const film3 = createMockFilm({
        id: "film-3",
        reserved_quantity: 0,
      });

      const result = groupFilms([film1, film2, film3]);
      const group = result[0] as FilmGroup;

      expect(group.total_reserved).toBe(3);
      expect(group.reserved_quantity).toBe(3); // Compatibility mapping
    });

    it("handles undefined reserved_quantity", () => {
      const film1 = createMockFilm({
        id: "film-1",
        reserved_quantity: undefined,
      });
      const film2 = createMockFilm({
        id: "film-2",
        reserved_quantity: 2,
      });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.total_reserved).toBe(2);
    });

    it("finds earliest expiration date", () => {
      const film1 = createMockFilm({
        id: "film-1",
        expiration_date: "2026-12-31",
      });
      const film2 = createMockFilm({
        id: "film-2",
        expiration_date: "2025-06-15",
      });
      const film3 = createMockFilm({
        id: "film-3",
        expiration_date: "2025-01-01",
      });

      const result = groupFilms([film1, film2, film3]);
      const group = result[0] as FilmGroup;

      expect(group.earliest_expiration).toBe("2025-01-01");
      expect(group.expiration_date).toBe("2025-01-01"); // Compatibility mapping
    });

    it("finds earliest created_at timestamp", () => {
      const film1 = createMockFilm({
        id: "film-1",
        created_at: "2024-03-01T10:00:00Z",
      });
      const film2 = createMockFilm({
        id: "film-2",
        created_at: "2024-01-15T08:30:00Z",
      });
      const film3 = createMockFilm({
        id: "film-3",
        created_at: "2024-02-20T12:00:00Z",
      });

      const result = groupFilms([film1, film2, film3]);
      const group = result[0] as FilmGroup;

      expect(group.created_at).toBe("2024-01-15T08:30:00Z");
    });

    it("finds latest updated_at timestamp", () => {
      const film1 = createMockFilm({
        id: "film-1",
        updated_at: "2024-02-01T10:00:00Z",
      });
      const film2 = createMockFilm({
        id: "film-2",
        updated_at: "2024-04-15T08:30:00Z",
      });
      const film3 = createMockFilm({
        id: "film-3",
        updated_at: "2024-03-20T12:00:00Z",
      });

      const result = groupFilms([film1, film2, film3]);
      const group = result[0] as FilmGroup;

      expect(group.updated_at).toBe("2024-04-15T08:30:00Z");
    });

    it("preserves core identifying fields from first film", () => {
      const film1 = createMockFilm({
        id: "film-1",
        name: "Portra 400",
        brand: "Kodak",
        iso: 400,
        format: "35mm",
        type: "Color Negative",
        is_ecn: false,
        user_id: "user-abc",
      });
      const film2 = createMockFilm({ id: "film-2" });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.name).toBe("Portra 400");
      expect(group.brand).toBe("Kodak");
      expect(group.iso).toBe(400);
      expect(group.format).toBe("35mm");
      expect(group.type).toBe("Color Negative");
      expect(group.is_ecn).toBe(false);
      expect(group.user_id).toBe("user-abc");
    });

    it("creates correct group id and groupKey", () => {
      const film1 = createMockFilm({ id: "film-1" });
      const film2 = createMockFilm({ id: "film-2" });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      const expectedKey = createGroupKey(film1);
      expect(group.groupKey).toBe(expectedKey);
      expect(group.id).toBe(`group-${expectedKey}`);
    });

    it("sets isGroup to true and isExpanded to false", () => {
      const film1 = createMockFilm({ id: "film-1" });
      const film2 = createMockFilm({ id: "film-2" });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.isGroup).toBe(true);
      expect(group.isExpanded).toBe(false);
    });
  });

  describe("with multiple films - different keys", () => {
    it("creates separate groups for different film types", () => {
      const portra1 = createMockFilm({
        id: "portra-1",
        name: "Portra 400",
        brand: "Kodak",
      });
      const portra2 = createMockFilm({
        id: "portra-2",
        name: "Portra 400",
        brand: "Kodak",
      });
      const hp5 = createMockFilm({
        id: "hp5-1",
        name: "HP5 Plus",
        brand: "Ilford",
        type: "Black & White",
      });

      const result = groupFilms([portra1, portra2, hp5]);

      expect(result).toHaveLength(2);

      // One group for Portra films
      const portraGroup = result.find(
        (r) => isFilmGroup(r) && (r as FilmGroup).name === "Portra 400"
      ) as FilmGroup;
      expect(portraGroup).toBeDefined();
      expect(portraGroup.films).toHaveLength(2);

      // HP5 stays as individual film (only one)
      const hp5Result = result.find(
        (r) => !isFilmGroup(r) && (r as Film).id === "hp5-1"
      );
      expect(hp5Result).toBeDefined();
    });

    it("does not group films with different ISO values", () => {
      const film100 = createMockFilm({
        id: "film-100",
        name: "Portra",
        iso: 100,
      });
      const film400 = createMockFilm({
        id: "film-400",
        name: "Portra",
        iso: 400,
      });

      const result = groupFilms([film100, film400]);

      expect(result).toHaveLength(2);
      expect(result.every((r) => !isFilmGroup(r))).toBe(true);
    });

    it("does not group films with different formats", () => {
      const film35mm = createMockFilm({
        id: "film-35mm",
        format: "35mm",
      });
      const film120 = createMockFilm({
        id: "film-120",
        format: "120",
      });

      const result = groupFilms([film35mm, film120]);

      expect(result).toHaveLength(2);
      expect(result.every((r) => !isFilmGroup(r))).toBe(true);
    });

    it("does not group films with different is_ecn values", () => {
      const regularFilm = createMockFilm({
        id: "regular",
        name: "Vision3 500T",
        is_ecn: false,
      });
      const ecnFilm = createMockFilm({
        id: "ecn",
        name: "Vision3 500T",
        is_ecn: true,
      });

      const result = groupFilms([regularFilm, ecnFilm]);

      expect(result).toHaveLength(2);
      expect(result.every((r) => !isFilmGroup(r))).toBe(true);
    });
  });

  describe("edge cases with null/undefined values", () => {
    it("handles films with undefined count", () => {
      const film1 = createMockFilm({
        id: "film-1",
        count: undefined,
      });
      const film2 = createMockFilm({
        id: "film-2",
        count: 5,
      });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.total_count).toBe(5);
    });

    it("handles all films with undefined count", () => {
      const film1 = createMockFilm({
        id: "film-1",
        count: undefined,
      });
      const film2 = createMockFilm({
        id: "film-2",
        count: undefined,
      });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.total_count).toBe(0);
    });

    it("handles films with zero count", () => {
      const film1 = createMockFilm({
        id: "film-1",
        count: 0,
      });
      const film2 = createMockFilm({
        id: "film-2",
        count: 0,
      });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.total_count).toBe(0);
    });

    it("handles films with available_count of 0", () => {
      const film1 = createMockFilm({
        id: "film-1",
        count: 5,
        available_count: 0,
      });
      const film2 = createMockFilm({
        id: "film-2",
        count: 3,
        available_count: 0,
      });

      const result = groupFilms([film1, film2]);
      const group = result[0] as FilmGroup;

      expect(group.total_available).toBe(0);
    });

    it("handles mixed available_count presence", () => {
      const filmWithAvailable = createMockFilm({
        id: "film-1",
        count: 5,
        available_count: 3,
      });
      const filmWithoutAvailable = createMockFilm({
        id: "film-2",
        count: 4,
        available_count: undefined,
      });

      const result = groupFilms([filmWithAvailable, filmWithoutAvailable]);
      const group = result[0] as FilmGroup;

      // 3 (explicit) + 4 (fallback to count)
      expect(group.total_available).toBe(7);
    });
  });

  describe("default options", () => {
    it("enables grouping by default", () => {
      const film1 = createMockFilm({ id: "film-1" });
      const film2 = createMockFilm({ id: "film-2" });

      const result = groupFilms([film1, film2]);

      expect(result).toHaveLength(1);
      expect(isFilmGroup(result[0])).toBe(true);
    });

    it("can explicitly enable grouping", () => {
      const film1 = createMockFilm({ id: "film-1" });
      const film2 = createMockFilm({ id: "film-2" });

      const result = groupFilms([film1, film2], { enableGrouping: true });

      expect(result).toHaveLength(1);
      expect(isFilmGroup(result[0])).toBe(true);
    });
  });
});

describe("expandGroup", () => {
  it("returns array with group followed by its films", () => {
    const film1 = createMockFilm({ id: "film-1" });
    const film2 = createMockFilm({ id: "film-2" });

    const group: FilmGroup = {
      id: "group-1",
      groupKey: "test-key",
      isGroup: true,
      isExpanded: false,
      films: [film1, film2],
      name: "Portra 400",
      brand: "Kodak",
      iso: 400,
      format: "35mm",
      type: "Color Negative",
      total_count: 2,
      total_available: 2,
      total_reserved: 0,
      earliest_expiration: "2025-12-31",
      count: 2,
      available_count: 2,
      reserved_quantity: 0,
      expiration_date: "2025-12-31",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const result = expandGroup(group);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(group);
    expect(result[1]).toBe(film1);
    expect(result[2]).toBe(film2);
  });

  it("returns array with just the group when it has no films", () => {
    const group: FilmGroup = {
      id: "group-empty",
      groupKey: "test-key",
      isGroup: true,
      isExpanded: false,
      films: [],
      name: "Empty",
      brand: "Test",
      iso: 400,
      format: "35mm",
      type: "Color",
      total_count: 0,
      total_available: 0,
      total_reserved: 0,
      earliest_expiration: "2025-12-31",
      count: 0,
      available_count: 0,
      reserved_quantity: 0,
      expiration_date: "2025-12-31",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const result = expandGroup(group);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(group);
  });
});

describe("applyExpansionState", () => {
  const createTestGroup = (groupKey: string, films: Film[]): FilmGroup => ({
    id: `group-${groupKey}`,
    groupKey,
    isGroup: true,
    isExpanded: false,
    films,
    name: "Test",
    brand: "Test",
    iso: 400,
    format: "35mm",
    type: "Color",
    total_count: films.length,
    total_available: films.length,
    total_reserved: 0,
    earliest_expiration: "2025-12-31",
    count: films.length,
    available_count: films.length,
    reserved_quantity: 0,
    expiration_date: "2025-12-31",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  });

  it("keeps groups collapsed when not in expansion state", () => {
    const film1 = createMockFilm({ id: "film-1" });
    const film2 = createMockFilm({ id: "film-2" });
    const group = createTestGroup("key-1", [film1, film2]);

    const rows: TableRow[] = [group];
    const expansionState = new Map<string, boolean>();

    const result = applyExpansionState(rows, expansionState);

    expect(result).toHaveLength(1);
    expect(isFilmGroup(result[0])).toBe(true);
    expect((result[0] as FilmGroup).isExpanded).toBe(false);
  });

  it("expands groups when marked as expanded", () => {
    const film1 = createMockFilm({ id: "film-1" });
    const film2 = createMockFilm({ id: "film-2" });
    const group = createTestGroup("key-1", [film1, film2]);

    const rows: TableRow[] = [group];
    const expansionState = new Map<string, boolean>([["key-1", true]]);

    const result = applyExpansionState(rows, expansionState);

    expect(result).toHaveLength(3);
    expect(isFilmGroup(result[0])).toBe(true);
    expect((result[0] as FilmGroup).isExpanded).toBe(true);
    expect(result[1]).toBe(film1);
    expect(result[2]).toBe(film2);
  });

  it("handles multiple groups with mixed expansion states", () => {
    const film1 = createMockFilm({ id: "film-1" });
    const film2 = createMockFilm({ id: "film-2" });
    const film3 = createMockFilm({ id: "film-3" });
    const film4 = createMockFilm({ id: "film-4" });

    const group1 = createTestGroup("key-1", [film1, film2]);
    const group2 = createTestGroup("key-2", [film3, film4]);

    const rows: TableRow[] = [group1, group2];
    const expansionState = new Map<string, boolean>([
      ["key-1", true],
      ["key-2", false],
    ]);

    const result = applyExpansionState(rows, expansionState);

    expect(result).toHaveLength(4); // expanded group + 2 films + collapsed group
    expect(isFilmGroup(result[0])).toBe(true);
    expect((result[0] as FilmGroup).isExpanded).toBe(true);
    expect(result[1]).toBe(film1);
    expect(result[2]).toBe(film2);
    expect(isFilmGroup(result[3])).toBe(true);
    expect((result[3] as FilmGroup).isExpanded).toBe(false);
  });

  it("passes through individual films unchanged", () => {
    const individualFilm = createMockFilm({ id: "individual" });
    const film1 = createMockFilm({ id: "film-1" });
    const film2 = createMockFilm({ id: "film-2" });
    const group = createTestGroup("key-1", [film1, film2]);

    const rows: TableRow[] = [individualFilm, group];
    const expansionState = new Map<string, boolean>();

    const result = applyExpansionState(rows, expansionState);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(individualFilm);
    expect(isFilmGroup(result[1])).toBe(true);
  });

  it("creates new group objects with updated isExpanded state", () => {
    const film1 = createMockFilm({ id: "film-1" });
    const group = createTestGroup("key-1", [film1]);

    const rows: TableRow[] = [group];
    const expansionState = new Map<string, boolean>([["key-1", true]]);

    const result = applyExpansionState(rows, expansionState);

    // Should be a new object, not mutate the original
    expect(result[0]).not.toBe(group);
    expect((result[0] as FilmGroup).isExpanded).toBe(true);
    expect(group.isExpanded).toBe(false); // Original unchanged
  });

  it("handles empty rows array", () => {
    const expansionState = new Map<string, boolean>();
    const result = applyExpansionState([], expansionState);

    expect(result).toEqual([]);
  });

  it("handles empty expansion state map", () => {
    const film1 = createMockFilm({ id: "film-1" });
    const group = createTestGroup("key-1", [film1]);

    const result = applyExpansionState([group], new Map());

    expect(result).toHaveLength(1);
    expect((result[0] as FilmGroup).isExpanded).toBe(false);
  });
});

describe("integration: groupFilms + applyExpansionState", () => {
  it("works together to create expandable grouped view", () => {
    // Create films that should be grouped
    const portra1 = createMockFilm({
      id: "portra-1",
      name: "Portra 400",
      brand: "Kodak",
      count: 2,
    });
    const portra2 = createMockFilm({
      id: "portra-2",
      name: "Portra 400",
      brand: "Kodak",
      count: 3,
    });
    const hp5 = createMockFilm({
      id: "hp5-1",
      name: "HP5 Plus",
      brand: "Ilford",
      type: "Black & White",
      count: 5,
    });

    // Group films
    const grouped = groupFilms([portra1, portra2, hp5]);
    expect(grouped).toHaveLength(2);

    // Find the Portra group
    const portraGroup = grouped.find(
      (r) => isFilmGroup(r) && (r as FilmGroup).name === "Portra 400"
    ) as FilmGroup;

    // Apply expansion state to expand the Portra group
    const expansionState = new Map<string, boolean>([
      [portraGroup.groupKey, true],
    ]);
    const expanded = applyExpansionState(grouped, expansionState);

    // Should have: expanded Portra group + 2 Portra films + HP5 individual
    expect(expanded).toHaveLength(4);

    // Verify the Portra group is expanded with its children
    expect(isFilmGroup(expanded[0])).toBe(true);
    expect((expanded[0] as FilmGroup).isExpanded).toBe(true);
    expect((expanded[0] as FilmGroup).total_count).toBe(5);

    // Verify child films follow the group
    const childFilmIds = [expanded[1], expanded[2]]
      .filter((r) => !isFilmGroup(r))
      .map((r) => (r as Film).id);
    expect(childFilmIds).toContain("portra-1");
    expect(childFilmIds).toContain("portra-2");
  });
});
