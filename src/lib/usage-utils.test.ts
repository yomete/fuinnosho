import { describe, it, expect } from "vitest";
import { getDevelopmentCost, getDevelopmentType, calculateTotalCost } from "./usage-utils";
import { Film } from "./utils";

// Helper function to create a minimal Film object for testing
function createFilm(overrides: Partial<Film> = {}): Film {
  return {
    id: "test-id",
    name: "Test Film",
    brand: "Test Brand",
    iso: 400,
    format: "35mm",
    type: "Color Negative",
    expiration_date: "2025-12-31",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getDevelopmentCost", () => {
  describe("ECN films", () => {
    it("returns 9 for ECN film", () => {
      const film = createFilm({ is_ecn: true, type: "Color Negative" });
      expect(getDevelopmentCost(film)).toBe(9);
    });

    it("returns 9 for ECN film regardless of type field", () => {
      const film = createFilm({ is_ecn: true, type: "Black & White" });
      expect(getDevelopmentCost(film)).toBe(9);
    });

    it("prioritizes is_ecn flag over type", () => {
      const film = createFilm({ is_ecn: true, type: "Color Negative" });
      expect(getDevelopmentCost(film)).toBe(9);
    });
  });

  describe("C41 films", () => {
    it("returns 6 for Color Negative film", () => {
      const film = createFilm({ type: "Color Negative", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(6);
    });

    it("returns 6 for Color Negative film when is_ecn is undefined", () => {
      const film = createFilm({ type: "Color Negative" });
      delete (film as Partial<Film>).is_ecn;
      expect(getDevelopmentCost(film)).toBe(6);
    });
  });

  describe("B&W films", () => {
    it("returns 0 for Black & White film", () => {
      const film = createFilm({ type: "Black & White", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(0);
    });

    it("returns 0 for Black & White Negative film", () => {
      const film = createFilm({ type: "Black & White Negative", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(0);
    });

    it("returns 0 for Black & White Reversal film", () => {
      const film = createFilm({ type: "Black & White Reversal", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(0);
    });

    it("handles type with Black & White in different positions", () => {
      const film = createFilm({ type: "Some Black & White Type", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(0);
    });
  });

  describe("Slide films (E-6)", () => {
    it("returns 6 (default) for slide film", () => {
      const film = createFilm({ type: "Slide", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(6);
    });

    it("returns 6 (default) for Color Reversal film", () => {
      const film = createFilm({ type: "Color Reversal", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(6);
    });
  });

  describe("Unknown/edge cases", () => {
    it("returns 6 (default) for unknown film types", () => {
      const film = createFilm({ type: "Unknown Type", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(6);
    });

    it("returns 6 (default) for empty type string", () => {
      const film = createFilm({ type: "", is_ecn: false });
      expect(getDevelopmentCost(film)).toBe(6);
    });

    it("handles undefined type gracefully", () => {
      const film = createFilm({ is_ecn: false });
      (film as Record<string, unknown>).type = undefined;
      expect(getDevelopmentCost(film)).toBe(6);
    });

    it("handles null-ish is_ecn value", () => {
      const film = createFilm({ type: "Color Negative" });
      (film as Record<string, unknown>).is_ecn = null;
      expect(getDevelopmentCost(film)).toBe(6);
    });
  });
});

describe("getDevelopmentType", () => {
  describe("ECN films", () => {
    it("returns ECN for ECN film", () => {
      const film = createFilm({ is_ecn: true });
      expect(getDevelopmentType(film)).toBe("ECN");
    });

    it("prioritizes ECN over other types", () => {
      const film = createFilm({ is_ecn: true, type: "Black & White" });
      expect(getDevelopmentType(film)).toBe("ECN");
    });
  });

  describe("C41 films", () => {
    it("returns C41 for Color Negative film", () => {
      const film = createFilm({ type: "Color Negative", is_ecn: false });
      expect(getDevelopmentType(film)).toBe("C41");
    });

    it("returns C41 for Color Negative with undefined is_ecn", () => {
      const film = createFilm({ type: "Color Negative" });
      delete (film as Partial<Film>).is_ecn;
      expect(getDevelopmentType(film)).toBe("C41");
    });
  });

  describe("B&W films", () => {
    it("returns B&W for Black & White film", () => {
      const film = createFilm({ type: "Black & White", is_ecn: false });
      expect(getDevelopmentType(film)).toBe("B&W");
    });

    it("returns B&W for Black & White Negative film", () => {
      const film = createFilm({ type: "Black & White Negative", is_ecn: false });
      expect(getDevelopmentType(film)).toBe("B&W");
    });

    it("returns B&W for any type containing Black & White", () => {
      const film = createFilm({ type: "Custom Black & White Film", is_ecn: false });
      expect(getDevelopmentType(film)).toBe("B&W");
    });
  });

  describe("Default/unknown types", () => {
    it("returns C41 for slide film (default)", () => {
      const film = createFilm({ type: "Slide", is_ecn: false });
      expect(getDevelopmentType(film)).toBe("C41");
    });

    it("returns C41 for Color Reversal film (default)", () => {
      const film = createFilm({ type: "Color Reversal", is_ecn: false });
      expect(getDevelopmentType(film)).toBe("C41");
    });

    it("returns C41 for unknown types", () => {
      const film = createFilm({ type: "Unknown Film Type", is_ecn: false });
      expect(getDevelopmentType(film)).toBe("C41");
    });

    it("returns C41 for empty type string", () => {
      const film = createFilm({ type: "", is_ecn: false });
      expect(getDevelopmentType(film)).toBe("C41");
    });
  });

  describe("Edge cases", () => {
    it("handles undefined type", () => {
      const film = createFilm({ is_ecn: false });
      (film as Record<string, unknown>).type = undefined;
      expect(getDevelopmentType(film)).toBe("C41");
    });

    it("handles falsy is_ecn values", () => {
      const film = createFilm({ type: "Color Negative" });
      (film as Record<string, unknown>).is_ecn = false;
      expect(getDevelopmentType(film)).toBe("C41");
    });
  });
});

describe("calculateTotalCost", () => {
  describe("Basic calculations", () => {
    it("calculates cost for single roll of C41 film", () => {
      const film = createFilm({ type: "Color Negative", is_ecn: false });
      const result = calculateTotalCost(film, 1);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 6,
        totalCost: 6,
      });
    });

    it("calculates cost for multiple rolls of C41 film", () => {
      const film = createFilm({ type: "Color Negative", is_ecn: false });
      const result = calculateTotalCost(film, 5);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 30,
        totalCost: 30,
      });
    });

    it("calculates cost for single roll of ECN film", () => {
      const film = createFilm({ is_ecn: true });
      const result = calculateTotalCost(film, 1);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 9,
        totalCost: 9,
      });
    });

    it("calculates cost for multiple rolls of ECN film", () => {
      const film = createFilm({ is_ecn: true });
      const result = calculateTotalCost(film, 3);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 27,
        totalCost: 27,
      });
    });

    it("calculates zero cost for B&W film", () => {
      const film = createFilm({ type: "Black & White", is_ecn: false });
      const result = calculateTotalCost(film, 10);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 0,
        totalCost: 0,
      });
    });
  });

  describe("Edge cases with quantity", () => {
    it("calculates zero cost for zero quantity", () => {
      const film = createFilm({ type: "Color Negative", is_ecn: false });
      const result = calculateTotalCost(film, 0);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 0,
        totalCost: 0,
      });
    });

    it("handles large quantities", () => {
      const film = createFilm({ type: "Color Negative", is_ecn: false });
      const result = calculateTotalCost(film, 100);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 600,
        totalCost: 600,
      });
    });

    it("handles fractional quantities", () => {
      const film = createFilm({ type: "Color Negative", is_ecn: false });
      const result = calculateTotalCost(film, 1.5);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 9, // 6 * 1.5
        totalCost: 9,
      });
    });

    it("handles negative quantities (edge case)", () => {
      const film = createFilm({ type: "Color Negative", is_ecn: false });
      const result = calculateTotalCost(film, -1);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: -6,
        totalCost: -6,
      });
    });
  });

  describe("Film cost behavior", () => {
    it("always returns 0 for filmCost (sunk cost)", () => {
      const film = createFilm({ price: 15, type: "Color Negative" });
      const result = calculateTotalCost(film, 1);
      expect(result.filmCost).toBe(0);
    });

    it("totalCost equals developmentCost (no film cost included)", () => {
      const film = createFilm({ price: 20, type: "Color Negative", is_ecn: false });
      const result = calculateTotalCost(film, 2);
      expect(result.totalCost).toBe(result.developmentCost);
      expect(result.totalCost).toBe(12); // 6 * 2
    });
  });

  describe("Different film types", () => {
    it("calculates correct cost for slide film", () => {
      const film = createFilm({ type: "Slide", is_ecn: false });
      const result = calculateTotalCost(film, 2);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 12,
        totalCost: 12,
      });
    });

    it("calculates correct cost for Color Reversal film", () => {
      const film = createFilm({ type: "Color Reversal", is_ecn: false });
      const result = calculateTotalCost(film, 1);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 6,
        totalCost: 6,
      });
    });

    it("calculates correct cost for Black & White Negative", () => {
      const film = createFilm({ type: "Black & White Negative", is_ecn: false });
      const result = calculateTotalCost(film, 5);
      expect(result).toEqual({
        filmCost: 0,
        developmentCost: 0,
        totalCost: 0,
      });
    });
  });

  describe("Return type structure", () => {
    it("returns object with all required properties", () => {
      const film = createFilm();
      const result = calculateTotalCost(film, 1);
      expect(result).toHaveProperty("filmCost");
      expect(result).toHaveProperty("developmentCost");
      expect(result).toHaveProperty("totalCost");
    });

    it("returns numeric values for all properties", () => {
      const film = createFilm();
      const result = calculateTotalCost(film, 1);
      expect(typeof result.filmCost).toBe("number");
      expect(typeof result.developmentCost).toBe("number");
      expect(typeof result.totalCost).toBe("number");
    });
  });
});

