import test, { expect } from "@playwright/test";

import { goToHome } from "./utils/helpers";
import { mockConfigAPI, mockRelease } from "./utils/mock";
import { countItems } from "./utils/search";

test("Tidarr Home : Should see the homepage and tabs", async ({ page }) => {
  await mockConfigAPI(page);
  await mockRelease(page);

  await goToHome(page);
  await page.evaluate("localStorage.clear()");

  await expect(page.getByRole("heading").first()).toContainText("Tidarr");

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
