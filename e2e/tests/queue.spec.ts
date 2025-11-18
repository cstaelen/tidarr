import { expect, test } from "@playwright/test";

import { emptyProcessingList, goToHome } from "./utils/helpers";
import { mockConfigAPI, mockItemOutputSSE } from "./utils/mock";
import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

test.afterEach(async ({ page }) => {
  await emptyProcessingList(page);
});

test("Queue: Should be able to pause the queue", async ({ page }) => {
  await mockItemOutputSSE(page, "high");

  // Track API calls
  let pauseCalled = false;
  await page.route("**/queue/pause", async (route) => {
    pauseCalled = true;
    await route.fulfill({ status: 204 });
  });

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

  // Verify item is in the list
  await expect(page.getByLabel("Processing table")).toContainText("In Utero");

  // Find and click the pause button
  const pauseButton = page.getByRole("button", { name: "Pause" });
  await expect(pauseButton).toBeVisible();
  await pauseButton.click();

  // Verify the pause API was called
  await page.waitForTimeout(500);
  expect(pauseCalled).toBe(true);
});

test("Queue: Should be able to resume the queue", async ({ page }) => {
  await mockItemOutputSSE(page, "high");

  // Track API calls
  let resumeCalled = false;
  await page.route("**/queue/resume", async (route) => {
    resumeCalled = true;
    await route.fulfill({ status: 204 });
  });

  // Mock queue status as paused
  await page.route("**/queue/status", async (route) => {
    await route.fulfill({
      status: 200,
      json: { isPaused: true },
    });
  });

  await mockConfigAPI(page);
  await goToHome(page);

  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page.getByRole("button", { name: "Get album" }).nth(2).click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Wait for pause button to appear (it should be in "resume" state - showing PlayArrow icon)
  await page.waitForTimeout(500);

  // Find and click the resume button (when paused, the button shows PlayArrow)
  const resumeButton = page.getByRole("button", { name: "Resume" });
  await expect(resumeButton).toBeVisible();
  await resumeButton.click();

  // Verify the resume API was called
  await page.waitForTimeout(500);
  expect(resumeCalled).toBe(true);
});

test("Queue: Should load queue status on mount", async ({ page }) => {
  let statusCalled = false;

  // Mock queue status endpoint
  await page.route("**/queue/status", async (route) => {
    statusCalled = true;
    await route.fulfill({
      status: 200,
      json: { isPaused: false },
    });
  });

  await mockConfigAPI(page);
  await goToHome(page);

  // Add an item to trigger the processing list to appear
  await mockItemOutputSSE(page, "high");
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page.getByRole("button", { name: "Get album" }).nth(2).click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Wait for the button to be visible (which should trigger the status load)
  await page.waitForTimeout(500);

  // Verify the status API was called
  expect(statusCalled).toBe(true);
});

test("Queue: Should display warning color when paused", async ({ page }) => {
  await mockItemOutputSSE(page, "high");

  // Mock queue status as paused
  await page.route("**/queue/status", async (route) => {
    await route.fulfill({
      status: 200,
      json: { isPaused: true },
    });
  });

  await mockConfigAPI(page);
  await goToHome(page);

  // Add an item to the queue
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();
  await page.getByRole("button", { name: "Get album" }).nth(2).click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();

  // Check if the FAB has warning color (orange/yellow when paused)
  const fab = page.locator("button.MuiFab-circular");
  await expect(fab).toHaveClass(/MuiFab-warning/);
});
