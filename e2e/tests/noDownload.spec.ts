import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { mockConfigAPI, mockItemOutputSSE } from "./utils/mock";
import { runSearch } from "./utils/search";

test("NO_DOWNLOAD: Should set items to 'no_download' status when NO_DOWNLOAD is enabled", async ({
  page,
}) => {
  // Mock config with NO_DOWNLOAD=true
  await mockConfigAPI(page, {
    parameters: { NO_DOWNLOAD: "true" },
  });

  // Mock item output SSE (although it won't be called in no_download mode)
  await mockItemOutputSSE(page, "high");

  // Mock queue status endpoint
  await page.route("**/queue/status", async (route) => {
    await route.fulfill({
      status: 200,
      json: { isPaused: false },
    });
  });

  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page
    .locator("div:nth-child(2) > .MuiPaper-root > div:nth-child(2)")
    .getByTestId("btn-dl")
    .click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Verify item is in the list with "no_download" status
  await expect(page.getByLabel("Processing table")).toContainText("In Utero");
  await expect(page.getByLabel("Processing table")).toContainText(
    "no_download",
  );
});

test("NO_DOWNLOAD: Should not display pause button when NO_DOWNLOAD is enabled", async ({
  page,
}) => {
  // Mock config with NO_DOWNLOAD=true
  await mockConfigAPI(page, {
    parameters: { NO_DOWNLOAD: "true" },
  });

  await mockItemOutputSSE(page, "high");

  // Mock queue status endpoint
  await page.route("**/queue/status", async (route) => {
    await route.fulfill({
      status: 200,
      json: { isPaused: false },
    });
  });

  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page.getByRole("button", { name: "Get album" }).nth(2).click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Wait for dialog to open
  await page.waitForTimeout(500);

  // Verify pause button is NOT visible
  const pauseButton = page.getByRole("button", { name: "Pause" });
  await expect(pauseButton).not.toBeVisible();
});

test("NO_DOWNLOAD: Should not display terminal button for no_download items", async ({
  page,
}) => {
  // Mock config with NO_DOWNLOAD=true
  await mockConfigAPI(page, {
    parameters: { NO_DOWNLOAD: "true" },
  });

  await mockItemOutputSSE(page, "high");

  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page
    .locator("div:nth-child(2) > .MuiPaper-root > div:nth-child(2)")
    .getByTestId("btn-dl")
    .click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Wait for the table to be visible
  await page.waitForSelector('[aria-label="Processing table"]', {
    state: "visible",
    timeout: 5000,
  });

  // Verify terminal button is NOT visible
  const terminalButton = page.getByTestId("btn-console");
  await expect(terminalButton).not.toBeVisible();
});

test("NO_DOWNLOAD: Should display Block icon for no_download items in download button", async ({
  page,
}) => {
  // Mock config with NO_DOWNLOAD=true
  await mockConfigAPI(page, {
    parameters: { NO_DOWNLOAD: "true" },
  });

  await mockItemOutputSSE(page, "high");

  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();

  // Find the download button and click it
  const downloadButton = page
    .locator("div:nth-child(2) > .MuiPaper-root > div:nth-child(2)")
    .getByTestId("btn-dl");
  await downloadButton.click();

  // Wait a bit for the status to update
  await page.waitForTimeout(500);

  // The button should now have a Block icon (svg with data-testid="BlockIcon")
  const blockIcon = downloadButton.locator('svg[data-testid="BlockIcon"]');
  await expect(blockIcon).toBeVisible();
});

test("NO_DOWNLOAD: Should display primary color FAB when NO_DOWNLOAD is enabled", async ({
  page,
}) => {
  // Mock config with NO_DOWNLOAD=true
  await mockConfigAPI(page, {
    parameters: { NO_DOWNLOAD: "true" },
  });

  await mockItemOutputSSE(page, "high");

  // Mock queue status endpoint
  await page.route("**/queue/status", async (route) => {
    await route.fulfill({
      status: 200,
      json: { isPaused: false },
    });
  });

  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page.getByRole("button", { name: "Get album" }).nth(2).click();

  // Wait for FAB to appear
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();

  // Check if the FAB has primary color
  const fab = page.locator("button.MuiFab-circular");
  await expect(fab).toHaveClass(/MuiFab-primary/);
});

test("NO_DOWNLOAD: Should allow clearing items even in no_download mode", async ({
  page,
}) => {
  // Mock config with NO_DOWNLOAD=true
  await mockConfigAPI(page, {
    parameters: { NO_DOWNLOAD: "true" },
  });

  await mockItemOutputSSE(page, "high");

  // Track API call
  let removeAllCalled = false;
  await page.route("**/remove-all", async (route) => {
    removeAllCalled = true;
    await route.fulfill({ status: 204 });
  });

  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page.getByRole("button", { name: "Get album" }).nth(2).click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Verify item is in the list
  await expect(page.getByLabel("Processing table")).toContainText(
    "MTV Unplugged In New York",
  );

  // Setup confirmation dialog handler
  page.once("dialog", (dialog) => {
    expect(dialog.message()).toContain(
      "Are you sure you want to clear all items from the queue?",
    );
    dialog.accept();
  });

  // Click "Clear all" button
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Clear all" }).click();

  // Verify the API was called
  await page.waitForTimeout(500);
  expect(removeAllCalled).toBe(true);
});
