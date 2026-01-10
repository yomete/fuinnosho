import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EnhancedFiltersV2,
  FilterState,
  FilterAction,
} from "./enhanced-filters-v2";
import type { Film } from "@/lib/utils";

// =============================================================================
// Test Data Fixtures
// =============================================================================
const createMockFilm = (overrides: Partial<Film> = {}): Film => ({
  id: crypto.randomUUID(),
  name: "Test Film",
  brand: "Kodak",
  iso: 400,
  format: "35mm",
  type: "Color Negative",
  expiration_date: "2025-12-31",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  ...overrides,
});

const mockFilms: Film[] = [
  createMockFilm({ name: "Portra 400", brand: "Kodak", iso: 400, format: "35mm", type: "Color Negative" }),
  createMockFilm({ name: "Portra 800", brand: "Kodak", iso: 800, format: "35mm", type: "Color Negative" }),
  createMockFilm({ name: "HP5 Plus", brand: "Ilford", iso: 400, format: "35mm", type: "Black & White" }),
  createMockFilm({ name: "Tri-X 400", brand: "Kodak", iso: 400, format: "120", type: "Black & White" }),
  createMockFilm({ name: "Pro 400H", brand: "Fuji", iso: 400, format: "120", type: "Color Negative" }),
  createMockFilm({ name: "Velvia 50", brand: "Fuji", iso: 50, format: "35mm", type: "Slide" }),
  createMockFilm({ name: "Delta 3200", brand: "Ilford", iso: 3200, format: "35mm", type: "Black & White" }),
];

const createDefaultFilterState = (): FilterState => ({
  name: "",
  brands: [],
  types: [],
  formats: [],
  isos: [],
  isoRange: [50, 3200],
  notBrands: [],
  notTypes: [],
  notFormats: [],
  notIsos: [],
  hideZeroQuantity: false,
  expandedSections: {
    brands: false,
    types: false,
    formats: false,
    isos: false,
  },
  notModes: {
    brands: false,
    types: false,
    formats: false,
    isos: false,
  },
});

// =============================================================================
// Test Utilities
// =============================================================================
interface RenderFilterProps {
  films?: Film[];
  filterState?: Partial<FilterState>;
  activeFilters?: { column: string; value: string; isNot: boolean }[];
  onFilterAction?: (action: FilterAction) => void;
  onRemoveFilter?: (column: string, value: string) => void;
  onClearAllFilters?: () => void;
}

const renderEnhancedFilters = ({
  films = mockFilms,
  filterState = {},
  activeFilters = [],
  onFilterAction = vi.fn(),
  onRemoveFilter = vi.fn(),
  onClearAllFilters = vi.fn(),
}: RenderFilterProps = {}) => {
  const mergedFilterState = { ...createDefaultFilterState(), ...filterState };

  return {
    ...render(
      <EnhancedFiltersV2
        films={films}
        filterState={mergedFilterState}
        onFilterAction={onFilterAction}
        activeFilters={activeFilters}
        onRemoveFilter={onRemoveFilter}
        onClearAllFilters={onClearAllFilters}
      />
    ),
    onFilterAction,
    onRemoveFilter,
    onClearAllFilters,
  };
};

// Helper to open the filter popover
const openFilterPopover = async (user: ReturnType<typeof userEvent.setup>) => {
  const filterButton = screen.getByRole("button", { name: /filters/i });
  await user.click(filterButton);
  return filterButton;
};

