import { expect, test } from "@playwright/test";

import { emptyProcessingList, testProcessingList } from "./utils/helpers";
import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ browserName }) => {
  test.skip(browserName.toLowerCase() !== "chromium", `Test only for chromium`);
});

test.afterEach(async ({ page }) => {
  await emptyProcessingList(page);
});

test("Tidarr download : Should be able to download album", async ({ page }) => {
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();

  await expect(page.getByRole("main")).toContainText("Nevermind");
  await page
    .locator(
      "div:nth-child(2) > .MuiPaper-root > div:nth-child(2) > .MuiBox-root > .MuiCardContent-root > .MuiButtonBase-root",
    )
    .click();

  await testProcessingList(page, ["Nirvana", "In Utero", "album"]);
});

test("Tidarr download : Should be able to download track", async ({ page }) => {
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Tracks" }).first().click();

  await expect(page.getByRole("main")).toContainText(
    "Smells Like Teen Spiritlossless5 min.NirvanaAlbum : NevermindAlbumTrack",
  );

  await page.getByRole("button", { name: "Track" }).nth(0).click();

  await testProcessingList(page, [
    "Nirvana",
    "Smells Like Teen Spirit",
    "track",
  ]);
});

test("Tidarr download : Should be able to download track album", async ({
  page,
}) => {
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Tracks" }).first().click();

  await expect(page.getByRole("main")).toContainText(
    "MTV Unplugged In New York",
  );

  await page.getByRole("button", { name: "Album", exact: true }).nth(4).click();

  await testProcessingList(page, [
    "Nirvana",
    "MTV Unplugged In New York",
    "album",
  ]);
});

test("Tidarr download : Should be able to download playlist", async ({
  page,
}) => {
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  // Quality filter should have no impact
  await page.getByRole("button", { name: "Lossless" }).click();

  await expect(page.getByRole("main")).toContainText("Grown Country");

  await page.getByRole("button", { name: "Get playlist" }).click();

  await testProcessingList(page, ["playlist", "Grown Country"]);
});

test("Tidarr download : Should be able to download discography", async ({
  page,
}) => {
  await runSearch("https://listen.tidal.com/artist/17713", page);

  await page.getByRole("button", { name: "Get all releases" }).click();

  await testProcessingList(page, ["All albums", "Pennywise", "artist"]);
});

test("Tidarr download : Should be able to download video", async ({ page }) => {
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Videos" }).first().click();

  await expect(page.getByRole("main")).toContainText("Smells Like Teen Spirit");
  await page.getByRole("button", { name: "Get video" }).first().click();

  await testProcessingList(page, [
    "Nirvana",
    "Smells Like Teen Spirit",
    "video",
  ]);
});
