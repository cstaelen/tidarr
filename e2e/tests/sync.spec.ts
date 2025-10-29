import { expect, test } from "@playwright/test";

import { emptyProcessingList, goToHome } from "./utils/helpers";
import { mockConfigAPI, mockRelease } from "./utils/mock";
import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ browserName, page }) => {
  test.skip(browserName.toLowerCase() !== "chromium", `Test only for chromium`);
  await mockConfigAPI(page);
  await mockRelease(page);
});
test.afterEach(async ({ page }) => {
  await emptyProcessingList(page);
});

test("Tidarr sync : Should be able to sync a playlist", async ({ page }) => {
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  await expect(page.getByRole("main")).toContainText("Grown Country");

  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  await goToHome(page);
  await page.getByRole("tab", { name: "Watch list (1)" }).click();
  await expect(page.getByRole("cell", { name: "Grown Country" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "playlist" })).toBeVisible();
  await page.getByRole("cell", { name: "Remove from watch list" }).click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();

  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );
  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(page.getByTestId("btn-sync")).toBeVisible();
});

test("Tidarr sync : Should be able to sync an artist", async ({ page }) => {
  await runSearch("https://tidal.com/browse/artist/19368", page);

  await expect(page.getByRole("main")).toContainText("Nirvana");

  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync").nth(0)).toBeVisible();

  await goToHome(page);
  await page.getByRole("tab", { name: "Watch list (1)" }).click();
  await expect(page.getByRole("cell", { name: "Nirvana" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "artist" })).toBeVisible();
  await page.getByRole("cell", { name: "Remove from watch list" }).click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();

  await runSearch("https://tidal.com/browse/artist/19368", page);
  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(
    page.locator(".MuiPaper-root").nth(1).getByTestId("btn-sync"),
  ).toBeVisible();
});

test("Tidarr sync : Should be able to sync favorite albums", async ({
  page,
}) => {
  await goToHome(page);
  await page.getByRole("tab", { name: "My Favorites" }).first().click();

  await expect(page.getByRole("main")).toContainText("My Favorite albums");

  // Click sync button for favorite albums
  await page.getByTestId("btn-sync").first().click();
  await expect(page.getByTestId("btn-disable-sync").first()).toBeVisible();

  // Go to watch list and verify
  await page.getByRole("tab", { name: "Watch list (1)" }).click();
  await expect(
    page.getByRole("cell", { name: "Favorite albums" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "favorite_albums" }),
  ).toBeVisible();

  // Remove from watch list
  await page.getByRole("cell", { name: "Remove from watch list" }).click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();

  // Verify sync button is back
  await page.getByRole("tab", { name: "My Favorites" }).first().click();
  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(page.getByTestId("btn-sync").first()).toBeVisible();
});

test("Tidarr sync : Should be able to sync favorite tracks", async ({
  page,
}) => {
  await goToHome(page);
  await page.getByRole("tab", { name: "My Favorites" }).first().click();

  await expect(page.getByRole("main")).toContainText("My Favorite tracks");

  // Click sync button for favorite tracks (second one on the page)
  await page.getByTestId("btn-sync").nth(1).click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  // Go to watch list and verify
  await page.getByRole("tab", { name: "Watch list (1)" }).click();
  await expect(
    page.getByRole("cell", { name: "Favorite tracks" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "favorite_tracks" }),
  ).toBeVisible();

  // Remove from watch list
  await page.getByRole("cell", { name: "Remove from watch list" }).click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();

  // Verify sync button is back
  await page.getByRole("tab", { name: "My Favorites" }).first().click();
  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(page.getByTestId("btn-sync").nth(1)).toBeVisible();
});

test("Tidarr sync : Should be able to sync favorite playlists", async ({
  page,
}) => {
  await goToHome(page);
  await page.getByRole("tab", { name: "My Favorites" }).first().click();

  await expect(page.getByRole("main")).toContainText("My Favorite playlists");

  // Click sync button for favorite playlists (third one on the page)
  await page.getByTestId("btn-sync").nth(2).click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  // Go to watch list and verify
  await page.getByRole("tab", { name: "Watch list (1)" }).click();
  await expect(
    page.getByRole("cell", { name: "Favorite playlists" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "favorite_playlists" }),
  ).toBeVisible();

  // Remove from watch list
  await page.getByRole("cell", { name: "Remove from watch list" }).click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();

  // Verify sync button is back
  await page.getByRole("tab", { name: "My Favorites" }).first().click();
  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(page.getByTestId("btn-sync").nth(2)).toBeVisible();
});