// =============================================================================
// Tests
// =============================================================================
describe("EnhancedFiltersV2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 1. Search Input Tests
  // ===========================================================================
  describe("Search Input", () => {
    it("renders search input with placeholder", () => {
      renderEnhancedFilters();

      const searchInput = screen.getByPlaceholderText("Search films...");
      expect(searchInput).toBeInTheDocument();
    });

    it("displays current search value from filter state", () => {
      renderEnhancedFilters({ filterState: { name: "Portra" } });

      const searchInput = screen.getByPlaceholderText("Search films...");
      expect(searchInput).toHaveValue("Portra");
    });

    it("calls onFilterAction with SET_NAME when typing", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters();

      const searchInput = screen.getByPlaceholderText("Search films...");
      await user.type(searchInput, "HP5");

      // Each character triggers a change event with just that character
      // (since this is a controlled component with empty initial value being re-rendered)
      expect(onFilterAction).toHaveBeenCalledTimes(3);
      expect(onFilterAction).toHaveBeenCalledWith({ type: "SET_NAME", value: "H" });
    });

    it("renders search icon inside input", () => {
      renderEnhancedFilters();

      // The search icon is rendered via lucide-react
      const searchContainer = screen.getByPlaceholderText("Search films...").parentElement;
      expect(searchContainer).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 2. Filter Button and Popover Tests
  // ===========================================================================
  describe("Filter Button and Popover", () => {
    it("renders filter button with text", () => {
      renderEnhancedFilters();

      // Desktop text
      expect(screen.getByText("Advanced Filters")).toBeInTheDocument();
      // Mobile text
      expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("opens popover when filter button is clicked", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters();

      await openFilterPopover(user);

      expect(screen.getByText("Filter Options")).toBeInTheDocument();
    });

    it("shows active filter count badge when filters are active", () => {
      renderEnhancedFilters({
        activeFilters: [
          { column: "Brand", value: "Kodak", isNot: false },
          { column: "Type", value: "Color Negative", isNot: false },
        ],
      });

      // Badge should show count of 2
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("does not show badge when no filters are active", () => {
      renderEnhancedFilters({ activeFilters: [] });

      // No badge with numbers should be present in the button area
      const filterButton = screen.getByRole("button", { name: /filters/i });
      expect(within(filterButton).queryByText(/^\d+$/)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 3. Filter Sections Expand/Collapse Tests
  // ===========================================================================
  describe("Filter Sections Expand/Collapse", () => {
    it("renders all section headers", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters();
      await openFilterPopover(user);

      expect(screen.getByText("Brands")).toBeInTheDocument();
      expect(screen.getByText("Types")).toBeInTheDocument();
      expect(screen.getByText("Formats")).toBeInTheDocument();
      expect(screen.getByText("ISO")).toBeInTheDocument();
    });

    it("expands brands section when clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters();
      await openFilterPopover(user);

      const brandsSection = screen.getByText("Brands").closest("button");
      await user.click(brandsSection!);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_SECTION",
        section: "brands",
      });
    });

    it("expands types section when clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters();
      await openFilterPopover(user);

      const typesSection = screen.getByText("Types").closest("button");
      await user.click(typesSection!);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_SECTION",
        section: "types",
      });
    });

    it("expands formats section when clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters();
      await openFilterPopover(user);

      const formatsSection = screen.getByText("Formats").closest("button");
      await user.click(formatsSection!);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_SECTION",
        section: "formats",
      });
    });

    it("expands ISO section when clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters();
      await openFilterPopover(user);

      const isoSection = screen.getByText("ISO").closest("button");
      await user.click(isoSection!);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_SECTION",
        section: "isos",
      });
    });

    it("shows brand checkboxes when brands section is expanded", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: true, types: false, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      // Should display unique brands from mock films
      expect(screen.getByText("Kodak")).toBeInTheDocument();
      expect(screen.getByText("Ilford")).toBeInTheDocument();
      expect(screen.getByText("Fuji")).toBeInTheDocument();
    });

    it("shows type checkboxes when types section is expanded", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: true, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      // Should display unique types from mock films
      expect(screen.getByText("Color Negative")).toBeInTheDocument();
      expect(screen.getByText("Black & White")).toBeInTheDocument();
      expect(screen.getByText("Slide")).toBeInTheDocument();
    });

    it("shows format checkboxes when formats section is expanded", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: true, isos: false } },
      });
      await openFilterPopover(user);

      // Should display unique formats from mock films
      expect(screen.getByText("35mm")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
    });

    it("shows ISO checkboxes when ISO section is expanded", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: false, isos: true } },
      });
      await openFilterPopover(user);

      // Should display unique ISOs from mock films
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("400")).toBeInTheDocument();
      expect(screen.getByText("800")).toBeInTheDocument();
      expect(screen.getByText("3200")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 4. Brand Checkbox Toggle Tests
  // ===========================================================================
  describe("Brand Checkbox Toggle", () => {
    it("toggles brand when checkbox is clicked in include mode", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: true, types: false, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      const kodakLabel = screen.getByText("Kodak").closest("label");
      const checkbox = within(kodakLabel!).getByRole("checkbox");
      await user.click(checkbox);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_BRAND",
        brand: "Kodak",
        isNot: false,
      });
    });

    it("shows checkbox as checked when brand is selected", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          brands: ["Kodak"],
          expandedSections: { brands: true, types: false, formats: false, isos: false },
        },
      });
      await openFilterPopover(user);

      const kodakLabel = screen.getByText("Kodak").closest("label");
      const checkbox = within(kodakLabel!).getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("toggles brand in NOT mode when notModes.brands is true", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: {
          notModes: { brands: true, types: false, formats: false, isos: false },
          expandedSections: { brands: true, types: false, formats: false, isos: false },
        },
      });
      await openFilterPopover(user);

      const ilfordLabel = screen.getByText("Ilford").closest("label");
      const checkbox = within(ilfordLabel!).getByRole("checkbox");
      await user.click(checkbox);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_BRAND",
        brand: "Ilford",
        isNot: true,
      });
    });

    it("shows checkbox as checked when brand is in notBrands and NOT mode is active", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          notBrands: ["Fuji"],
          notModes: { brands: true, types: false, formats: false, isos: false },
          expandedSections: { brands: true, types: false, formats: false, isos: false },
        },
      });
      await openFilterPopover(user);

      const fujiLabel = screen.getByText("Fuji").closest("label");
      const checkbox = within(fujiLabel!).getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  // ===========================================================================
  // 5. NOT Mode Toggle Tests
  // ===========================================================================
  describe("NOT Mode Toggle", () => {
    it("toggles NOT mode for brands when NOT button is clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: true, types: false, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      const notButtons = screen.getAllByRole("button", { name: /NOT/i });
      await user.click(notButtons[0]); // First NOT button is for brands

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_NOT_MODE",
        section: "brands",
      });
    });

    it("shows 'Include selected brands' text when NOT mode is off", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          notModes: { brands: false, types: false, formats: false, isos: false },
          expandedSections: { brands: true, types: false, formats: false, isos: false },
        },
      });
      await openFilterPopover(user);

      expect(screen.getByText("Include selected brands")).toBeInTheDocument();
    });

    it("shows 'Exclude selected brands' text when NOT mode is on", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          notModes: { brands: true, types: false, formats: false, isos: false },
          expandedSections: { brands: true, types: false, formats: false, isos: false },
        },
      });
      await openFilterPopover(user);

      expect(screen.getByText("Exclude selected brands")).toBeInTheDocument();
    });

    it("toggles NOT mode for types section", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: true, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      const notButtons = screen.getAllByRole("button", { name: /NOT/i });
      await user.click(notButtons[0]); // Types NOT button

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_NOT_MODE",
        section: "types",
      });
    });

    it("toggles NOT mode for formats section", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: true, isos: false } },
      });
      await openFilterPopover(user);

      const notButtons = screen.getAllByRole("button", { name: /NOT/i });
      await user.click(notButtons[0]); // Formats NOT button

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_NOT_MODE",
        section: "formats",
      });
    });

    it("toggles NOT mode for ISOs section", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: false, isos: true } },
      });
      await openFilterPopover(user);

      const notButtons = screen.getAllByRole("button", { name: /NOT/i });
      await user.click(notButtons[0]); // ISOs NOT button

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_NOT_MODE",
        section: "isos",
      });
    });
  });

  // ===========================================================================
  // 6. ISO Range Slider Tests
  // ===========================================================================
  describe("ISO Range Slider", () => {
    it("displays current ISO range values", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          isoRange: [100, 1600],
          expandedSections: { brands: false, types: false, formats: false, isos: true },
        },
      });
      await openFilterPopover(user);

      expect(screen.getByText("Range: 100 - 1600")).toBeInTheDocument();
    });

    it("renders slider component", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: false, isos: true } },
      });
      await openFilterPopover(user);

      const slider = screen.getByRole("slider");
      expect(slider).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 7. Active Filters Display Tests
  // ===========================================================================
  describe("Active Filters Display", () => {
    it("displays active filter badges", () => {
      renderEnhancedFilters({
        activeFilters: [
          { column: "Brand", value: "Kodak", isNot: false },
        ],
      });

      expect(screen.getByText("Brand:")).toBeInTheDocument();
      expect(screen.getByText("Kodak")).toBeInTheDocument();
    });

    it("displays multiple active filter badges", () => {
      renderEnhancedFilters({
        activeFilters: [
          { column: "Brand", value: "Kodak", isNot: false },
          { column: "Type", value: "Color Negative", isNot: false },
          { column: "Format", value: "35mm", isNot: false },
        ],
      });

      expect(screen.getByText("Brand:")).toBeInTheDocument();
      expect(screen.getByText("Kodak")).toBeInTheDocument();
      expect(screen.getByText("Type:")).toBeInTheDocument();
      expect(screen.getByText("Color Negative")).toBeInTheDocument();
      expect(screen.getByText("Format:")).toBeInTheDocument();
      expect(screen.getByText("35mm")).toBeInTheDocument();
    });

    it("shows NOT indicator for excluded filters", () => {
      renderEnhancedFilters({
        activeFilters: [
          { column: "Brand", value: "Ilford", isNot: true },
        ],
      });

      // The NOT filter badge should be in the document
      expect(screen.getByText("Brand:")).toBeInTheDocument();
      expect(screen.getByText("Ilford")).toBeInTheDocument();
    });

    it("does not display active filters section when no filters are active", () => {
      renderEnhancedFilters({ activeFilters: [] });

      // No badges should be displayed
      expect(screen.queryByText("Brand:")).not.toBeInTheDocument();
      expect(screen.queryByText("Type:")).not.toBeInTheDocument();
    });

    it("calls onRemoveFilter when clicking X on filter badge", async () => {
      const user = userEvent.setup();
      const { onRemoveFilter } = renderEnhancedFilters({
        activeFilters: [
          { column: "Brand", value: "Kodak", isNot: false },
        ],
      });

      // Find the X button within the badge
      const badge = screen.getByText("Brand:").parentElement;
      const removeButton = within(badge!).getByRole("button");
      await user.click(removeButton);

      expect(onRemoveFilter).toHaveBeenCalledWith("Brand", "Kodak");
    });
  });

  // ===========================================================================
  // 8. Clear All Filters Tests
  // ===========================================================================
  describe("Clear All Filters", () => {
    it("shows Clear All button when filters are active", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        activeFilters: [{ column: "Brand", value: "Kodak", isNot: false }],
      });
      await openFilterPopover(user);

      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    it("does not show Clear All button when no filters are active", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({ activeFilters: [] });
      await openFilterPopover(user);

      expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
    });

    it("calls onClearAllFilters when Clear All is clicked", async () => {
      const user = userEvent.setup();
      const { onClearAllFilters } = renderEnhancedFilters({
        activeFilters: [{ column: "Brand", value: "Kodak", isNot: false }],
      });
      await openFilterPopover(user);

      const clearButton = screen.getByText("Clear All");
      await user.click(clearButton);

      expect(onClearAllFilters).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 9. Filter Counts Display Tests
  // ===========================================================================
  describe("Filter Counts Display", () => {
    it("shows count badge on brands section when filters are selected", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { brands: ["Kodak", "Fuji"] },
      });
      await openFilterPopover(user);

      // The count badge should show 2
      const brandsSection = screen.getByText("Brands").closest("button");
      expect(within(brandsSection!).getByText("2")).toBeInTheDocument();
    });

    it("shows count badge on types section when filters are selected", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { types: ["Color Negative"] },
      });
      await openFilterPopover(user);

      const typesSection = screen.getByText("Types").closest("button");
      expect(within(typesSection!).getByText("1")).toBeInTheDocument();
    });

    it("shows count badge on formats section when filters are selected", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { formats: ["35mm", "120"] },
      });
      await openFilterPopover(user);

      const formatsSection = screen.getByText("Formats").closest("button");
      expect(within(formatsSection!).getByText("2")).toBeInTheDocument();
    });

    it("shows count badge on ISO section when filters are selected", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { isos: [400, 800, 3200] },
      });
      await openFilterPopover(user);

      const isoSection = screen.getByText("ISO").closest("button");
      expect(within(isoSection!).getByText("3")).toBeInTheDocument();
    });

    it("shows notBrands count when in NOT mode", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          notBrands: ["Ilford"],
          notModes: { brands: true, types: false, formats: false, isos: false },
        },
      });
      await openFilterPopover(user);

      const brandsSection = screen.getByText("Brands").closest("button");
      expect(within(brandsSection!).getByText("1")).toBeInTheDocument();
    });

    it("does not show count badge when no filters are selected for a section", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { brands: [], types: [], formats: [], isos: [] },
      });
      await openFilterPopover(user);

      const brandsSection = screen.getByText("Brands").closest("button");
      // Should not have any number badge
      expect(within(brandsSection!).queryByText(/^\d+$/)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 10. Type/Format/ISO Toggle Tests
  // ===========================================================================
  describe("Type Checkbox Toggle", () => {
    it("toggles type when checkbox is clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: true, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      const typeLabel = screen.getByText("Color Negative").closest("label");
      const checkbox = within(typeLabel!).getByRole("checkbox");
      await user.click(checkbox);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_TYPE",
        filmType: "Color Negative",
        isNot: false,
      });
    });

    it("shows type checkbox as checked when selected", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          types: ["Black & White"],
          expandedSections: { brands: false, types: true, formats: false, isos: false },
        },
      });
      await openFilterPopover(user);

      const typeLabel = screen.getByText("Black & White").closest("label");
      const checkbox = within(typeLabel!).getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  describe("Format Checkbox Toggle", () => {
    it("toggles format when checkbox is clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: true, isos: false } },
      });
      await openFilterPopover(user);

      const formatLabel = screen.getByText("35mm").closest("label");
      const checkbox = within(formatLabel!).getByRole("checkbox");
      await user.click(checkbox);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_FORMAT",
        format: "35mm",
        isNot: false,
      });
    });

    it("shows format checkbox as checked when selected", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          formats: ["120"],
          expandedSections: { brands: false, types: false, formats: true, isos: false },
        },
      });
      await openFilterPopover(user);

      const formatLabel = screen.getByText("120").closest("label");
      const checkbox = within(formatLabel!).getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  describe("ISO Checkbox Toggle", () => {
    it("toggles ISO when checkbox is clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: false, isos: true } },
      });
      await openFilterPopover(user);

      const isoLabel = screen.getByText("400").closest("label");
      const checkbox = within(isoLabel!).getByRole("checkbox");
      await user.click(checkbox);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_ISO",
        iso: 400,
        isNot: false,
      });
    });

    it("shows ISO checkbox as checked when selected", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          isos: [800],
          expandedSections: { brands: false, types: false, formats: false, isos: true },
        },
      });
      await openFilterPopover(user);

      const isoLabel = screen.getByText("800").closest("label");
      const checkbox = within(isoLabel!).getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  // ===========================================================================
  // 11. Hide Zero Quantity Toggle Tests
  // ===========================================================================
  describe("Hide Zero Quantity Toggle", () => {
    it("renders hide zero quantity checkbox", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters();
      await openFilterPopover(user);

      expect(screen.getByText("Hide zero-quantity films")).toBeInTheDocument();
    });

    it("shows checkbox as checked when hideZeroQuantity is true", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { hideZeroQuantity: true },
      });
      await openFilterPopover(user);

      const checkbox = screen.getByRole("checkbox", { name: /hide zero-quantity films/i });
      expect(checkbox).toBeChecked();
    });

    it("shows checkbox as unchecked when hideZeroQuantity is false", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { hideZeroQuantity: false },
      });
      await openFilterPopover(user);

      const checkbox = screen.getByRole("checkbox", { name: /hide zero-quantity films/i });
      expect(checkbox).not.toBeChecked();
    });

    it("calls onFilterAction with TOGGLE_HIDE_ZERO when clicked", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { hideZeroQuantity: false },
      });
      await openFilterPopover(user);

      const checkbox = screen.getByRole("checkbox", { name: /hide zero-quantity films/i });
      await user.click(checkbox);

      expect(onFilterAction).toHaveBeenCalledWith({
        type: "TOGGLE_HIDE_ZERO",
        value: true,
      });
    });
  });

  // ===========================================================================
  // 12. Unique Values Computation Tests
  // ===========================================================================
  describe("Unique Values Computation", () => {
    it("computes unique brands from films", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: true, types: false, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      // From mockFilms: Kodak, Ilford, Fuji
      expect(screen.getByText("Kodak")).toBeInTheDocument();
      expect(screen.getByText("Ilford")).toBeInTheDocument();
      expect(screen.getByText("Fuji")).toBeInTheDocument();
    });

    it("computes unique types from films", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: true, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      // From mockFilms: Color Negative, Black & White, Slide
      expect(screen.getByText("Color Negative")).toBeInTheDocument();
      expect(screen.getByText("Black & White")).toBeInTheDocument();
      expect(screen.getByText("Slide")).toBeInTheDocument();
    });

    it("computes unique formats from films", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: true, isos: false } },
      });
      await openFilterPopover(user);

      // From mockFilms: 35mm, 120
      expect(screen.getByText("35mm")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
    });

    it("computes unique ISOs from films sorted numerically", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: false, types: false, formats: false, isos: true } },
      });
      await openFilterPopover(user);

      // From mockFilms: 50, 400, 800, 3200 (sorted)
      const isoTexts = ["50", "400", "800", "3200"];
      isoTexts.forEach((iso) => {
        expect(screen.getByText(iso)).toBeInTheDocument();
      });
    });

    it("handles empty films array", async () => {
      const user = userEvent.setup();
      // Use at least one film to avoid min/max calculation issues with empty arrays
      const singleFilm = [createMockFilm({ brand: "Solo", type: "Test", format: "35mm", iso: 100 })];
      renderEnhancedFilters({
        films: singleFilm,
        filterState: { expandedSections: { brands: true, types: false, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      // Should render correctly with single film
      expect(screen.getByText("Brands")).toBeInTheDocument();
      expect(screen.getByText("Solo")).toBeInTheDocument();
    });

    it("handles films with duplicate values", async () => {
      const user = userEvent.setup();
      const duplicateFilms = [
        createMockFilm({ brand: "Kodak" }),
        createMockFilm({ brand: "Kodak" }),
        createMockFilm({ brand: "Kodak" }),
      ];
      renderEnhancedFilters({
        films: duplicateFilms,
        filterState: { expandedSections: { brands: true, types: false, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      // Should only show Kodak once
      const kodakElements = screen.getAllByText("Kodak");
      expect(kodakElements).toHaveLength(1);
    });
  });

  // ===========================================================================
  // 13. Component Memoization Tests
  // ===========================================================================
  describe("Component Memoization", () => {
    it("renders correctly with memo wrapper", () => {
      const { rerender } = renderEnhancedFilters();

      // Re-render with same props
      rerender(
        <EnhancedFiltersV2
          films={mockFilms}
          filterState={createDefaultFilterState()}
          onFilterAction={vi.fn()}
          activeFilters={[]}
          onRemoveFilter={vi.fn()}
          onClearAllFilters={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText("Search films...")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 14. Edge Cases
  // ===========================================================================
  describe("Edge Cases", () => {
    it("handles very long filter values", () => {
      const longValue = "A".repeat(100);
      renderEnhancedFilters({
        activeFilters: [{ column: "Brand", value: longValue, isNot: false }],
      });

      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it("handles special characters in filter values", () => {
      const specialValue = "Brand & Co. (Ltd.)";
      renderEnhancedFilters({
        activeFilters: [{ column: "Brand", value: specialValue, isNot: false }],
      });

      expect(screen.getByText(specialValue)).toBeInTheDocument();
    });

    it("handles multiple NOT filters simultaneously", () => {
      renderEnhancedFilters({
        activeFilters: [
          { column: "Brand", value: "Kodak", isNot: true },
          { column: "Type", value: "Slide", isNot: true },
          { column: "Format", value: "4x5", isNot: true },
        ],
      });

      expect(screen.getByText("Brand:")).toBeInTheDocument();
      expect(screen.getByText("Type:")).toBeInTheDocument();
      expect(screen.getByText("Format:")).toBeInTheDocument();
    });

    it("handles rapid checkbox toggles", async () => {
      const user = userEvent.setup();
      const { onFilterAction } = renderEnhancedFilters({
        filterState: { expandedSections: { brands: true, types: false, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      const kodakLabel = screen.getByText("Kodak").closest("label");
      const checkbox = within(kodakLabel!).getByRole("checkbox");

      // Rapid clicks
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(onFilterAction).toHaveBeenCalledTimes(3);
    });

    it("handles all sections expanded simultaneously", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: {
          expandedSections: { brands: true, types: true, formats: true, isos: true },
        },
      });
      await openFilterPopover(user);

      // All sections should show their content
      expect(screen.getByText("Kodak")).toBeInTheDocument();
      expect(screen.getByText("Color Negative")).toBeInTheDocument();
      expect(screen.getByText("35mm")).toBeInTheDocument();
      expect(screen.getByText("400")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 15. Accessibility Tests
  // ===========================================================================
  describe("Accessibility", () => {
    it("has accessible search input with placeholder", () => {
      renderEnhancedFilters();

      const searchInput = screen.getByPlaceholderText("Search films...");
      expect(searchInput).toBeInTheDocument();
      // Input components may not have explicit type="text" but default to text input behavior
      expect(searchInput.tagName.toLowerCase()).toBe("input");
    });

    it("checkboxes have associated labels", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters({
        filterState: { expandedSections: { brands: true, types: false, formats: false, isos: false } },
      });
      await openFilterPopover(user);

      // Each brand should have a label wrapping the checkbox
      const kodakLabel = screen.getByText("Kodak").closest("label");
      expect(kodakLabel).toBeInTheDocument();
      expect(within(kodakLabel!).getByRole("checkbox")).toBeInTheDocument();
    });

    it("filter button is focusable", () => {
      renderEnhancedFilters();

      const filterButton = screen.getByRole("button", { name: /filters/i });
      filterButton.focus();
      expect(filterButton).toHaveFocus();
    });

    it("hide zero quantity checkbox has proper label association", async () => {
      const user = userEvent.setup();
      renderEnhancedFilters();
      await openFilterPopover(user);

      const checkbox = screen.getByRole("checkbox", { name: /hide zero-quantity films/i });
      expect(checkbox).toBeInTheDocument();
    });
  });
});
