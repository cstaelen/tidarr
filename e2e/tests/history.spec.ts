import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { runSearch } from "./utils/search";

test("History: Should see and clear all history when flush is called", async ({
  page,
}) => {
  let historyDeleteCalled = false;
  const historyAfterDelete: string[] = [];

  // Mock initial history list with items
  await page.route("**/history/list", async (route) => {
    if (route.request().method() === "DELETE") {
      historyDeleteCalled = true;
      await route.fulfill({ status: 204 });
      return;
    }

    // GET request - return history based on whether delete was called
    const mockHistory = historyDeleteCalled
      ? historyAfterDelete
      : ["77610756", "77610844"];
    await route.fulfill({ status: 200, json: mockHistory });
  });

  await runSearch("Nirvana", page);

  await expect(page.locator(".MuiButton-colorSuccess")).toHaveCount(7);

  // Navigate to settings page (where flush history button might be)
  await page.getByRole("button", { name: "Tidarr settings" }).click();

  // Wait for settings to load
  await page.waitForTimeout(500);

  await page.getByRole("tab", { name: "Tidal" }).click();

  // Look for a button or action to clear history
  // Note: This assumes there's a UI element for clearing history in settings
  // Adjust the selector based on your actual implementation
  const clearHistoryButton = page.getByRole("button", {
    name: /Empty history/i,
  });

  // If the button exists, click it
  await clearHistoryButton.isVisible();
  await clearHistoryButton.click();

  // Wait for the API call
  await page.waitForTimeout(500);

  // Verify the DELETE API was called
  expect(historyDeleteCalled).toBe(true);

  await expect(page.locator(".MuiButton-colorSuccess")).toHaveCount(0);
});
