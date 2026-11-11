import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import mockTrack from "./mocks/track.json";

const trackRoute = "**/proxy/tidal/v1/tracks/77610761?**";

test("Quality chip : should show MAX on a hi-res album", async ({ page }) => {
  // Album mock is tagged HIRES_LOSSLESS
  await page.goto("/album/77610756");

  // Scoped to the header card, every track below is tagged hi-res too
  const header = page
    .locator(".MuiCard-root")
    .filter({ has: page.getByRole("heading", { level: 1 }) });

  await expect(header.getByLabel("Quality: MAX")).toBeVisible();
});

test("Quality chip : should show HIGH on a lossless only track", async ({
  page,
}) => {
  await page.route(trackRoute, async (route) => {
    await route.fulfill({
      json: { ...mockTrack, mediaMetadata: { tags: ["LOSSLESS"] } },
    });
  });

  await page.goto("/track/77610761");

  await expect(page.getByLabel("Quality: HIGH").first()).toBeVisible();
});

test("Quality chip : should show NORMAL on an AAC 320 track", async ({
  page,
}) => {
  await page.route(trackRoute, async (route) => {
    await route.fulfill({
      json: { ...mockTrack, audioQuality: "HIGH", mediaMetadata: { tags: [] } },
    });
  });

  await page.goto("/track/77610761");

  await expect(page.getByLabel("Quality: NORMAL").first()).toBeVisible();
});

test("Quality chip : should show LOW on an AAC 96 track", async ({ page }) => {
  await page.route(trackRoute, async (route) => {
    await route.fulfill({
      json: { ...mockTrack, audioQuality: "LOW", mediaMetadata: { tags: [] } },
    });
  });

  await page.goto("/track/77610761");

  await expect(page.getByLabel("Quality: LOW").first()).toBeVisible();
});
