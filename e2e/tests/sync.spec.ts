import { expect, test } from "@playwright/test";

import { emptySyncList, goToHome } from "./utils/helpers";
import {
  mockConfigAPI,
  mockProcessingAPI,
  mockRelease,
  mockSyncAPI,
} from "./utils/mock";
import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await mockConfigAPI(page);
  await mockRelease(page);
  await mockProcessingAPI(page);
  await mockSyncAPI(page);
  await emptySyncList(page);
});

test.afterEach(async ({ page }) => {
  await emptySyncList(page);
});

test("Tidarr sync : Should be able to sync a playlist", async ({ page }) => {
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  await expect(page.getByRole("main")).toContainText("Grown Country");

  await page.getByTestId("btn-sync").nth(0).first().click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  await goToHome(page);
  await page.getByRole("tab", { name: "Watch list (1)" }).click();
  await expect(page.getByRole("cell", { name: "Grown Country" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "playlist" })).toBeVisible();
  await page.getByRole("button", { name: "Remove from watch list" }).click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();

  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );
  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(page.getByTestId("btn-sync").first()).toBeVisible();
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
  await page.getByRole("button", { name: "Remove from watch list" }).click();
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
  await page.getByRole("button", { name: "Remove from watch list" }).click();
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
  await page.getByRole("button", { name: "Remove from watch list" }).click();
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
  await page.getByRole("button", { name: "Remove from watch list" }).click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();

  // Verify sync button is back
  await page.getByRole("tab", { name: "My Favorites" }).first().click();
  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(page.getByTestId("btn-sync").nth(2)).toBeVisible();
});

test("Tidarr sync : Should be able to sync now an individual item", async ({
  page,
}) => {
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  await expect(page.getByRole("main")).toContainText("Grown Country");

  // Add to sync list
  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  // Go to watch list
  await goToHome(page);
  await page.getByRole("tab", { name: "Watch list (1)" }).click();
  await expect(page.getByRole("cell", { name: "Grown Country" })).toBeVisible();

  // Click the individual "Sync now" button
  await page.getByRole("button", { name: "Sync now" }).click();

  // Verify the item was added to processing list
  await page.locator(".MuiFab-circular").hover();
  await expect(
    page
      .getByLabel("Processing table")
      .getByRole("link", { name: "Grown Country" }),
  ).toBeVisible();

  // Clean up
  await page.locator("body").click();
  await page.getByRole("button", { name: "Remove from watch list" }).click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();
});

test("Tidarr sync : Should be able to sync all items at once", async ({
  page,
}) => {
  // Add first item (playlist)
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );
  await expect(page.getByRole("main")).toContainText("Grown Country");
  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  // Add second item (artist)
  await runSearch("https://tidal.com/browse/artist/19368", page);
  await expect(page.getByRole("main")).toContainText("Nirvana");
  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync").nth(0)).toBeVisible();

  // Go to watch list
  await goToHome(page);
  await page.getByRole("tab", { name: "Watch list (2)" }).click();
  await expect(page.getByRole("cell", { name: "Grown Country" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Nirvana" })).toBeVisible();

  // Click the "Sync all now" button
  await page.getByRole("button", { name: "Sync all now" }).click();

  // Wait for processing to update
  await page.waitForTimeout(500);

  // Verify both items were added to processing list
  await page.locator(".MuiFab-circular").hover();
  await expect(
    page
      .getByLabel("Processing table")
      .getByRole("link", { name: "Grown Country" }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Processing table")
      .getByRole("link", { name: "All albums" }),
  ).toBeVisible();

  // Clean up - remove both items
  await page.locator("body").click();
  await page
    .getByRole("button", { name: "Remove from watch list" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Remove from watch list" })
    .first()
    .click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();
});

test("Tidarr sync : Should be able to remove all items from watch list", async ({
  page,
}) => {
  // Add first item (playlist)
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );
  await expect(page.getByRole("main")).toContainText("Grown Country");
  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  // Add second item (artist)
  await runSearch("https://tidal.com/browse/artist/19368", page);
  await expect(page.getByRole("main")).toContainText("Nirvana");
  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync").nth(0)).toBeVisible();

  // Go to watch list
  await goToHome(page);
  await page.getByRole("tab", { name: "Watch list (2)" }).click();
  await expect(page.getByRole("cell", { name: "Grown Country" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Nirvana" })).toBeVisible();

  // Click the "Remove all" button and accept confirmation
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove all" }).click();

  // Verify the API was called
  await page.waitForTimeout(500);

  // Verify all items were removed
  await expect(page.getByText("No item in watch list.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Watch list" })).toBeVisible();
});

test("Tidarr sync : Should cancel remove all when user declines confirmation", async ({
  page,
}) => {
  // Add first item (playlist)
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );
  await expect(page.getByRole("main")).toContainText("Grown Country");
  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  // Add second item (artist)
  await runSearch("https://tidal.com/browse/artist/19368", page);
  await expect(page.getByRole("main")).toContainText("Nirvana");
  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync").nth(0)).toBeVisible();

  // Go to watch list
  await goToHome(page);
  await page.getByRole("tab", { name: "Watch list (2)" }).click();
  await expect(page.getByRole("cell", { name: "Grown Country" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Nirvana" })).toBeVisible();

  // Click the "Remove all" button and decline confirmation
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Remove all" }).click();

  // Verify the API was NOT called
  await page.waitForTimeout(500);

  // Verify items are still in the list
  await expect(page.getByRole("cell", { name: "Grown Country" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Nirvana" })).toBeVisible();

  // Clean up - remove both items manually
  await page
    .getByRole("button", { name: "Remove from watch list" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Remove from watch list" })
    .first()
    .click();
  await expect(page.getByText("No item in watch list.")).toBeVisible();
});