describe("Integration scenarios", () => {
  it("getDevelopmentType and getDevelopmentCost are consistent for ECN", () => {
    const film = createFilm({ is_ecn: true });
    expect(getDevelopmentType(film)).toBe("ECN");
    expect(getDevelopmentCost(film)).toBe(9);
  });

  it("getDevelopmentType and getDevelopmentCost are consistent for C41", () => {
    const film = createFilm({ type: "Color Negative", is_ecn: false });
    expect(getDevelopmentType(film)).toBe("C41");
    expect(getDevelopmentCost(film)).toBe(6);
  });

  it("getDevelopmentType and getDevelopmentCost are consistent for B&W", () => {
    const film = createFilm({ type: "Black & White", is_ecn: false });
    expect(getDevelopmentType(film)).toBe("B&W");
    expect(getDevelopmentCost(film)).toBe(0);
  });

  it("calculateTotalCost uses getDevelopmentCost correctly", () => {
    const ecnFilm = createFilm({ is_ecn: true });
    const c41Film = createFilm({ type: "Color Negative", is_ecn: false });
    const bwFilm = createFilm({ type: "Black & White", is_ecn: false });

    expect(calculateTotalCost(ecnFilm, 1).developmentCost).toBe(getDevelopmentCost(ecnFilm));
    expect(calculateTotalCost(c41Film, 1).developmentCost).toBe(getDevelopmentCost(c41Film));
    expect(calculateTotalCost(bwFilm, 1).developmentCost).toBe(getDevelopmentCost(bwFilm));
  });
});

