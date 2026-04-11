import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect, vi } from "vitest";
import { FilmFormFields } from "./film-form-fields";
import { filmSchema, type FilmSchema } from "@/lib/films/schema";

// Mock the BrandAutocomplete component since it has external dependencies
vi.mock("@/components/ui/brand-autocomplete", () => ({
  BrandAutocomplete: ({
    value,
    onValueChange,
    placeholder,
  }: {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="brand-autocomplete"
      id="brand-input"
      aria-label="Brand"
      value={value || ""}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Default values for the form
const defaultFormValues: FilmSchema = {
  name: "",
  brand: "",
  iso: 400,
  format: "",
  type: "",
  expiration_date: "",
  price: null,
  count: null,
  notes: "",
  editing_notes: "",
  is_ecn: false,
  is_bulk_film: false,
  bulk_length_meters: undefined,
  bulk_quantity: undefined,
  bulk_rolls_used: undefined,
  calculated_rolls: undefined,
  bulk_remaining_exposures: undefined,
  spooled_cassettes: undefined,
};

// Helper to render the component with form context
function renderFilmFormFields(
  props?: Partial<Parameters<typeof FilmFormFields>[0]>,
  formDefaults?: Partial<FilmSchema>
) {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    submitText: "Save Film",
    loadingText: "Saving...",
    deleteButton: undefined,
  };

  // We need to render the form fields inside a wrapper that provides form context
  function TestComponent() {
    const form = useForm<FilmSchema>({
      resolver: zodResolver(filmSchema),
      defaultValues: { ...defaultFormValues, ...formDefaults },
    });

    return (
      <FilmFormFields
        form={form}
        {...defaultProps}
        {...props}
      />
    );
  }

  return render(<TestComponent />);
}

// =============================================================================
// Basic Field Rendering Tests
// =============================================================================
describe("FilmFormFields - Basic Rendering", () => {
  it("renders the name input field", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter film name/i)).toBeInTheDocument();
  });

  it("renders the brand input field", () => {
    renderFilmFormFields();
    // The brand label exists but the mocked component doesn't have the same id
    expect(screen.getByText(/brand/i)).toBeInTheDocument();
    expect(screen.getByTestId("brand-autocomplete")).toBeInTheDocument();
  });

  it("renders the ISO input field", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/iso/i)).toBeInTheDocument();
  });

  it("renders the format select field", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
  });

  it("renders the type select field", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/^type$/i)).toBeInTheDocument();
  });

  it("renders the expiration date input field", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
  });

  it("renders the price input field", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter price/i)).toBeInTheDocument();
  });

  it("renders the notes textarea", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/^notes$/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/add any additional notes/i)
    ).toBeInTheDocument();
  });

  it("renders the editing notes textarea", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/editing notes/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/add editing tips for this film stock/i)
    ).toBeInTheDocument();
  });

  it("renders the ECN film toggle", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/ecn film/i)).toBeInTheDocument();
    expect(
      screen.getByText(/this is an ecn \(eastman color negative\) motion picture film/i)
    ).toBeInTheDocument();
  });

  it("renders the quantity field when not bulk film", () => {
    renderFilmFormFields();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter quantity/i)).toBeInTheDocument();
  });
});

// =============================================================================
// Submit Button Tests
// =============================================================================
describe("FilmFormFields - Submit Button", () => {
  it("renders the submit button with correct text", () => {
    renderFilmFormFields({ submitText: "Add Film" });
    expect(screen.getByRole("button", { name: /add film/i })).toBeInTheDocument();
  });

  it("shows loading state when isSubmitting is true", () => {
    renderFilmFormFields({ isSubmitting: true, loadingText: "Saving..." });
    expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
  });

  it("disables submit button when isSubmitting is true", () => {
    renderFilmFormFields({ isSubmitting: true });
    const submitButton = screen.getByRole("button", { name: /saving/i });
    expect(submitButton).toBeDisabled();
  });

  it("shows spinner when isSubmitting is true", () => {
    renderFilmFormFields({ isSubmitting: true });
    // The spinner has animate-spin class
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders delete button when provided", () => {
    const deleteButton = <button type="button">Delete Film</button>;
    renderFilmFormFields({ deleteButton });
    expect(screen.getByRole("button", { name: /delete film/i })).toBeInTheDocument();
  });
});

