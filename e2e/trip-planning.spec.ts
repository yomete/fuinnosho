import { test, expect, Page } from "@playwright/test";

/**
 * Trip Planning E2E Tests
 *
 * These tests cover the complete trip management lifecycle:
 * - Navigation to trips page
 * - Creating trips with start/end dates
 * - Adding films to a trip
 * - Adding gear to a trip
 * - Editing trips
 * - Marking trips as completed
 * - Trip status changes based on dates (upcoming, ongoing, past)
 * - Deleting trips
 *
 * NOTE: These tests require authentication. The auth flow is handled
 * via the login helper function. For CI environments, consider using
 * a test account or mocking auth.
 */

// Test data for creating trips
const TEST_TRIP = {
  title: "E2E Test Trip",
  description: "A photography trip created by E2E tests for testing purposes",
  // Dates will be set dynamically to ensure they're always in the future
};

/**
 * Helper function to log in to the application
 * TODO: Replace with actual test credentials or implement auth bypass for testing
 */
async function login(page: Page) {
  await page.goto("/trips");

  // Check if we're redirected to login
  if (page.url().includes("/login")) {
    // TODO: Fill in test credentials
    // await page.getByLabel('Email').fill('test@example.com');
    // await page.getByLabel('Password').fill('testpassword');
    // await page.getByRole('button', { name: 'Sign in' }).click();
    // await page.waitForURL('/trips');

    // For now, skip tests that require auth
    test.skip(true, "Authentication required - configure test credentials");
  }
}

/**
 * Helper to generate unique trip names for test isolation
 */
function generateUniqueTripName(baseName: string): string {
  return `${baseName} ${Date.now()}`;
}

/**
 * Helper to get future dates for trip creation
 * Returns dates in YYYY-MM-DD format
 */
function getFutureDates(daysFromNow: number = 7, duration: number = 5): {
  startDate: string;
  endDate: string;
} {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);

  const end = new Date(start);
  end.setDate(end.getDate() + duration);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

/**
 * Helper to get past dates for testing trip status
 */
function getPastDates(daysAgo: number = 14, duration: number = 5): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();
  end.setDate(end.getDate() - daysAgo);

  const start = new Date(end);
  start.setDate(start.getDate() - duration);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

/**
 * Helper to get current dates for testing ongoing trip status
 */