describe("Real-world film examples", () => {
  it("Kodak Portra 400 (C41)", () => {
    const film = createFilm({
      name: "Portra 400",
      brand: "Kodak",
      iso: 400,
      type: "Color Negative",
      is_ecn: false,
    });
    expect(getDevelopmentType(film)).toBe("C41");
    expect(getDevelopmentCost(film)).toBe(6);
  });

  it("Kodak Vision3 500T (ECN)", () => {
    const film = createFilm({
      name: "Vision3 500T",
      brand: "Kodak",
      iso: 500,
      type: "Color Negative",
      is_ecn: true,
    });
    expect(getDevelopmentType(film)).toBe("ECN");
    expect(getDevelopmentCost(film)).toBe(9);
  });

  it("Ilford HP5 Plus (B&W)", () => {
    const film = createFilm({
      name: "HP5 Plus",
      brand: "Ilford",
      iso: 400,
      type: "Black & White",
      is_ecn: false,
    });
    expect(getDevelopmentType(film)).toBe("B&W");
    expect(getDevelopmentCost(film)).toBe(0);
  });

  it("Fujifilm Velvia 50 (Slide/E-6)", () => {
    const film = createFilm({
      name: "Velvia 50",
      brand: "Fujifilm",
      iso: 50,
      type: "Slide",
      is_ecn: false,
    });
    expect(getDevelopmentType(film)).toBe("C41");
    expect(getDevelopmentCost(film)).toBe(6);
  });

  it("CineStill 800T (remjet-removed ECN-2 film, processed as C41)", () => {
    // CineStill films have remjet removed, so they're processed as C41, not ECN
    const film = createFilm({
      name: "CineStill 800T",
      brand: "CineStill",
      iso: 800,
      type: "Color Negative",
      is_ecn: false, // CineStill is C41 processable
    });
    expect(getDevelopmentType(film)).toBe("C41");
    expect(getDevelopmentCost(film)).toBe(6);
  });
});
