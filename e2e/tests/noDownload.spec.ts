import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { runSearch } from "./utils/search";

test.use({ envFile: ".env.e2e.nodownload" });

test("NO_DOWNLOAD: Should set items to 'no_download' status when NO_DOWNLOAD is enabled", async ({
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

  // Verify item is in the list with "no_download" status
  await expect(page.getByLabel("Processing table")).toContainText("In Utero");
  await expect(page.getByLabel("Processing table")).toContainText(
    "no_download",
  );
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

test("NO_DOWNLOAD: Should display Block icon for no_download items in download button", async ({
  page,
}) => {
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

  // Verify the download button is disabled
  await expect(downloadButton).toBeDisabled();
});

test("NO_DOWNLOAD: Should display primary color FAB when NO_DOWNLOAD is enabled", async ({
  page,
}) => {
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

  // Verify the queue is empty
  await page.waitForTimeout(500);
  await expect(
    page.getByLabel("Processing table").locator("tbody tr"),
  ).toHaveCount(0);
});