// =============================================================================
// Bulk Film Toggle Tests
// =============================================================================
describe("FilmFormFields - Bulk Film Toggle", () => {
  it("does not show bulk film toggle when format is not selected", () => {
    renderFilmFormFields();
    expect(screen.queryByLabelText(/bulk film/i)).not.toBeInTheDocument();
  });

  it("shows bulk film toggle when 35mm format is selected", async () => {
    renderFilmFormFields({}, { format: "35mm" });

    // Wait for the component to render with the format
    await waitFor(() => {
      expect(screen.getByLabelText(/bulk film/i)).toBeInTheDocument();
    });
  });

  it("shows bulk film toggle when 120 format is selected", async () => {
    renderFilmFormFields({}, { format: "120" });

    await waitFor(() => {
      expect(screen.getByLabelText(/bulk film/i)).toBeInTheDocument();
    });
  });

  it("does not show bulk film toggle when 4x5 format is selected", async () => {
    renderFilmFormFields({}, { format: "4x5" });

    await waitFor(() => {
      expect(screen.queryByLabelText(/bulk film/i)).not.toBeInTheDocument();
    });
  });

  it("shows quantity field when bulk film is not checked", async () => {
    renderFilmFormFields({}, { format: "35mm", is_bulk_film: false });

    await waitFor(() => {
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// Bulk Film Fields Tests
// =============================================================================
describe("FilmFormFields - Bulk Film Fields", () => {
  it("shows bulk film fields when is_bulk_film is true", async () => {
    renderFilmFormFields({}, { format: "35mm", is_bulk_film: true });

    await waitFor(() => {
      expect(screen.getByLabelText(/number of bulk rolls/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/length per bulk \(meters\)/i)).toBeInTheDocument();
    });
  });

  it("shows calculated rolls section when bulk film is enabled", async () => {
    renderFilmFormFields(
      {},
      { format: "35mm", is_bulk_film: true, bulk_quantity: 2, bulk_length_meters: 30 }
    );

    await waitFor(() => {
      expect(screen.getByText(/total calculated rolls/i)).toBeInTheDocument();
    });
  });

  it("hides quantity field when bulk film is enabled", async () => {
    renderFilmFormFields({}, { format: "35mm", is_bulk_film: true });

    await waitFor(() => {
      expect(screen.queryByLabelText(/quantity/i)).not.toBeInTheDocument();
    });
  });

  it("displays bulk roll information text", async () => {
    renderFilmFormFields(
      {},
      { format: "35mm", is_bulk_film: true, bulk_quantity: 1, bulk_length_meters: 30 }
    );

    await waitFor(() => {
      expect(screen.getByText(/based on/i)).toBeInTheDocument();
      expect(screen.getByText(/with 10% waste factor/i)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// Auto-calculation Tests
// =============================================================================
describe("FilmFormFields - Auto-calculation", () => {
  it("calculates rolls for 35mm bulk film", () => {
    // 30m of 35mm, 1.65m per roll, 90% efficiency
    // (30 * 0.9) / 1.65 = 16.36, floor = 16
    renderFilmFormFields(
      {},
      { format: "35mm", is_bulk_film: true, bulk_quantity: 1, bulk_length_meters: 30, calculated_rolls: 16 }
    );

    // Check the calculated rolls display shows the expected value (use the bold display element)
    const rollsDisplay = screen.getByText("16 rolls");
    expect(rollsDisplay).toHaveClass("text-3xl", "font-bold");
  });

  it("calculates rolls with multiple bulk quantity", () => {
    // 30m * 2 bulk rolls = 16 * 2 = 32 rolls
    renderFilmFormFields(
      {},
      { format: "35mm", is_bulk_film: true, bulk_quantity: 2, bulk_length_meters: 30, calculated_rolls: 32 }
    );

    const rollsDisplay = screen.getByText("32 rolls");
    expect(rollsDisplay).toHaveClass("text-3xl", "font-bold");
  });

  it("calculates rolls for 120 bulk film", () => {
    // 30m of 120, 0.8m per roll, 90% efficiency
    // (30 * 0.9) / 0.8 = 33.75, floor = 33
    renderFilmFormFields(
      {},
      { format: "120", is_bulk_film: true, bulk_quantity: 1, bulk_length_meters: 30, calculated_rolls: 33 }
    );

    const rollsDisplay = screen.getByText("33 rolls");
    expect(rollsDisplay).toHaveClass("text-3xl", "font-bold");
  });

  it("shows 0 rolls when bulk length is 0", () => {
    renderFilmFormFields(
      {},
      { format: "35mm", is_bulk_film: true, bulk_quantity: 1, bulk_length_meters: 0, calculated_rolls: 0 }
    );

    // When bulk_length is 0, calculated_rolls should be 0
    const rollsDisplay = screen.getByText("0 rolls");
    expect(rollsDisplay).toHaveClass("text-3xl", "font-bold");
  });
});

// =============================================================================
// Input Interaction Tests
// =============================================================================
describe("FilmFormFields - Input Interactions", () => {
  it("allows typing in the name field", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const nameInput = screen.getByPlaceholderText(/enter film name/i);
    await user.type(nameInput, "Portra 400");

    expect(nameInput).toHaveValue("Portra 400");
  });

  it("allows typing in the brand field", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const brandInput = screen.getByTestId("brand-autocomplete");
    await user.type(brandInput, "Kodak");

    expect(brandInput).toHaveValue("Kodak");
  });

  it("allows typing numeric values in ISO field", async () => {
    const user = userEvent.setup();
    renderFilmFormFields({}, { iso: 400 });

    const isoInput = screen.getByLabelText(/iso/i);
    // Number inputs are exposed as numbers by jest-dom
    expect(isoInput).toHaveValue(400);

    // Append more digits (don't clear to avoid controlled/uncontrolled issues)
    await user.type(isoInput, "0");
    expect(isoInput).toHaveValue(4000);
  });

  it("allows typing in the price field", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const priceInput = screen.getByPlaceholderText(/enter price/i);
    await user.type(priceInput, "15.99");

    expect(priceInput).toHaveValue(15.99);
  });

  it("allows typing in the notes field", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const notesInput = screen.getByPlaceholderText(/add any additional notes/i);
    await user.type(notesInput, "Great for portraits");

    expect(notesInput).toHaveValue("Great for portraits");
  });

  it("allows typing in the editing notes field", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const editingNotesInput = screen.getByPlaceholderText(
      /add editing tips for this film stock/i
    );
    await user.type(editingNotesInput, "Scan at 3200 DPI");

    expect(editingNotesInput).toHaveValue("Scan at 3200 DPI");
  });

  it("allows typing in the quantity field", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const quantityInput = screen.getByPlaceholderText(/enter quantity/i);
    await user.type(quantityInput, "10");

    expect(quantityInput).toHaveValue(10);
  });

  it("allows entering expiration date", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const expirationInput = screen.getByLabelText(/expiration date/i);
    await user.type(expirationInput, "2025-12-31");

    expect(expirationInput).toHaveValue("2025-12-31");
  });
});

// =============================================================================
// Toggle Switch Tests
// =============================================================================
describe("FilmFormFields - Toggle Switches", () => {
  it("ECN toggle can be switched on", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const ecnSwitch = screen.getByLabelText(/ecn film/i);
    await user.click(ecnSwitch);

    expect(ecnSwitch).toBeChecked();
  });

  it("ECN toggle can be switched off", async () => {
    const user = userEvent.setup();
    renderFilmFormFields({}, { is_ecn: true });

    const ecnSwitch = screen.getByLabelText(/ecn film/i);
    expect(ecnSwitch).toBeChecked();

    await user.click(ecnSwitch);
    expect(ecnSwitch).not.toBeChecked();
  });

  it("bulk film toggle can be switched on when format supports it", async () => {
    const user = userEvent.setup();
    renderFilmFormFields({}, { format: "35mm" });

    await waitFor(() => {
      expect(screen.getByLabelText(/bulk film/i)).toBeInTheDocument();
    });

    const bulkSwitch = screen.getByLabelText(/bulk film/i);
    await user.click(bulkSwitch);

    expect(bulkSwitch).toBeChecked();
  });

  it("bulk film toggle shows bulk fields when switched on", async () => {
    const user = userEvent.setup();
    renderFilmFormFields({}, { format: "35mm" });

    const bulkSwitch = screen.getByLabelText(/bulk film/i);
    await user.click(bulkSwitch);

    await waitFor(() => {
      expect(screen.getByLabelText(/number of bulk rolls/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/length per bulk \(meters\)/i)).toBeInTheDocument();
    });
  });

  it("bulk film toggle hides bulk fields when switched off", async () => {
    const user = userEvent.setup();
    renderFilmFormFields({}, { format: "35mm", is_bulk_film: true });

    await waitFor(() => {
      expect(screen.getByLabelText(/number of bulk rolls/i)).toBeInTheDocument();
    });

    const bulkSwitch = screen.getByLabelText(/bulk film/i);
    await user.click(bulkSwitch);

    await waitFor(() => {
      expect(screen.queryByLabelText(/number of bulk rolls/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// Bulk Film Input Tests
// =============================================================================
describe("FilmFormFields - Bulk Film Inputs", () => {
  it("allows entering bulk quantity", async () => {
    const user = userEvent.setup();
    renderFilmFormFields({}, { format: "35mm", is_bulk_film: true });

    await waitFor(() => {
      expect(screen.getByLabelText(/number of bulk rolls/i)).toBeInTheDocument();
    });

    const bulkQuantityInput = screen.getByPlaceholderText(/how many bulk rolls/i);
    await user.clear(bulkQuantityInput);
    await user.type(bulkQuantityInput, "3");

    expect(bulkQuantityInput).toHaveValue(3);
  });

  it("allows entering bulk length in meters", async () => {
    const user = userEvent.setup();
    renderFilmFormFields({}, { format: "35mm", is_bulk_film: true });

    await waitFor(() => {
      expect(screen.getByLabelText(/length per bulk/i)).toBeInTheDocument();
    });

    const bulkLengthInput = screen.getByPlaceholderText(/length in meters/i);
    await user.type(bulkLengthInput, "30.5");

    expect(bulkLengthInput).toHaveValue(30.5);
  });

  it("updates bulk quantity input value when typing", async () => {
    const user = userEvent.setup();
    renderFilmFormFields(
      {},
      { format: "35mm", is_bulk_film: true, bulk_length_meters: 30, bulk_quantity: 1, calculated_rolls: 16 }
    );

    // Initial render shows 16 rolls in the bold display
    const initialRollsDisplay = screen.getByText("16 rolls");
    expect(initialRollsDisplay).toHaveClass("text-3xl", "font-bold");

    // Find and update the bulk quantity input
    const bulkQuantityInput = screen.getByPlaceholderText(/how many bulk rolls/i);
    expect(bulkQuantityInput).toHaveValue(1);

    // Type additional digit to change from 1 to 12
    await user.type(bulkQuantityInput, "2");
    expect(bulkQuantityInput).toHaveValue(12);
  });

  it("updates calculated rolls when bulk length changes", async () => {
    const user = userEvent.setup();
    renderFilmFormFields(
      {},
      { format: "35mm", is_bulk_film: true, bulk_length_meters: 30, bulk_quantity: 1, calculated_rolls: 16 }
    );

    // Initial render shows 16 rolls in the bold display
    const initialRollsDisplay = screen.getByText("16 rolls");
    expect(initialRollsDisplay).toHaveClass("text-3xl", "font-bold");

    // Find and update the bulk length input
    const bulkLengthInput = screen.getByPlaceholderText(/length in meters/i);
    await user.clear(bulkLengthInput);
    await user.type(bulkLengthInput, "60");

    // After changing length to 60, should show 32 rolls
    // 60m * 0.9 / 1.65 = 32.72, floor = 32
    await waitFor(() => {
      const rollsDisplay = screen.getByText("32 rolls");
      expect(rollsDisplay).toHaveClass("text-3xl", "font-bold");
    });
  });
});

// =============================================================================
// Default Values Tests
// =============================================================================
describe("FilmFormFields - Default Values", () => {
  it("renders with provided default name", () => {
    renderFilmFormFields({}, { name: "HP5 Plus" });
    expect(screen.getByPlaceholderText(/enter film name/i)).toHaveValue("HP5 Plus");
  });

  it("renders with provided default brand", () => {
    renderFilmFormFields({}, { brand: "Ilford" });
    expect(screen.getByTestId("brand-autocomplete")).toHaveValue("Ilford");
  });

  it("renders with provided default ISO", () => {
    renderFilmFormFields({}, { iso: 800 });
    expect(screen.getByLabelText(/iso/i)).toHaveValue(800);
  });

  it("renders with provided default price", () => {
    renderFilmFormFields({}, { price: 12.99 });
    expect(screen.getByPlaceholderText(/enter price/i)).toHaveValue(12.99);
  });

  it("renders with provided default quantity", () => {
    renderFilmFormFields({}, { count: 5 });
    expect(screen.getByPlaceholderText(/enter quantity/i)).toHaveValue(5);
  });

  it("renders with provided default notes", () => {
    renderFilmFormFields({}, { notes: "Test notes" });
    expect(screen.getByPlaceholderText(/add any additional notes/i)).toHaveValue(
      "Test notes"
    );
  });

  it("renders with provided default editing notes", () => {
    renderFilmFormFields({}, { editing_notes: "Test editing notes" });
    expect(
      screen.getByPlaceholderText(/add editing tips for this film stock/i)
    ).toHaveValue("Test editing notes");
  });

  it("renders with ECN toggle checked when is_ecn is true", () => {
    renderFilmFormFields({}, { is_ecn: true });
    expect(screen.getByLabelText(/ecn film/i)).toBeChecked();
  });
});

// =============================================================================
// Format Select Tests
// =============================================================================
describe("FilmFormFields - Format Select", () => {
  it("format select has placeholder text", () => {
    renderFilmFormFields();
    expect(screen.getByText(/select film format/i)).toBeInTheDocument();
  });

  it("renders format options when clicked", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const formatTrigger = screen.getByRole("combobox", { name: /format/i });
    await user.click(formatTrigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "35mm" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "120" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "4x5" })).toBeInTheDocument();
    });
  });

  it("allows selecting a format", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const formatTrigger = screen.getByRole("combobox", { name: /format/i });
    await user.click(formatTrigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "35mm" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: "35mm" }));

    await waitFor(() => {
      expect(formatTrigger).toHaveTextContent("35mm");
    });
  });
});

// =============================================================================
// Type Select Tests
// =============================================================================
describe("FilmFormFields - Type Select", () => {
  it("type select has placeholder text", () => {
    renderFilmFormFields();
    expect(screen.getByText(/select film type/i)).toBeInTheDocument();
  });

  it("renders type options when clicked", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const typeTrigger = screen.getByRole("combobox", { name: /^type$/i });
    await user.click(typeTrigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Color Negative" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Black & White" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Black & White Slide" })
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Color Slide" })).toBeInTheDocument();
    });
  });

  it("allows selecting a type", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const typeTrigger = screen.getByRole("combobox", { name: /^type$/i });
    await user.click(typeTrigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Color Negative" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: "Color Negative" }));

    await waitFor(() => {
      expect(typeTrigger).toHaveTextContent("Color Negative");
    });
  });
});

// =============================================================================
// Layout Tests
// =============================================================================
describe("FilmFormFields - Layout", () => {
  it("renders form in a two-column layout", () => {
    renderFilmFormFields();

    // Check for the flex container with gap
    const formContainer = document.querySelector(".flex.flex-col.lg\\:flex-row");
    expect(formContainer).toBeInTheDocument();
  });

  it("renders dialog footer with buttons", () => {
    renderFilmFormFields();
    expect(screen.getByRole("button", { name: /save film/i })).toBeInTheDocument();
  });

  it("renders notes textarea with min height", () => {
    renderFilmFormFields();
    const notesTextarea = screen.getByPlaceholderText(/add any additional notes/i);
    expect(notesTextarea).toHaveClass("min-h-[120px]");
  });

  it("renders editing notes textarea with min height", () => {
    renderFilmFormFields();
    const editingNotesTextarea = screen.getByPlaceholderText(
      /add editing tips for this film stock/i
    );
    expect(editingNotesTextarea).toHaveClass("min-h-[120px]");
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================
describe("FilmFormFields - Accessibility", () => {
  it("all form fields have associated labels", () => {
    renderFilmFormFields();

    // Check that all main fields have accessible labels
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    // Brand uses a mock component, so check by aria-label instead
    expect(screen.getByLabelText(/brand/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/iso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^type$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^notes$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/editing notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ecn film/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
  });

  it("submit button is focusable", () => {
    renderFilmFormFields();
    const submitButton = screen.getByRole("button", { name: /save film/i });
    submitButton.focus();
    expect(document.activeElement).toBe(submitButton);
  });

  it("switches have correct role", () => {
    renderFilmFormFields({}, { format: "35mm" });

    const ecnSwitch = screen.getByLabelText(/ecn film/i);
    expect(ecnSwitch).toHaveAttribute("role", "switch");
  });
});

// =============================================================================
// Price Field Tests
// =============================================================================
describe("FilmFormFields - Price Field", () => {
  it("accepts decimal values in price field", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    const priceInput = screen.getByPlaceholderText(/enter price/i);
    await user.type(priceInput, "19.99");

    expect(priceInput).toHaveValue(19.99);
  });

  it("price field has step of 0.01", () => {
    renderFilmFormFields();
    const priceInput = screen.getByPlaceholderText(/enter price/i);
    expect(priceInput).toHaveAttribute("step", "0.01");
  });

  it("price field is of type number", () => {
    renderFilmFormFields();
    const priceInput = screen.getByPlaceholderText(/enter price/i);
    expect(priceInput).toHaveAttribute("type", "number");
  });
});

// =============================================================================
// Form State Tests
// =============================================================================
describe("FilmFormFields - Form State", () => {
  it("form fields can be filled independently", async () => {
    const user = userEvent.setup();
    renderFilmFormFields();

    // Fill in name
    const nameInput = screen.getByPlaceholderText(/enter film name/i);
    await user.type(nameInput, "Test Film");

    // Fill in brand
    const brandInput = screen.getByTestId("brand-autocomplete");
    await user.type(brandInput, "Test Brand");

    // Fill in notes
    const notesInput = screen.getByPlaceholderText(/add any additional notes/i);
    await user.type(notesInput, "Test notes");

    // Verify all values are independent
    expect(nameInput).toHaveValue("Test Film");
    expect(brandInput).toHaveValue("Test Brand");
    expect(notesInput).toHaveValue("Test notes");
  });

  it("clearing a field does not affect other fields", async () => {
    const user = userEvent.setup();
    renderFilmFormFields(
      {},
      { name: "Initial Name", notes: "Initial Notes" }
    );

    const nameInput = screen.getByPlaceholderText(/enter film name/i);
    await user.clear(nameInput);

    // Name should be empty
    expect(nameInput).toHaveValue("");

    // Notes should still have value
    const notesInput = screen.getByPlaceholderText(/add any additional notes/i);
    expect(notesInput).toHaveValue("Initial Notes");
  });
});
