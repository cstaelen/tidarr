import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { mockItemOutputSSE } from "./utils/mock";
import { runSearch } from "./utils/search";

test("Queue: Should be able to pause-resume the queue", async ({ page }) => {
  // Track API calls
  let resumeCalled = false;
  let pauseCalled = false;
  await page.route("**/queue/resume", async (route) => {
    resumeCalled = true;
    route.continue();
  });
  await page.route("**/queue/pause", async (route) => {
    pauseCalled = true;
    route.continue();
  });

  await mockItemOutputSSE(page, "high");

  await page.goto("/");

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
  const pauseButton = page.getByRole("button", { name: "Pause" });
  await expect(pauseButton).toBeVisible();
  await pauseButton.click();

  // Verify the resume API was called
  await page.waitForTimeout(500);
  expect(pauseCalled).toBe(true);

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

  await page.goto("/");

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

test("Queue: Should hide finished items by default and toggle visibility", async ({
  page,
}) => {
  const mockData = [
    {
      id: "1",
      title: "In Utero",
      artist: "Nirvana",
      type: "album",
      quality: "high",
      status: "finished",
      loading: false,
    },
    {
      id: "2",
      title: "Nevermind",
      artist: "Nirvana",
      type: "album",
      quality: "high",
      status: "queue_download",
      loading: false,
    },
  ];

  await page.route("**/stream-processing", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: `data: ${JSON.stringify(mockData)}\n\n`,
    });
  });

  await page.goto("/");
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  await page.waitForSelector('[aria-label="Processing table"]', {
    state: "visible",
    timeout: 5000,
  });

  // Finished item hidden by default (not in finished table, which is not rendered)
  await expect(page.getByLabel("Processing table")).not.toContainText(
    "In Utero",
  );
  await expect(page.getByLabel("Finished table")).not.toBeVisible();
  // Non-finished item visible in processing table
  await expect(page.getByLabel("Processing table")).toContainText("Nevermind");

  // Toggle button shows count
  const showButton = page.getByRole("button", { name: "Show finished (1)" });
  await expect(showButton).toBeVisible();
  // Clear finished button is also visible
  await expect(
    page.getByRole("button", { name: "Clear finished" }),
  ).toBeVisible();
  await showButton.click();

  // Finished table now visible with item
  await expect(page.getByLabel("Finished table")).toBeVisible();
  await expect(page.getByLabel("Finished table")).toContainText("In Utero");

  // Button label changed
  await expect(
    page.getByRole("button", { name: "Hide finished" }),
  ).toBeVisible();

  // Toggle back
  await page.getByRole("button", { name: "Hide finished" }).click();
  await expect(page.getByLabel("Finished table")).not.toBeVisible();

  // Clean up
  await page.route("**/stream-processing", (route) => route.continue());
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

  await page.goto("/");

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

test("Queue: Should paginate with show more button when list exceeds 100 items", async ({
  page,
}) => {
  const mockData = Array.from({ length: 110 }, (_, i) => ({
    id: String(i + 1),
    title: `Album ${i + 1}`,
    artist: "Artist",
    type: "album",
    quality: "high",
    status: "queue_download",
    loading: false,
  }));

  await page.route("**/stream-processing", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: `data: ${JSON.stringify(mockData)}\n\n`,
    });
  });

  await page.goto("/");
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  await page.waitForSelector('[aria-label="Processing table"]', {
    state: "visible",
    timeout: 5000,
  });

  // Only first 100 items visible
  await expect(page.getByLabel("Processing table")).toContainText("Album 1");
  await expect(page.getByLabel("Processing table")).toContainText("Album 100");
  await expect(page.getByLabel("Processing table")).not.toContainText(
    "Album 101",
  );

  // Show more button visible with correct count
  const showMoreButton = page.getByRole("button", {
    name: "Show more (10 remaining)",
  });
  await expect(showMoreButton).toBeVisible();

  // Click show more reveals remaining items
  await showMoreButton.click();
  await expect(page.getByLabel("Processing table")).toContainText("Album 101");
  await expect(showMoreButton).not.toBeVisible();

  await page.route("**/stream-processing", (route) => route.continue());
});
