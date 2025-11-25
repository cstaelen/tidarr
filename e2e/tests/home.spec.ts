import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { countItems } from "./utils/search";

test("Tidarr Home : Should see the homepage and tabs", async ({ page }) => {
  await page.goto("/");
  await page.evaluate("localStorage.clear()");

  await expect(page.getByTestId("logo")).toBeInViewport();

  await expect(page.getByText("Tidal Trends")).toBeVisible();
  await expect(page.getByText("My Mixes")).toBeVisible();
  await expect(page.getByText("My Favorites")).toBeVisible();
  await expect(page.getByText("My Playlists")).toBeVisible();

  // Trends
  await countItems(".MuiContainer-root", 59, page);

  // My mixes
  await page.getByText("My Mixes").click();
  await countItems(".MuiContainer-root", 17, page);

  // My playlists
  await page.getByText("My Playlists").click();
  await countItems(".MuiContainer-root", 3, page);

  // My favorites
  await page.getByText("My Favorites").click();
  await countItems(".MuiContainer-root", 55, page);
});

test("Tidarr Home : Should be able to sort playlists and favorites", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate("localStorage.clear()");

  await expect(page.getByTestId("logo")).toBeInViewport();

  // My playlists
  await page.getByText("My Playlists").click();
  await countItems(".MuiContainer-root", 3, page);

  await expect(page.getByTestId("item").first()).toContainText(
    "Mes titres Shazam",
  );

  await page.getByRole("combobox", { name: "Sort Most recent" }).click();
  await page.getByRole("option", { name: "Recently updated" }).click();

  await expect(page.getByTestId("item").first()).toContainText(
    "test clem à supprimer",
  );

  await page.getByRole("combobox", { name: "Sort Recently updated" }).click();
  await page.getByRole("option", { name: "Alphabetical" }).click();

  await expect(page.getByTestId("item").first()).toContainText(
    "Discover Weekly",
  );

  // My favorites
  await page.getByText("My Favorites").click();
  await expect(page.getByTestId("sort-selector")).toHaveCount(3);
});
