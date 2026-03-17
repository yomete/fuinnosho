import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createInitialFilterState, filterReducer } from "./filter-reducer";
import type { FilterState, FilterAction } from "./enhanced-filters-v2";

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(globalThis, "window", {
  value: { localStorage: localStorageMock },
  writable: true,
});

describe("filter-reducer", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createInitialFilterState", () => {
    it("should create initial state with correct default values", () => {
      const uniqueIsos = [100, 200, 400, 800];
      const state = createInitialFilterState(uniqueIsos);

      expect(state.name).toBe("");
      expect(state.brands).toEqual([]);
      expect(state.types).toEqual([]);
      expect(state.formats).toEqual([]);
      expect(state.isos).toEqual([]);
      expect(state.notBrands).toEqual([]);
      expect(state.notTypes).toEqual([]);
      expect(state.notFormats).toEqual([]);
      expect(state.notIsos).toEqual([]);
    });

    it("should calculate isoRange from min and max of uniqueIsos", () => {
      const uniqueIsos = [100, 200, 400, 800, 1600];
      const state = createInitialFilterState(uniqueIsos);

      expect(state.isoRange).toEqual([100, 1600]);
    });

    it("should handle single ISO value in uniqueIsos", () => {
      const uniqueIsos = [400];
      const state = createInitialFilterState(uniqueIsos);

      expect(state.isoRange).toEqual([400, 400]);
    });

    it("should initialize all expandedSections to false", () => {
      const state = createInitialFilterState([100, 200, 400]);

      expect(state.expandedSections).toEqual({
        brands: false,
        types: false,
        formats: false,
        isos: false,
      });
    });

    it("should initialize all notModes to false", () => {
      const state = createInitialFilterState([100, 200, 400]);

      expect(state.notModes).toEqual({
        brands: false,
        types: false,
        formats: false,
        isos: false,
      });
    });

    it("should default hideZeroQuantity to false for SSR-safe initialization", () => {
      localStorageMock.getItem.mockReturnValue("true");
      const state = createInitialFilterState([100, 200, 400]);

      expect(state.hideZeroQuantity).toBe(false);
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });
  });

  describe("filterReducer", () => {
    let initialState: FilterState;

    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
      initialState = createInitialFilterState([100, 200, 400, 800]);
    });

    describe("SET_NAME action", () => {
      it("should update the name field", () => {
        const action: FilterAction = { type: "SET_NAME", value: "Portra" };
        const newState = filterReducer(initialState, action);

        expect(newState.name).toBe("Portra");
      });

      it("should preserve other state properties", () => {
        const stateWithBrands = {
          ...initialState,
          brands: ["Kodak"],
        };
        const action: FilterAction = { type: "SET_NAME", value: "Test" };
        const newState = filterReducer(stateWithBrands, action);

        expect(newState.brands).toEqual(["Kodak"]);
        expect(newState.name).toBe("Test");
      });

      it("should handle empty string", () => {
        const stateWithName = { ...initialState, name: "Portra" };
        const action: FilterAction = { type: "SET_NAME", value: "" };
        const newState = filterReducer(stateWithName, action);

        expect(newState.name).toBe("");
      });
    });

    describe("TOGGLE_BRAND action", () => {
      it("should add brand to brands array when isNot is false", () => {
        const action: FilterAction = {
          type: "TOGGLE_BRAND",
          brand: "Kodak",
          isNot: false,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.brands).toContain("Kodak");
        expect(newState.notBrands).toEqual([]);
      });

      it("should remove brand from brands array when already present and isNot is false", () => {
        const stateWithBrand = { ...initialState, brands: ["Kodak", "Fuji"] };
        const action: FilterAction = {
          type: "TOGGLE_BRAND",
          brand: "Kodak",
          isNot: false,
        };
        const newState = filterReducer(stateWithBrand, action);

        expect(newState.brands).toEqual(["Fuji"]);
      });

      it("should add brand to notBrands array when isNot is true", () => {
        const action: FilterAction = {
          type: "TOGGLE_BRAND",
          brand: "Ilford",
          isNot: true,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.notBrands).toContain("Ilford");
        expect(newState.brands).toEqual([]);
      });

      it("should remove brand from notBrands array when already present and isNot is true", () => {
        const stateWithNotBrand = {
          ...initialState,
          notBrands: ["Ilford", "Cinestill"],
        };
        const action: FilterAction = {
          type: "TOGGLE_BRAND",
          brand: "Ilford",
          isNot: true,
        };
        const newState = filterReducer(stateWithNotBrand, action);

        expect(newState.notBrands).toEqual(["Cinestill"]);
      });
    });

    describe("TOGGLE_TYPE action", () => {
      it("should add type to types array when isNot is false", () => {
        const action: FilterAction = {
          type: "TOGGLE_TYPE",
          filmType: "Color Negative",
          isNot: false,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.types).toContain("Color Negative");
        expect(newState.notTypes).toEqual([]);
      });

      it("should remove type from types array when already present and isNot is false", () => {
        const stateWithType = {
          ...initialState,
          types: ["Color Negative", "Black & White"],
        };
        const action: FilterAction = {
          type: "TOGGLE_TYPE",
          filmType: "Color Negative",
          isNot: false,
        };
        const newState = filterReducer(stateWithType, action);

        expect(newState.types).toEqual(["Black & White"]);
      });

      it("should add type to notTypes array when isNot is true", () => {
        const action: FilterAction = {
          type: "TOGGLE_TYPE",
          filmType: "Slide",
          isNot: true,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.notTypes).toContain("Slide");
        expect(newState.types).toEqual([]);
      });

      it("should remove type from notTypes array when already present and isNot is true", () => {
        const stateWithNotType = {
          ...initialState,
          notTypes: ["Slide", "Instant"],
        };
        const action: FilterAction = {
          type: "TOGGLE_TYPE",
          filmType: "Slide",
          isNot: true,
        };
        const newState = filterReducer(stateWithNotType, action);

        expect(newState.notTypes).toEqual(["Instant"]);
      });
    });

    describe("TOGGLE_FORMAT action", () => {
      it("should add format to formats array when isNot is false", () => {
        const action: FilterAction = {
          type: "TOGGLE_FORMAT",
          format: "35mm",
          isNot: false,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.formats).toContain("35mm");
        expect(newState.notFormats).toEqual([]);
      });

      it("should remove format from formats array when already present and isNot is false", () => {
        const stateWithFormat = {
          ...initialState,
          formats: ["35mm", "120"],
        };
        const action: FilterAction = {
          type: "TOGGLE_FORMAT",
          format: "35mm",
          isNot: false,
        };
        const newState = filterReducer(stateWithFormat, action);

        expect(newState.formats).toEqual(["120"]);
      });

      it("should add format to notFormats array when isNot is true", () => {
        const action: FilterAction = {
          type: "TOGGLE_FORMAT",
          format: "4x5",
          isNot: true,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.notFormats).toContain("4x5");
        expect(newState.formats).toEqual([]);
      });

      it("should remove format from notFormats array when already present and isNot is true", () => {
        const stateWithNotFormat = {
          ...initialState,
          notFormats: ["4x5", "8x10"],
        };
        const action: FilterAction = {
          type: "TOGGLE_FORMAT",
          format: "4x5",
          isNot: true,
        };
        const newState = filterReducer(stateWithNotFormat, action);

        expect(newState.notFormats).toEqual(["8x10"]);
      });
    });

    describe("TOGGLE_ISO action", () => {
      it("should add ISO to isos array when isNot is false", () => {
        const action: FilterAction = {
          type: "TOGGLE_ISO",
          iso: 400,
          isNot: false,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.isos).toContain(400);
        expect(newState.notIsos).toEqual([]);
      });

      it("should remove ISO from isos array when already present and isNot is false", () => {
        const stateWithIso = {
          ...initialState,
          isos: [400, 800],
        };
        const action: FilterAction = {
          type: "TOGGLE_ISO",
          iso: 400,
          isNot: false,
        };
        const newState = filterReducer(stateWithIso, action);

        expect(newState.isos).toEqual([800]);
      });

      it("should add ISO to notIsos array when isNot is true", () => {
        const action: FilterAction = {
          type: "TOGGLE_ISO",
          iso: 3200,
          isNot: true,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.notIsos).toContain(3200);
        expect(newState.isos).toEqual([]);
      });

      it("should remove ISO from notIsos array when already present and isNot is true", () => {
        const stateWithNotIso = {
          ...initialState,
          notIsos: [3200, 6400],
        };
        const action: FilterAction = {
          type: "TOGGLE_ISO",
          iso: 3200,
          isNot: true,
        };
        const newState = filterReducer(stateWithNotIso, action);

        expect(newState.notIsos).toEqual([6400]);
      });
    });

    describe("SET_ISO_RANGE action", () => {
      it("should update the isoRange", () => {
        const action: FilterAction = {
          type: "SET_ISO_RANGE",
          range: [200, 1600],
        };
        const newState = filterReducer(initialState, action);

        expect(newState.isoRange).toEqual([200, 1600]);
      });

      it("should handle same min and max values", () => {
        const action: FilterAction = {
          type: "SET_ISO_RANGE",
          range: [400, 400],
        };
        const newState = filterReducer(initialState, action);

        expect(newState.isoRange).toEqual([400, 400]);
      });

      it("should preserve other state properties", () => {
        const stateWithFilters = {
          ...initialState,
          brands: ["Kodak"],
          types: ["Color Negative"],
        };
        const action: FilterAction = {
          type: "SET_ISO_RANGE",
          range: [100, 800],
        };
        const newState = filterReducer(stateWithFilters, action);

        expect(newState.brands).toEqual(["Kodak"]);
        expect(newState.types).toEqual(["Color Negative"]);
      });
    });

    describe("TOGGLE_HIDE_ZERO action", () => {
      it("should set hideZeroQuantity to true", () => {
        const action: FilterAction = { type: "TOGGLE_HIDE_ZERO", value: true };
        const newState = filterReducer(initialState, action);

        expect(newState.hideZeroQuantity).toBe(true);
      });

      it("should set hideZeroQuantity to false", () => {
        const stateWithHideZero = { ...initialState, hideZeroQuantity: true };
        const action: FilterAction = { type: "TOGGLE_HIDE_ZERO", value: false };
        const newState = filterReducer(stateWithHideZero, action);

        expect(newState.hideZeroQuantity).toBe(false);
      });

      it("should persist value to localStorage when true", () => {
        const action: FilterAction = { type: "TOGGLE_HIDE_ZERO", value: true };
        filterReducer(initialState, action);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "hideZeroQuantityFilms",
          "true"
        );
      });

      it("should persist value to localStorage when false", () => {
        const action: FilterAction = { type: "TOGGLE_HIDE_ZERO", value: false };
        filterReducer(initialState, action);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "hideZeroQuantityFilms",
          "false"
        );
      });
    });

    describe("TOGGLE_SECTION action", () => {
      it("should toggle brands section from false to true", () => {
        const action: FilterAction = {
          type: "TOGGLE_SECTION",
          section: "brands",
        };
        const newState = filterReducer(initialState, action);

        expect(newState.expandedSections.brands).toBe(true);
      });

      it("should toggle brands section from true to false", () => {
        const stateWithExpandedBrands = {
          ...initialState,
          expandedSections: { ...initialState.expandedSections, brands: true },
        };
        const action: FilterAction = {
          type: "TOGGLE_SECTION",
          section: "brands",
        };
        const newState = filterReducer(stateWithExpandedBrands, action);

        expect(newState.expandedSections.brands).toBe(false);
      });

      it("should toggle types section", () => {
        const action: FilterAction = {
          type: "TOGGLE_SECTION",
          section: "types",
        };
        const newState = filterReducer(initialState, action);

        expect(newState.expandedSections.types).toBe(true);
      });

      it("should toggle formats section", () => {
        const action: FilterAction = {
          type: "TOGGLE_SECTION",
          section: "formats",
        };
        const newState = filterReducer(initialState, action);

        expect(newState.expandedSections.formats).toBe(true);
      });

      it("should toggle isos section", () => {
        const action: FilterAction = {
          type: "TOGGLE_SECTION",
          section: "isos",
        };
        const newState = filterReducer(initialState, action);

        expect(newState.expandedSections.isos).toBe(true);
      });

      it("should not affect other sections", () => {
        const stateWithMultipleExpanded = {
          ...initialState,
          expandedSections: {
            brands: true,
            types: true,
            formats: false,
            isos: false,
          },
        };
        const action: FilterAction = {
          type: "TOGGLE_SECTION",
          section: "formats",
        };
        const newState = filterReducer(stateWithMultipleExpanded, action);

        expect(newState.expandedSections.brands).toBe(true);
        expect(newState.expandedSections.types).toBe(true);
        expect(newState.expandedSections.formats).toBe(true);
        expect(newState.expandedSections.isos).toBe(false);
      });
    });

    describe("TOGGLE_NOT_MODE action", () => {
      it("should toggle brands notMode from false to true", () => {
        const action: FilterAction = {
          type: "TOGGLE_NOT_MODE",
          section: "brands",
        };
        const newState = filterReducer(initialState, action);

        expect(newState.notModes.brands).toBe(true);
      });

      it("should toggle brands notMode from true to false", () => {
        const stateWithNotMode = {
          ...initialState,
          notModes: { ...initialState.notModes, brands: true },
        };
        const action: FilterAction = {
          type: "TOGGLE_NOT_MODE",
          section: "brands",
        };
        const newState = filterReducer(stateWithNotMode, action);

        expect(newState.notModes.brands).toBe(false);
      });

      it("should clear brands and notBrands when toggling brands NOT mode", () => {
        const stateWithSelections = {
          ...initialState,
          brands: ["Kodak", "Fuji"],
          notBrands: ["Ilford"],
        };
        const action: FilterAction = {
          type: "TOGGLE_NOT_MODE",
          section: "brands",
        };
        const newState = filterReducer(stateWithSelections, action);

        expect(newState.brands).toEqual([]);
        expect(newState.notBrands).toEqual([]);
      });

      it("should clear types and notTypes when toggling types NOT mode", () => {
        const stateWithSelections = {
          ...initialState,
          types: ["Color Negative"],
          notTypes: ["Slide"],
        };
        const action: FilterAction = {
          type: "TOGGLE_NOT_MODE",
          section: "types",
        };
        const newState = filterReducer(stateWithSelections, action);

        expect(newState.types).toEqual([]);
        expect(newState.notTypes).toEqual([]);
      });

      it("should clear formats and notFormats when toggling formats NOT mode", () => {
        const stateWithSelections = {
          ...initialState,
          formats: ["35mm"],
          notFormats: ["120"],
        };
        const action: FilterAction = {
          type: "TOGGLE_NOT_MODE",
          section: "formats",
        };
        const newState = filterReducer(stateWithSelections, action);

        expect(newState.formats).toEqual([]);
        expect(newState.notFormats).toEqual([]);
      });

      it("should clear isos and notIsos when toggling isos NOT mode", () => {
        const stateWithSelections = {
          ...initialState,
          isos: [400, 800],
          notIsos: [3200],
        };
        const action: FilterAction = {
          type: "TOGGLE_NOT_MODE",
          section: "isos",
        };
        const newState = filterReducer(stateWithSelections, action);

        expect(newState.isos).toEqual([]);
        expect(newState.notIsos).toEqual([]);
      });

      it("should not affect other section selections when toggling one NOT mode", () => {
        const stateWithSelections = {
          ...initialState,
          brands: ["Kodak"],
          types: ["Color Negative"],
          formats: ["35mm"],
          isos: [400],
        };
        const action: FilterAction = {
          type: "TOGGLE_NOT_MODE",
          section: "brands",
        };
        const newState = filterReducer(stateWithSelections, action);

        expect(newState.brands).toEqual([]);
        expect(newState.types).toEqual(["Color Negative"]);
        expect(newState.formats).toEqual(["35mm"]);
        expect(newState.isos).toEqual([400]);
      });
    });

    describe("CLEAR_ALL action", () => {
      it("should reset name to empty string", () => {
        const stateWithName = { ...initialState, name: "Portra" };
        const action: FilterAction = { type: "CLEAR_ALL" };
        const newState = filterReducer(stateWithName, action);

        expect(newState.name).toBe("");
      });

      it("should clear all filter arrays", () => {
        const stateWithFilters = {
          ...initialState,
          brands: ["Kodak", "Fuji"],
          types: ["Color Negative"],
          formats: ["35mm", "120"],
          isos: [400, 800],
          notBrands: ["Ilford"],
          notTypes: ["Slide"],
          notFormats: ["4x5"],
          notIsos: [3200],
        };
        const action: FilterAction = { type: "CLEAR_ALL" };
        const newState = filterReducer(stateWithFilters, action);

        expect(newState.brands).toEqual([]);
        expect(newState.types).toEqual([]);
        expect(newState.formats).toEqual([]);
        expect(newState.isos).toEqual([]);
        expect(newState.notBrands).toEqual([]);
        expect(newState.notTypes).toEqual([]);
        expect(newState.notFormats).toEqual([]);
        expect(newState.notIsos).toEqual([]);
      });

      it("should reset isoRange to default values", () => {
        const stateWithIsoRange = {
          ...initialState,
          isoRange: [200, 1600] as [number, number],
        };
        const action: FilterAction = { type: "CLEAR_ALL" };
        const newState = filterReducer(stateWithIsoRange, action);

        // CLEAR_ALL uses a hardcoded default: [50, 3200]
        expect(newState.isoRange).toEqual([50, 3200]);
      });

      it("should reset hideZeroQuantity to false", () => {
        const stateWithHideZero = { ...initialState, hideZeroQuantity: true };
        const action: FilterAction = { type: "CLEAR_ALL" };
        const newState = filterReducer(stateWithHideZero, action);

        expect(newState.hideZeroQuantity).toBe(false);
      });

      it("should persist hideZeroQuantity false to localStorage", () => {
        const action: FilterAction = { type: "CLEAR_ALL" };
        filterReducer(initialState, action);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "hideZeroQuantityFilms",
          "false"
        );
      });

      it("should reset all notModes to false", () => {
        const stateWithNotModes = {
          ...initialState,
          notModes: {
            brands: true,
            types: true,
            formats: true,
            isos: true,
          },
        };
        const action: FilterAction = { type: "CLEAR_ALL" };
        const newState = filterReducer(stateWithNotModes, action);

        expect(newState.notModes).toEqual({
          brands: false,
          types: false,
          formats: false,
          isos: false,
        });
      });

      it("should preserve expandedSections", () => {
        const stateWithExpanded = {
          ...initialState,
          expandedSections: {
            brands: true,
            types: true,
            formats: false,
            isos: true,
          },
        };
        const action: FilterAction = { type: "CLEAR_ALL" };
        const newState = filterReducer(stateWithExpanded, action);

        expect(newState.expandedSections).toEqual({
          brands: true,
          types: true,
          formats: false,
          isos: true,
        });
      });
    });

    describe("unknown action", () => {
      it("should return the current state for unknown actions", () => {
        const unknownAction = { type: "UNKNOWN_ACTION" } as unknown as FilterAction;
        const newState = filterReducer(initialState, unknownAction);

        expect(newState).toBe(initialState);
      });
    });

    describe("state immutability", () => {
      it("should not mutate the original state on SET_NAME", () => {
        const originalState = { ...initialState };
        const action: FilterAction = { type: "SET_NAME", value: "Test" };
        filterReducer(initialState, action);

        expect(initialState).toEqual(originalState);
      });

      it("should not mutate the original state on TOGGLE_BRAND", () => {
        const originalBrands = [...initialState.brands];
        const action: FilterAction = {
          type: "TOGGLE_BRAND",
          brand: "Kodak",
          isNot: false,
        };
        filterReducer(initialState, action);

        expect(initialState.brands).toEqual(originalBrands);
      });

      it("should not mutate the original state on TOGGLE_TYPE", () => {
        const originalTypes = [...initialState.types];
        const action: FilterAction = {
          type: "TOGGLE_TYPE",
          filmType: "Color Negative",
          isNot: false,
        };
        filterReducer(initialState, action);

        expect(initialState.types).toEqual(originalTypes);
      });

      it("should not mutate the original state on TOGGLE_FORMAT", () => {
        const originalFormats = [...initialState.formats];
        const action: FilterAction = {
          type: "TOGGLE_FORMAT",
          format: "35mm",
          isNot: false,
        };
        filterReducer(initialState, action);

        expect(initialState.formats).toEqual(originalFormats);
      });

      it("should not mutate the original state on TOGGLE_ISO", () => {
        const originalIsos = [...initialState.isos];
        const action: FilterAction = {
          type: "TOGGLE_ISO",
          iso: 400,
          isNot: false,
        };
        filterReducer(initialState, action);

        expect(initialState.isos).toEqual(originalIsos);
      });

      it("should not mutate the original state on SET_ISO_RANGE", () => {
        const originalIsoRange = [...initialState.isoRange];
        const action: FilterAction = {
          type: "SET_ISO_RANGE",
          range: [200, 1600],
        };
        filterReducer(initialState, action);

        expect(initialState.isoRange).toEqual(originalIsoRange);
      });

      it("should not mutate the original state on TOGGLE_SECTION", () => {
        const originalExpandedSections = { ...initialState.expandedSections };
        const action: FilterAction = {
          type: "TOGGLE_SECTION",
          section: "brands",
        };
        filterReducer(initialState, action);

        expect(initialState.expandedSections).toEqual(originalExpandedSections);
      });

      it("should not mutate the original state on TOGGLE_NOT_MODE", () => {
        const originalNotModes = { ...initialState.notModes };
        const action: FilterAction = {
          type: "TOGGLE_NOT_MODE",
          section: "brands",
        };
        filterReducer(initialState, action);

        expect(initialState.notModes).toEqual(originalNotModes);
      });

      it("should not mutate the original state on CLEAR_ALL", () => {
        const stateWithFilters = {
          ...initialState,
          brands: ["Kodak"],
          name: "Test",
        };
        const originalState = { ...stateWithFilters };
        const action: FilterAction = { type: "CLEAR_ALL" };
        filterReducer(stateWithFilters, action);

        expect(stateWithFilters.brands).toEqual(originalState.brands);
        expect(stateWithFilters.name).toEqual(originalState.name);
      });

      it("should return a new state object reference", () => {
        const action: FilterAction = { type: "SET_NAME", value: "Test" };
        const newState = filterReducer(initialState, action);

        expect(newState).not.toBe(initialState);
      });
    });

    describe("NOT mode toggle behavior (exclude vs include)", () => {
      it("should support adding items in include mode then switching to exclude", () => {
        // Add brands in include mode
        let state = filterReducer(initialState, {
          type: "TOGGLE_BRAND",
          brand: "Kodak",
          isNot: false,
        });
        state = filterReducer(state, {
          type: "TOGGLE_BRAND",
          brand: "Fuji",
          isNot: false,
        });

        expect(state.brands).toEqual(["Kodak", "Fuji"]);
        expect(state.notBrands).toEqual([]);

        // Toggle NOT mode - should clear selections
        state = filterReducer(state, {
          type: "TOGGLE_NOT_MODE",
          section: "brands",
        });

        expect(state.notModes.brands).toBe(true);
        expect(state.brands).toEqual([]);
        expect(state.notBrands).toEqual([]);

        // Add brands in exclude mode
        state = filterReducer(state, {
          type: "TOGGLE_BRAND",
          brand: "Ilford",
          isNot: true,
        });

        expect(state.notBrands).toEqual(["Ilford"]);
        expect(state.brands).toEqual([]);
      });

      it("should handle switching from exclude mode back to include mode", () => {
        // Start with NOT mode enabled
        let state = {
          ...initialState,
          notModes: { ...initialState.notModes, types: true },
        };

        // Add types in exclude mode
        state = filterReducer(state, {
          type: "TOGGLE_TYPE",
          filmType: "Slide",
          isNot: true,
        });

        expect(state.notTypes).toEqual(["Slide"]);

        // Toggle back to include mode
        state = filterReducer(state, {
          type: "TOGGLE_NOT_MODE",
          section: "types",
        });

        expect(state.notModes.types).toBe(false);
        expect(state.types).toEqual([]);
        expect(state.notTypes).toEqual([]);
      });

      it("should allow independent NOT mode for each section", () => {
        let state = initialState;

        // Enable NOT mode for brands only
        state = filterReducer(state, {
          type: "TOGGLE_NOT_MODE",
          section: "brands",
        });

        expect(state.notModes.brands).toBe(true);
        expect(state.notModes.types).toBe(false);
        expect(state.notModes.formats).toBe(false);
        expect(state.notModes.isos).toBe(false);

        // Enable NOT mode for isos
        state = filterReducer(state, {
          type: "TOGGLE_NOT_MODE",
          section: "isos",
        });

        expect(state.notModes.brands).toBe(true);
        expect(state.notModes.isos).toBe(true);
        expect(state.notModes.types).toBe(false);
        expect(state.notModes.formats).toBe(false);
      });

      it("should correctly toggle items based on isNot flag regardless of notMode", () => {
        // Even if notMode is false, isNot: true should add to notBrands
        const action: FilterAction = {
          type: "TOGGLE_BRAND",
          brand: "TestBrand",
          isNot: true,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.notBrands).toContain("TestBrand");
        expect(newState.brands).not.toContain("TestBrand");
      });
    });

    describe("edge cases", () => {
      it("should handle toggling the same item multiple times", () => {
        let state = initialState;

        // Add and remove multiple times
        state = filterReducer(state, {
          type: "TOGGLE_BRAND",
          brand: "Kodak",
          isNot: false,
        });
        expect(state.brands).toContain("Kodak");

        state = filterReducer(state, {
          type: "TOGGLE_BRAND",
          brand: "Kodak",
          isNot: false,
        });
        expect(state.brands).not.toContain("Kodak");

        state = filterReducer(state, {
          type: "TOGGLE_BRAND",
          brand: "Kodak",
          isNot: false,
        });
        expect(state.brands).toContain("Kodak");
      });

      it("should handle empty arrays correctly", () => {
        const action: FilterAction = {
          type: "TOGGLE_BRAND",
          brand: "NewBrand",
          isNot: false,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.brands).toHaveLength(1);
        expect(newState.brands[0]).toBe("NewBrand");
      });

      it("should handle multiple filter types simultaneously", () => {
        let state = initialState;

        state = filterReducer(state, {
          type: "TOGGLE_BRAND",
          brand: "Kodak",
          isNot: false,
        });
        state = filterReducer(state, {
          type: "TOGGLE_TYPE",
          filmType: "Color Negative",
          isNot: false,
        });
        state = filterReducer(state, {
          type: "TOGGLE_FORMAT",
          format: "35mm",
          isNot: false,
        });
        state = filterReducer(state, {
          type: "TOGGLE_ISO",
          iso: 400,
          isNot: false,
        });
        state = filterReducer(state, { type: "SET_NAME", value: "Portra" });

        expect(state.brands).toEqual(["Kodak"]);
        expect(state.types).toEqual(["Color Negative"]);
        expect(state.formats).toEqual(["35mm"]);
        expect(state.isos).toEqual([400]);
        expect(state.name).toBe("Portra");
      });

      it("should handle extreme ISO values", () => {
        const action: FilterAction = {
          type: "TOGGLE_ISO",
          iso: 102400,
          isNot: false,
        };
        const newState = filterReducer(initialState, action);

        expect(newState.isos).toContain(102400);
      });

      it("should handle special characters in brand/type/format names", () => {
        let state = initialState;

        state = filterReducer(state, {
          type: "TOGGLE_BRAND",
          brand: "Kodak (Pro)",
          isNot: false,
        });
        state = filterReducer(state, {
          type: "TOGGLE_TYPE",
          filmType: "Black & White",
          isNot: false,
        });
        state = filterReducer(state, {
          type: "TOGGLE_FORMAT",
          format: "6x6 (Medium Format)",
          isNot: false,
        });

        expect(state.brands).toContain("Kodak (Pro)");
        expect(state.types).toContain("Black & White");
        expect(state.formats).toContain("6x6 (Medium Format)");
      });
    });
  });
});
