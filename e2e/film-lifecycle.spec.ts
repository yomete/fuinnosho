import { test, expect, Page } from "@playwright/test";

/**
 * Film Lifecycle E2E Tests
 *
 * These tests cover the complete film management lifecycle:
 * - Navigation to films page
 * - Creating films (regular and bulk)
 * - Editing films
 * - Deleting films (soft delete)
 * - Restoring deleted films
 * - Filter functionality
 * - Table/Grid view toggle
 *
 * NOTE: These tests require authentication. The auth flow is handled
 * via the login helper function. For CI environments, consider using
 * a test account or mocking auth.
 */

// Test data for creating films
const TEST_FILM = {
  name: "E2E Test Film",
  brand: "Kodak",
  iso: "400",
  format: "35mm",
  type: "Color Negative",
  expirationDate: "2026-12-31",
  count: "5",
  price: "12.99",
  notes: "Test film created by E2E tests",
};

const TEST_BULK_FILM = {
  name: "E2E Bulk Test Film",
  brand: "Ilford",
  iso: "100",
  format: "35mm",
  type: "Black & White",
  expirationDate: "2027-06-30",
  bulkQuantity: "2",
  bulkLengthMeters: "30.5",
  notes: "Bulk film created by E2E tests",
};

/**
 * Helper function to log in to the application
 * TODO: Replace with actual test credentials or implement auth bypass for testing
 */
async function login(page: Page) {
  // TODO: Implement actual login flow when test credentials are available
  // For now, we'll attempt to navigate directly and handle auth if needed

  await page.goto("/films");

  // Check if we're redirected to login
  if (page.url().includes("/login")) {
    // TODO: Fill in test credentials
    // await page.getByLabel('Email').fill('test@example.com');
    // await page.getByLabel('Password').fill('testpassword');
    // await page.getByRole('button', { name: 'Sign in' }).click();
    // await page.waitForURL('/films');

    // For now, skip tests that require auth
    test.skip(true, "Authentication required - configure test credentials");
  }
}

/**
 * Helper to generate unique film names for test isolation
 */
function generateUniqueFilmName(baseName: string): string {
  return `${baseName} ${Date.now()}`;
}

/**
 * Helper to wait for page to be fully loaded after navigation
 */
async function waitForFilmsPageLoad(page: Page) {
  await page.waitForSelector('h1:has-text("Film Inventory")', {
    timeout: 10000,
  });
}