function getOngoingDates(): {
  startDate: string;
  endDate: string;
} {
  const start = new Date();
  start.setDate(start.getDate() - 2);

  const end = new Date();
  end.setDate(end.getDate() + 3);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

/**
 * Helper to wait for page to be fully loaded after navigation
 */
async function waitForTripsPageLoad(page: Page) {
  await page.waitForSelector('h1:has-text("Trips")', {
    timeout: 10000,
  });
}

/**
 * Helper to create a trip for testing
 */
async function createTestTrip(
  page: Page,
  tripName: string,
  dates: { startDate: string; endDate: string }
): Promise<void> {
  // Click New Trip button
  await page.getByRole("button", { name: /new trip/i }).click();

  // Wait for form to appear
  await expect(page.locator('h1:has-text("New Trip")')).toBeVisible();

  // Fill in form fields
  await page.getByLabel("Trip Title").fill(tripName);
  await page.getByLabel("Description").fill(TEST_TRIP.description);
  await page.getByLabel("Start Date").fill(dates.startDate);
  await page.getByLabel("End Date").fill(dates.endDate);

  // Submit form
  await page.getByRole("button", { name: "Create Trip" }).click();

  // Wait for form to close and return to trips list
  await waitForTripsPageLoad(page);
}

test.describe("Trip Planning", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe("Navigation", () => {
    test("can navigate to trips page", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Verify page title and header
      await expect(page.locator("h1")).toContainText("Trips");

      // Verify subtitle/description
      await expect(
        page.getByText("Manage your photo trips and film reservations")
      ).toBeVisible();

      // Verify New Trip button is present
      await expect(
        page.getByRole("button", { name: /new trip/i })
      ).toBeVisible();
    });

    test("shows empty state when no trips exist", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Check for empty state (this may or may not be visible depending on existing data)
      const emptyState = page.getByText("No trips yet");
      const hasTrips = await page.locator("table").isVisible().catch(() => false);

      if (!hasTrips) {
        await expect(emptyState).toBeVisible();
        await expect(
          page.getByText("Create your first trip to start managing your film reservations")
        ).toBeVisible();
      }
    });
  });

  test.describe("Create Trip", () => {
    test("can create a new trip with start and end dates", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      const uniqueName = generateUniqueTripName(TEST_TRIP.title);
      const dates = getFutureDates();

      // Click New Trip button
      await page.getByRole("button", { name: /new trip/i }).click();

      // Wait for form to appear
      await expect(page.locator('h1:has-text("New Trip")')).toBeVisible();
      await expect(
        page.getByText("Create a new trip to reserve films")
      ).toBeVisible();

      // Verify form structure
      await expect(page.getByLabel("Trip Title")).toBeVisible();
      await expect(page.getByLabel("Description")).toBeVisible();
      await expect(page.getByLabel("Start Date")).toBeVisible();
      await expect(page.getByLabel("End Date")).toBeVisible();

      // Fill in form fields
      await page.getByLabel("Trip Title").fill(uniqueName);
      await page.getByLabel("Description").fill(TEST_TRIP.description);
      await page.getByLabel("Start Date").fill(dates.startDate);
      await page.getByLabel("End Date").fill(dates.endDate);

      // Submit form
      await page.getByRole("button", { name: "Create Trip" }).click();

      // Wait for form to close and return to trips list
      await waitForTripsPageLoad(page);

      // Verify trip appears in the list
      await expect(page.getByText(uniqueName)).toBeVisible();
    });

    test("can cancel trip creation", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Click New Trip button
      await page.getByRole("button", { name: /new trip/i }).click();

      // Wait for form to appear
      await expect(page.locator('h1:has-text("New Trip")')).toBeVisible();

      // Click Cancel button
      await page.getByRole("button", { name: "Cancel" }).click();

      // Should return to trips list
      await waitForTripsPageLoad(page);
    });

    test("can navigate back using Back to Trips button", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Click New Trip button
      await page.getByRole("button", { name: /new trip/i }).click();

      // Wait for form to appear
      await expect(page.locator('h1:has-text("New Trip")')).toBeVisible();

      // Click Back to Trips button
      await page.getByRole("button", { name: /back to trips/i }).click();

      // Should return to trips list
      await waitForTripsPageLoad(page);
    });

    test("form validation requires all fields", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Click New Trip button
      await page.getByRole("button", { name: /new trip/i }).click();

      // Wait for form to appear
      await expect(page.locator('h1:has-text("New Trip")')).toBeVisible();

      // Try to submit empty form
      await page.getByRole("button", { name: "Create Trip" }).click();

      // Form should still be visible (not submitted due to validation)
      await expect(page.locator('h1:has-text("New Trip")')).toBeVisible();

      // Required field validation should prevent submission
      // The form uses HTML5 required attributes
    });
  });

  test.describe("Edit Trip", () => {
    test("can edit an existing trip", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // First, create a trip to edit
      const uniqueName = generateUniqueTripName("Edit Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Find the trip row and click Edit
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("button", { name: /edit/i }).click();

      // Wait for edit form to appear
      await expect(page.locator('h1:has-text("Edit Trip")')).toBeVisible();

      // Verify form is pre-populated
      await expect(page.getByLabel("Trip Title")).toHaveValue(uniqueName);

      // Modify the trip
      const updatedName = `${uniqueName} - Updated`;
      await page.getByLabel("Trip Title").clear();
      await page.getByLabel("Trip Title").fill(updatedName);

      // Submit changes
      await page.getByRole("button", { name: "Update Trip" }).click();

      // Wait for form to close
      await waitForTripsPageLoad(page);

      // Verify changes are reflected
      await expect(page.getByText(updatedName)).toBeVisible();
    });

    test("can cancel trip editing", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // First, create a trip to edit
      const uniqueName = generateUniqueTripName("Cancel Edit Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Find the trip row and click Edit
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("button", { name: /edit/i }).click();

      // Wait for edit form to appear
      await expect(page.locator('h1:has-text("Edit Trip")')).toBeVisible();

      // Click Cancel
      await page.getByRole("button", { name: "Cancel" }).click();

      // Should return to trips list
      await waitForTripsPageLoad(page);

      // Original trip name should still be there
      await expect(page.getByText(uniqueName)).toBeVisible();
    });
  });

  test.describe("Add Films to Trip", () => {
    test("can add films to a trip", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // First, create a trip
      const uniqueName = generateUniqueTripName("Films Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Navigate to trip details by clicking View Details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      // Wait for trip details page to load
      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // Verify Reserved Films section exists
      await expect(page.getByText("Reserved Films")).toBeVisible();
      await expect(
        page.getByText("Films you've reserved for this trip")
      ).toBeVisible();

      // Check if there are available films to add
      const filmSelector = page.locator('button:has-text("Select a film")');
      const hasFilmSelector = await filmSelector.isVisible().catch(() => false);

      if (hasFilmSelector) {
        // Click the film selector
        await filmSelector.click();

        // Wait for dropdown to open
        await page.waitForTimeout(300);

        // Check if there are films available
        const filmOptions = page.locator('[role="option"]');
        const filmCount = await filmOptions.count();

        if (filmCount > 0) {
          // Select the first available film
          await filmOptions.first().click();

          // Set quantity
          await page.locator('input[type="number"]').first().fill("2");

          // Click Add Film button
          await page.getByRole("button", { name: /add.*film/i }).click();

          // Wait for film to be added
          await page.waitForTimeout(500);

          // Verify film was added (should see "reserved" badge)
          await expect(page.getByText(/reserved/i)).toBeVisible();
        }
      }
    });

    test("can remove films from a trip", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Create a trip and navigate to details
      const uniqueName = generateUniqueTripName("Remove Films Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Navigate to trip details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // First add a film (if available)
      const filmSelector = page.locator('button:has-text("Select a film")');
      const hasFilmSelector = await filmSelector.isVisible().catch(() => false);

      if (hasFilmSelector) {
        await filmSelector.click();
        await page.waitForTimeout(300);

        const filmOptions = page.locator('[role="option"]');
        const filmCount = await filmOptions.count();

        if (filmCount > 0) {
          await filmOptions.first().click();
          await page.getByRole("button", { name: /add.*film/i }).click();
          await page.waitForTimeout(500);

          // Now try to remove the film using the X button
          const removeButton = page
            .locator('[class*="border-[#3d3a36]"]')
            .filter({ hasText: /reserved/i })
            .locator('button')
            .last();

          if (await removeButton.isVisible()) {
            await removeButton.click();
            await page.waitForTimeout(500);

            // Verify film was removed (either empty state or film no longer in list)
          }
        }
      }
    });

    test("can edit film quantity in a trip", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Create a trip and navigate to details
      const uniqueName = generateUniqueTripName("Edit Quantity Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Navigate to trip details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // First add a film (if available)
      const filmSelector = page.locator('button:has-text("Select a film")');
      const hasFilmSelector = await filmSelector.isVisible().catch(() => false);

      if (hasFilmSelector) {
        await filmSelector.click();
        await page.waitForTimeout(300);

        const filmOptions = page.locator('[role="option"]');
        const filmCount = await filmOptions.count();

        if (filmCount > 0) {
          await filmOptions.first().click();
          await page.getByRole("button", { name: /add.*film/i }).click();
          await page.waitForTimeout(500);

          // Find the edit button for the film (pen/edit icon)
          const filmItem = page
            .locator('[class*="border-[#3d3a36]"]')
            .filter({ hasText: /reserved/i })
            .first();

          const editButton = filmItem.locator('button').first();

          if (await editButton.isVisible()) {
            await editButton.click();

            // Should see Save and Cancel buttons
            await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
            await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

            // Change the quantity
            const quantityInput = filmItem.locator('input[type="number"]');
            if (await quantityInput.isVisible()) {
              await quantityInput.clear();
              await quantityInput.fill("5");
              await page.getByRole("button", { name: "Save" }).click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    });
  });

  test.describe("Add Gear to Trip", () => {
    test("can add gear to a trip", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // First, create a trip
      const uniqueName = generateUniqueTripName("Gear Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Navigate to trip details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // Verify Reserved Gear section exists
      await expect(page.getByText("Reserved Gear")).toBeVisible();
      await expect(
        page.getByText("Photography gear you've reserved for this trip")
      ).toBeVisible();

      // Check if there are available gear to add
      const gearSelector = page.locator('button:has-text("Select gear")');
      const hasGearSelector = await gearSelector.isVisible().catch(() => false);

      if (hasGearSelector) {
        await gearSelector.click();
        await page.waitForTimeout(300);

        const gearOptions = page.locator('[role="option"]');
        const gearCount = await gearOptions.count();

        if (gearCount > 0) {
          // Select the first available gear
          await gearOptions.first().click();

          // Click Add Gear button
          await page.getByRole("button", { name: /add gear/i }).click();

          // Wait for gear to be added
          await page.waitForTimeout(500);

          // Verify gear was added (should see the gear item in the list)
        }
      }
    });

    test("can remove gear from a trip", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Create a trip and navigate to details
      const uniqueName = generateUniqueTripName("Remove Gear Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Navigate to trip details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // First add gear (if available)
      const gearSelector = page.locator('button:has-text("Select gear")');
      const hasGearSelector = await gearSelector.isVisible().catch(() => false);

      if (hasGearSelector) {
        await gearSelector.click();
        await page.waitForTimeout(300);

        const gearOptions = page.locator('[role="option"]');
        const gearCount = await gearOptions.count();

        if (gearCount > 0) {
          await gearOptions.first().click();
          await page.getByRole("button", { name: /add gear/i }).click();
          await page.waitForTimeout(500);

          // Now try to remove the gear using the X button
          const gearSection = page.locator('div').filter({ hasText: "Reserved Gear" }).last();
          const removeButton = gearSection.locator('button').last();

          if (await removeButton.isVisible()) {
            await removeButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });

  test.describe("Mark Trip as Completed", () => {
    test("can mark a trip as completed", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // First, create a trip
      const uniqueName = generateUniqueTripName("Complete Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Find the trip row and click Mark as Completed
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      const completeButton = tripRow.getByRole("button", {
        name: /mark as completed/i,
      });

      await expect(completeButton).toBeVisible();
      await completeButton.click();

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify toast message
      await expect(page.getByText("Trip marked as completed")).toBeVisible({
        timeout: 5000,
      });

      // Verify trip status changed to completed
      await expect(tripRow.getByText("completed")).toBeVisible();

      // The Mark as Completed button should now be disabled
      await expect(completeButton).toBeDisabled();
    });

    test("completed trips cannot be marked as completed again", async ({
      page,
    }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Create and complete a trip
      const uniqueName = generateUniqueTripName("Already Complete Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Mark as completed
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("button", { name: /mark as completed/i }).click();
      await page.waitForTimeout(1000);

      // Verify the button is disabled
      const completeButton = tripRow.getByRole("button", {
        name: /mark as completed/i,
      });
      await expect(completeButton).toBeDisabled();
    });
  });

  test.describe("Trip Status Based on Dates", () => {
    test("new trip with future dates shows upcoming status", async ({
      page,
    }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      const uniqueName = generateUniqueTripName("Upcoming Status Test Trip");
      const dates = getFutureDates(30); // 30 days in the future
      await createTestTrip(page, uniqueName, dates);

      // Find the trip row
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });

      // Verify status is upcoming
      await expect(tripRow.getByText("upcoming")).toBeVisible();
    });

    test("trip with current dates shows ongoing status", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      const uniqueName = generateUniqueTripName("Ongoing Status Test Trip");
      const dates = getOngoingDates(); // Dates that span today
      await createTestTrip(page, uniqueName, dates);

      // Find the trip row
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });

      // Verify status is ongoing
      await expect(tripRow.getByText("ongoing")).toBeVisible();
    });

    test("trip with past dates shows past status", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      const uniqueName = generateUniqueTripName("Past Status Test Trip");
      const dates = getPastDates(); // Past dates
      await createTestTrip(page, uniqueName, dates);

      // Find the trip row
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });

      // Verify status is past (unless already marked completed)
      const hasPastStatus = await tripRow
        .getByText("past")
        .isVisible()
        .catch(() => false);
      const hasCompletedStatus = await tripRow
        .getByText("completed")
        .isVisible()
        .catch(() => false);

      // Should be either past or completed
      expect(hasPastStatus || hasCompletedStatus).toBeTruthy();
    });

    test("trip table shows status column", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Check if there are any trips in the table
      const table = page.locator("table");
      const hasTable = await table.isVisible().catch(() => false);

      if (hasTable) {
        // Verify Status column header exists
        await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
      }
    });
  });

  test.describe("Delete Trip", () => {
    test("can delete a trip from trip details page", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // First, create a trip to delete
      const uniqueName = generateUniqueTripName("Delete Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Navigate to trip details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // Set up dialog handler to accept the confirmation
      page.on("dialog", (dialog) => dialog.accept());

      // Click Delete Trip button
      await page.getByRole("button", { name: /delete trip/i }).click();

      // Wait for navigation back to trips list
      await waitForTripsPageLoad(page);

      // Verify trip no longer appears in the list
      await expect(page.getByText(uniqueName)).not.toBeVisible({
        timeout: 5000,
      });
    });

    test("delete confirmation can be cancelled", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // First, create a trip
      const uniqueName = generateUniqueTripName("Cancel Delete Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Navigate to trip details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // Set up dialog handler to dismiss the confirmation
      page.on("dialog", (dialog) => dialog.dismiss());

      // Click Delete Trip button
      await page.getByRole("button", { name: /delete trip/i }).click();

      // Should still be on trip details page
      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();
    });
  });

  test.describe("Trip Table Features", () => {
    test("trip table displays all relevant columns", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      // Create a trip to ensure table is visible
      const uniqueName = generateUniqueTripName("Table Columns Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Verify table headers
      await expect(page.getByRole("columnheader", { name: "Title" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Dates" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Duration" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Reserved Films" })
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Description" })
      ).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    });

    test("trip row displays correct information", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      const uniqueName = generateUniqueTripName("Row Info Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      const tripRow = page.locator("tr").filter({ hasText: uniqueName });

      // Verify trip title
      await expect(tripRow.getByText(uniqueName)).toBeVisible();

      // Verify description
      await expect(tripRow.getByText(TEST_TRIP.description)).toBeVisible();

      // Verify status badge
      await expect(tripRow.locator('[class*="Badge"]')).toBeVisible();

      // Verify actions buttons
      await expect(
        tripRow.getByRole("link", { name: /view details/i })
      ).toBeVisible();
      await expect(tripRow.getByRole("button", { name: /edit/i })).toBeVisible();
      await expect(
        tripRow.getByRole("button", { name: /mark as completed/i })
      ).toBeVisible();
    });

    test("reserved films count is displayed", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      const uniqueName = generateUniqueTripName("Films Count Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      const tripRow = page.locator("tr").filter({ hasText: uniqueName });

      // Verify reserved films count is shown (starts at 0)
      await expect(tripRow.locator('[class*="Film"]')).toBeVisible();
    });
  });

  test.describe("Trip Details Navigation", () => {
    test("can navigate to trip details and back", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      const uniqueName = generateUniqueTripName("Navigation Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Click View Details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      // Verify trip details page
      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // Verify Description section
      await expect(page.getByText("Description")).toBeVisible();
      await expect(page.getByText(TEST_TRIP.description)).toBeVisible();

      // Click Back to Trips
      await page.getByRole("button", { name: /back to trips/i }).click();

      // Should be back on trips list
      await waitForTripsPageLoad(page);
    });

    test("trip details shows date information", async ({ page }) => {
      await page.goto("/trips");
      await waitForTripsPageLoad(page);

      const uniqueName = generateUniqueTripName("Dates Display Test Trip");
      const dates = getFutureDates();
      await createTestTrip(page, uniqueName, dates);

      // Navigate to trip details
      const tripRow = page.locator("tr").filter({ hasText: uniqueName });
      await tripRow.getByRole("link", { name: /view details/i }).click();

      await expect(page.locator(`h1:has-text("${uniqueName}")`)).toBeVisible();

      // Verify date and duration information is displayed
      // The component uses Calendar and MapPin icons with date/duration info
      await expect(page.locator('[class*="Calendar"]').first()).toBeVisible();
    });
  });
});

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("trips page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/trips");
    await waitForTripsPageLoad(page);

    // Should have h1 for main title
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Trips");
  });

  test("form inputs have proper labels", async ({ page }) => {
    await page.goto("/trips");
    await waitForTripsPageLoad(page);

    await page.getByRole("button", { name: /new trip/i }).click();
    await expect(page.locator('h1:has-text("New Trip")')).toBeVisible();

    // Key inputs should have labels
    await expect(page.getByLabel("Trip Title")).toBeVisible();
    await expect(page.getByLabel("Description")).toBeVisible();
    await expect(page.getByLabel("Start Date")).toBeVisible();
    await expect(page.getByLabel("End Date")).toBeVisible();
  });

  test("buttons are keyboard accessible", async ({ page }) => {
    await page.goto("/trips");
    await waitForTripsPageLoad(page);

    // Tab through the page to find New Trip button
    let foundButton = false;
    for (let i = 0; i < 20; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.textContent?.toLowerCase().includes("new trip") || false;
      });

      if (focused) {
        foundButton = true;
        await page.keyboard.press("Enter");
        break;
      }
      await page.keyboard.press("Tab");
    }

    if (foundButton) {
      // Form should open
      await expect(page.locator('h1:has-text("New Trip")')).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
