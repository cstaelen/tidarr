import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import mockTrack from "./mocks/track.json";
import { runSearch } from "./utils/search";

test("Atmos dropdown : should cycle through filter options", async ({
  page,
}) => {
  await page.goto("/");

  const btn = page.getByLabel("Dolby Atmos filter");
  await expect(btn).toBeVisible();

  // Default tooltip shows "none"
  await expect(btn).toHaveAttribute("aria-label", "Dolby Atmos filter");

  // Open menu
  await btn.click();
  await expect(page.getByText("No Atmos")).toBeVisible();
  await expect(page.getByText("Atmos only")).toBeVisible();
  await expect(page.getByText("Atmos allowed")).toBeVisible();

  // Select "only"
  await page.getByText("Atmos only").click();
  await expect(page.getByRole("menu")).not.toBeVisible();

  // Re-open to verify "Atmos only" is selected (Mui-selected on the li)
  await btn.click();
  await expect(
    page.getByRole("menuitem").filter({ hasText: "Atmos only" }),
  ).toHaveClass(/Mui-selected/);
});

test("Atmos chip : should NOT show chip on track without DOLBY_ATMOS", async ({
  page,
}) => {
  // Default mock has audioModes: ["STEREO"]
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: /Tracks/ }).click();

  const firstTrack = page
    .locator("#full-width-tabpanel-3")
    .getByTestId("item")
    .first();

  await expect(firstTrack).toBeVisible();
  await expect(firstTrack.getByText("Atmos")).not.toBeVisible();
});

test("Atmos chip : should show chip on track with DOLBY_ATMOS", async ({
  page,
}) => {
  // Override the track mock before navigation to inject DOLBY_ATMOS
  await page.route("**/proxy/tidal/v1/tracks/77610761?**", async (route) => {
    await route.fulfill({
      json: { ...mockTrack, audioModes: ["STEREO", "DOLBY_ATMOS"] },
    });
  });

  await page.goto("/track/77610761");

  // Chip should appear in the track header
  await expect(page.getByText("Atmos")).toBeVisible();
});