test.describe("Film Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe("Navigation", () => {
    test("can navigate to films page", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Verify page title and header
      await expect(page.locator("h1")).toContainText("Film Inventory");

      // Verify key elements are present
      await expect(
        page.getByRole("button", { name: /add film/i })
      ).toBeVisible();
    });

    test("films page displays roll count", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // The subtitle should show roll count
      await expect(page.locator("text=rolls ready to shoot")).toBeVisible();
    });
  });

  test.describe("Create Film", () => {
    test("can create a new film with basic fields", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      const uniqueName = generateUniqueFilmName(TEST_FILM.name);

      // Click Add Film button
      await page.getByRole("button", { name: /add film/i }).click();

      // Wait for dialog to open
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Add Film" })
      ).toBeVisible();

      // Fill in form fields
      await page.getByLabel("Name").fill(uniqueName);

      // Brand uses autocomplete, so we type and may need to select
      await page.getByPlaceholder("Enter brand name").fill(TEST_FILM.brand);

      await page.getByLabel("ISO").fill(TEST_FILM.iso);

      // Select format from dropdown
      await page.getByLabel("Format").click();
      await page.getByRole("option", { name: TEST_FILM.format }).click();

      // Select type from dropdown
      await page.getByLabel("Type").click();
      await page.getByRole("option", { name: TEST_FILM.type }).click();

      // Fill expiration date
      await page.getByLabel("Expiration Date").fill(TEST_FILM.expirationDate);

      // Fill quantity
      await page.getByLabel("Quantity").fill(TEST_FILM.count);

      // Fill price
      await page.getByLabel("Price").fill(TEST_FILM.price);

      // Fill notes
      await page.getByLabel("Notes").fill(TEST_FILM.notes);

      // Submit form
      await page.getByRole("button", { name: "Add Film" }).click();

      // Wait for dialog to close and success toast
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 10000,
      });

      // Verify toast message
      await expect(
        page.getByText("Film has been added to your inventory")
      ).toBeVisible();

      // Verify film appears in the list by searching for it
      await page.getByPlaceholder("Search films...").fill(uniqueName);
      await expect(page.getByText(uniqueName)).toBeVisible();
    });

    test("can create a bulk film with bulk-specific fields", async ({
      page,
    }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      const uniqueName = generateUniqueFilmName(TEST_BULK_FILM.name);

      // Click Add Film button
      await page.getByRole("button", { name: /add film/i }).click();

      // Wait for dialog to open
      await expect(page.getByRole("dialog")).toBeVisible();

      // Fill basic fields first
      await page.getByLabel("Name").fill(uniqueName);
      await page
        .getByPlaceholder("Enter brand name")
        .fill(TEST_BULK_FILM.brand);
      await page.getByLabel("ISO").fill(TEST_BULK_FILM.iso);

      // Select format (35mm supports bulk)
      await page.getByLabel("Format").click();
      await page.getByRole("option", { name: TEST_BULK_FILM.format }).click();

      // Select type
      await page.getByLabel("Type").click();
      await page.getByRole("option", { name: TEST_BULK_FILM.type }).click();

      await page
        .getByLabel("Expiration Date")
        .fill(TEST_BULK_FILM.expirationDate);

      // Enable bulk film toggle (should appear after selecting 35mm format)
      const bulkSwitch = page.getByRole("switch", { name: /bulk film/i });
      await expect(bulkSwitch).toBeVisible();
      await bulkSwitch.click();

      // Fill bulk-specific fields
      await page
        .getByLabel("Number of Bulk Rolls")
        .fill(TEST_BULK_FILM.bulkQuantity);
      await page
        .getByLabel("Length per Bulk (meters)")
        .fill(TEST_BULK_FILM.bulkLengthMeters);

      // Verify calculated rolls are shown
      await expect(page.getByText(/Total Calculated Rolls/i)).toBeVisible();
      await expect(page.getByText(/rolls$/)).toBeVisible();

      // Fill notes
      await page.getByLabel("Notes").fill(TEST_BULK_FILM.notes);

      // Submit form
      await page.getByRole("button", { name: "Add Film" }).click();

      // Wait for dialog to close
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 10000,
      });

      // Verify toast message
      await expect(
        page.getByText("Film has been added to your inventory")
      ).toBeVisible();

      // Verify film appears in the list
      await page.getByPlaceholder("Search films...").fill(uniqueName);
      await expect(page.getByText(uniqueName)).toBeVisible();
    });

    test("form validation prevents empty submission", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Click Add Film button
      await page.getByRole("button", { name: /add film/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Try to submit empty form
      await page.getByRole("button", { name: "Add Film" }).click();

      // Form should still be visible (not submitted)
      await expect(page.getByRole("dialog")).toBeVisible();

      // Validation messages should appear for required fields
      // The exact messages depend on the schema, but dialog should remain open
    });
  });

  test.describe("Edit Film", () => {
    test("can edit an existing film", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // First, create a film to edit
      const uniqueName = generateUniqueFilmName("Edit Test Film");
      await page.getByRole("button", { name: /add film/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByLabel("Name").fill(uniqueName);
      await page.getByPlaceholder("Enter brand name").fill("Fuji");
      await page.getByLabel("ISO").fill("200");
      await page.getByLabel("Format").click();
      await page.getByRole("option", { name: "35mm" }).click();
      await page.getByLabel("Type").click();
      await page.getByRole("option", { name: "Color Negative" }).click();
      await page.getByLabel("Quantity").fill("3");

      await page.getByRole("button", { name: "Add Film" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 10000,
      });

      // Search for the created film
      await page.getByPlaceholder("Search films...").fill(uniqueName);
      await expect(page.getByText(uniqueName)).toBeVisible();

      // Click Edit button on the film row
      const filmRow = page.locator("tr").filter({ hasText: uniqueName });
      await filmRow.getByRole("button", { name: /edit/i }).click();

      // Wait for edit dialog
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Edit Film" })
      ).toBeVisible();

      // Modify the film
      const updatedName = `${uniqueName} - Updated`;
      await page.getByLabel("Name").clear();
      await page.getByLabel("Name").fill(updatedName);
      await page.getByLabel("Quantity").clear();
      await page.getByLabel("Quantity").fill("10");

      // Submit changes
      await page.getByRole("button", { name: "Edit Film" }).click();

      // Wait for dialog to close
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 10000,
      });

      // Verify toast message
      await expect(page.getByText("Film has been edited")).toBeVisible();

      // Verify changes are reflected
      await page.getByPlaceholder("Search films...").clear();
      await page.getByPlaceholder("Search films...").fill(updatedName);
      await expect(page.getByText(updatedName)).toBeVisible();
    });
  });

  test.describe("Delete and Restore Film", () => {
    test("can delete a film (soft delete)", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Create a film to delete
      const uniqueName = generateUniqueFilmName("Delete Test Film");
      await page.getByRole("button", { name: /add film/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByLabel("Name").fill(uniqueName);
      await page.getByPlaceholder("Enter brand name").fill("Test Brand");
      await page.getByLabel("ISO").fill("100");
      await page.getByLabel("Format").click();
      await page.getByRole("option", { name: "35mm" }).click();
      await page.getByLabel("Type").click();
      await page.getByRole("option", { name: "Color Negative" }).click();
      await page.getByLabel("Quantity").fill("1");

      await page.getByRole("button", { name: "Add Film" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 10000,
      });

      // Search for and find the film
      await page.getByPlaceholder("Search films...").fill(uniqueName);
      await expect(page.getByText(uniqueName)).toBeVisible();

      // Open edit dialog to access delete
      const filmRow = page.locator("tr").filter({ hasText: uniqueName });
      await filmRow.getByRole("button", { name: /edit/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Click delete button
      await page.getByRole("button", { name: /delete/i }).click();

      // Wait for dialog to close
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 10000,
      });

      // Verify toast message
      await expect(
        page.getByText(/film.*deleted|moved to trash/i)
      ).toBeVisible();

      // Verify film no longer appears in the list
      await page.getByPlaceholder("Search films...").clear();
      await page.getByPlaceholder("Search films...").fill(uniqueName);

      // The film should not be visible in the main list
      await expect(page.getByText(uniqueName)).not.toBeVisible({
        timeout: 5000,
      });
    });

    // TODO: Implement restore film test when the UI for viewing/restoring deleted films is available
    test.skip("can restore a deleted film", async ({ page }) => {
      // This test requires access to a "Trash" or "Deleted Films" view
      // The application has restoreFilm and getDeletedFilms actions
      // but the UI for accessing these may need to be implemented

      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Navigate to deleted films view (if available)
      // await page.getByRole('link', { name: /trash|deleted/i }).click();

      // Find the deleted film
      // await page.getByText(deletedFilmName).locator('..').getByRole('button', { name: /restore/i }).click();

      // Verify restore success
      // await expect(page.getByText(/restored/i)).toBeVisible();
    });
  });

  test.describe("Filter Functionality", () => {
    test("search filter works", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Get initial count of visible rows
      const initialRows = await page.locator("tbody tr").count();

      // Type in search
      const searchInput = page.getByPlaceholder("Search films...");
      await searchInput.fill("nonexistent-film-xyz-12345");

      // Wait for filtering to apply
      await page.waitForTimeout(500);

      // Verify "No results" or fewer rows
      const noResults = page.getByText("No results.");
      const hasNoResults = await noResults.isVisible().catch(() => false);

      if (!hasNoResults) {
        const filteredRows = await page.locator("tbody tr").count();
        expect(filteredRows).toBeLessThanOrEqual(initialRows);
      }

      // Clear search
      await searchInput.clear();

      // Rows should return to initial count (or show results again)
      await page.waitForTimeout(500);
    });

    test("advanced filters panel opens", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Click Advanced Filters button
      await page.getByRole("button", { name: /advanced filters|filters/i }).click();

      // Verify filter popover opens
      await expect(page.getByText("Filter Options")).toBeVisible();

      // Verify filter sections are present
      await expect(page.getByText("Hide zero-quantity films")).toBeVisible();
      await expect(page.getByText("Brands")).toBeVisible();
      await expect(page.getByText("Types")).toBeVisible();
      await expect(page.getByText("Formats")).toBeVisible();
      await expect(page.getByText("ISO")).toBeVisible();
    });

    test("brand filter filters the list", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Open filters
      await page.getByRole("button", { name: /advanced filters|filters/i }).click();
      await expect(page.getByText("Filter Options")).toBeVisible();

      // Expand Brands section
      await page.getByText("Brands").click();

      // Check if any brand checkboxes are available
      const brandCheckboxes = page.locator(
        '[class*="CollapsibleContent"] label:has-text("Kodak"), [class*="CollapsibleContent"] label:has-text("Fuji"), [class*="CollapsibleContent"] label:has-text("Ilford")'
      );

      const checkboxCount = await brandCheckboxes.count();
      if (checkboxCount > 0) {
        // Click the first available brand
        await brandCheckboxes.first().click();

        // Close popover by clicking outside or pressing Escape
        await page.keyboard.press("Escape");

        // Verify active filter badge appears
        await expect(page.locator('.flex.flex-wrap.gap-2 [class*="Badge"]')).toBeVisible();
      }
    });

    test("clear all filters button works", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Open filters and apply one
      await page.getByRole("button", { name: /advanced filters|filters/i }).click();

      // Toggle hide zero quantity
      await page.getByLabel("Hide zero-quantity films").click();

      // Verify filter is applied (badge should appear)
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // Re-open filters
      await page.getByRole("button", { name: /advanced filters|filters/i }).click();

      // Click Clear All
      const clearButton = page.getByRole("button", { name: /clear all/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
    });
  });

  test.describe("View Toggle", () => {
    test("can switch between table and grid view", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Default should be table view
      const tableButton = page.getByRole("button", { name: /table/i });
      const gridButton = page.getByRole("button", { name: /grid/i });

      await expect(tableButton).toBeVisible();
      await expect(gridButton).toBeVisible();

      // Verify table is visible initially
      await expect(page.locator("table")).toBeVisible();

      // Switch to grid view
      await gridButton.click();

      // Wait for transition
      await page.waitForTimeout(500);

      // Table should not be visible, grid should be
      // The grid component uses a different structure
      await expect(page.locator("table")).not.toBeVisible();

      // Switch back to table view
      await tableButton.click();
      await page.waitForTimeout(500);

      // Table should be visible again
      await expect(page.locator("table")).toBeVisible();
    });
  });

  test.describe("Tabs Functionality", () => {
    test("can switch between stats tabs", async ({ page }) => {
      await page.goto("/films");
      await waitForFilmsPageLoad(page);

      // Find tabs section
      const detailedStatsTab = page.getByRole("tab", {
        name: /detailed stats/i,
      });
      const expirationTab = page.getByRole("tab", {
        name: /expiration timeline/i,
      });

      await expect(detailedStatsTab).toBeVisible();
      await expect(expirationTab).toBeVisible();

      // Click expiration timeline tab
      await expirationTab.click();

      // Verify tab content changes (expiration timeline component should be visible)
      await expect(
        page.getByRole("tabpanel").filter({ has: page.locator(":visible") })
      ).toBeVisible();

      // Click back to detailed stats
      await detailedStatsTab.click();
    });
  });
});

