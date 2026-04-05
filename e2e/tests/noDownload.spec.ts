import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { runSearch } from "./utils/search";

test.use({ envFile: ".env.e2e.nodownload" });

test("NO_DOWNLOAD: Should set items to 'queue_download' status and keep queue paused when NO_DOWNLOAD is enabled", async ({
  page,
}) => {
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

  // Verify item is in the list and NO_DOWNLOAD message is shown
  await expect(page.getByLabel("Processing table")).toContainText("In Utero");
  await expect(page.getByText("No download mode is active")).toBeVisible();
});

test("NO_DOWNLOAD: Should not display pause button when NO_DOWNLOAD is enabled", async ({
  page,
}) => {
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

test("NO_DOWNLOAD: Should allow re-adding items already in queue", async ({
  page,
}) => {
  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();

  const downloadButton = page
    .locator("div:nth-child(2) > .MuiPaper-root > div:nth-child(2)")
    .getByTestId("btn-dl");
  await downloadButton.click();

  // Wait a bit for the status to update
  await page.waitForTimeout(500);

  // Verify the download button is still enabled (no longer disabled in NO_DOWNLOAD mode)
  await expect(downloadButton).toBeEnabled();
});

test("NO_DOWNLOAD: Should display warning color FAB (paused) when NO_DOWNLOAD is enabled", async ({
  page,
}) => {
  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page.getByRole("button", { name: "Get album" }).nth(2).click();

  // Wait for FAB to appear
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();

  // Queue is paused in NO_DOWNLOAD mode — FAB should be warning color
  const fab = page.locator("button.MuiFab-circular");
  await expect(fab).toHaveClass(/MuiFab-warning/);
});

test("NO_DOWNLOAD: Should display a Download button for no_download items and call /api/single-download on click", async ({
  page,
}) => {
  let singleDownloadCalled = false;
  let singleDownloadBody: { id: string } | undefined;

  await page.route("**/single-download", async (route) => {
    singleDownloadCalled = true;
    singleDownloadBody = route.request().postDataJSON() as { id: string };
    await route.fulfill({ status: 204 });
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

  // Verify the Download button is visible for no_download items
  const downloadNowButton = page.getByTestId("btn-single-download");
  await expect(downloadNowButton).toBeVisible();

  // Click it
  await downloadNowButton.click();

  // Verify the API was called
  await page.waitForTimeout(300);
  expect(singleDownloadCalled).toBe(true);
  expect(singleDownloadBody?.id).toBeTruthy();
});

test("NO_DOWNLOAD: Should allow clearing items even in no_download mode", async ({
  page,
}) => {
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

  // Verify the queue is empty (1 row = empty message row "Nothing to process.")
  await page.waitForTimeout(500);
  await expect(
    page.getByLabel("Processing table").locator("tbody tr"),
  ).toHaveCount(1);
  await expect(page.getByLabel("Processing table")).toContainText(
    "Nothing to process.",
  );
});