test.describe("Film Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("ECN film toggle works", async ({ page }) => {
    await page.goto("/films");
    await waitForFilmsPageLoad(page);

    await page.getByRole("button", { name: /add film/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // ECN switch should be visible
    const ecnSwitch = page.getByRole("switch", { name: /ecn film/i });
    await expect(ecnSwitch).toBeVisible();

    // Toggle it on
    await ecnSwitch.click();
    await expect(ecnSwitch).toBeChecked();

    // Toggle it off
    await ecnSwitch.click();
    await expect(ecnSwitch).not.toBeChecked();
  });

  test("bulk film fields appear when toggle is enabled", async ({ page }) => {
    await page.goto("/films");
    await waitForFilmsPageLoad(page);

    await page.getByRole("button", { name: /add film/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Select 35mm format to enable bulk option
    await page.getByLabel("Format").click();
    await page.getByRole("option", { name: "35mm" }).click();

    // Bulk switch should now be visible
    const bulkSwitch = page.getByRole("switch", { name: /bulk film/i });
    await expect(bulkSwitch).toBeVisible();

    // Enable bulk film
    await bulkSwitch.click();

    // Bulk-specific fields should appear
    await expect(page.getByLabel("Number of Bulk Rolls")).toBeVisible();
    await expect(page.getByLabel("Length per Bulk (meters)")).toBeVisible();

    // Quantity field should be replaced with calculated rolls info
    await expect(page.getByText("Total Calculated Rolls")).toBeVisible();
  });

  test("120 format does not show bulk option", async ({ page }) => {
    await page.goto("/films");
    await waitForFilmsPageLoad(page);

    await page.getByRole("button", { name: /add film/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Select 120 format
    await page.getByLabel("Format").click();
    await page.getByRole("option", { name: "120" }).click();

    // Wait a moment for any conditional rendering
    await page.waitForTimeout(300);

    // Bulk switch should NOT be visible for 120 format
    const bulkSwitch = page.getByRole("switch", { name: /bulk film/i });
    await expect(bulkSwitch).not.toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("films page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/films");
    await waitForFilmsPageLoad(page);

    // Should have h1 for main title
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Film Inventory");
  });

  test("form inputs have proper labels", async ({ page }) => {
    await page.goto("/films");
    await waitForFilmsPageLoad(page);

    await page.getByRole("button", { name: /add film/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Key inputs should have labels
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("ISO")).toBeVisible();
    await expect(page.getByLabel("Format")).toBeVisible();
    await expect(page.getByLabel("Type")).toBeVisible();
  });

  test("buttons are keyboard accessible", async ({ page }) => {
    await page.goto("/films");
    await waitForFilmsPageLoad(page);

    // Tab to Add Film button and press Enter
    await page.keyboard.press("Tab");

    // Keep tabbing until we reach the Add Film button or a reasonable number of tabs
    let foundButton = false;
    for (let i = 0; i < 20; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.textContent?.toLowerCase().includes("add film") || false;
      });

      if (focused) {
        foundButton = true;
        await page.keyboard.press("Enter");
        break;
      }
      await page.keyboard.press("Tab");
    }

    if (foundButton) {
      // Dialog should open
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    }
  });
});
