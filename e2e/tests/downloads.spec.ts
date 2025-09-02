import { expect, test } from "@playwright/test";

import mockHome from "./mocks/home.json";
import mockSearch from "./mocks/search.json";
import {
  emptyProcessingList,
  goToHome,
  testProcessingList,
} from "./utils/helpers";
import { mockConfigAPI } from "./utils/mock";
import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ browserName }) => {
  test.skip(browserName.toLowerCase() !== "chromium", `Test only for chromium`);
});

test.afterEach(async ({ page }) => {
  await emptyProcessingList(page);
});

test("Tidarr download : Should be able to download album", async ({ page }) => {
  await page.route("**/home", async (route) => {
    await route.fulfill({ json: mockHome });
  });
  await page.route("**/search", async (route) => {
    await route.fulfill({ json: mockSearch });
  });
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();

  await expect(page.getByRole("main")).toContainText("Nevermind");
  await page
    .locator(
      "div:nth-child(2) > .MuiPaper-root > div:nth-child(2) > .MuiBox-root > .MuiCardContent-root > .MuiButtonBase-root",
    )
    .click();

  await testProcessingList(page, ["Nirvana", "In Utero", "album"], "high");
});

test("Tidarr download : Should be able to download track", async ({ page }) => {
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Tracks" }).first().click();

  await expect(page.getByRole("main")).toContainText(
    "Smells Like Teen Spiritlossless5 min.NirvanaAlbum : NevermindAlbumTrack",
  );

  // Test other quality
  await page
    .getByRole("button", {
      name: "Download format: '.m4a' files, 96 kbps",
    })
    .click();

  await page.getByRole("button", { name: "Track" }).nth(0).click();

  await testProcessingList(
    page,
    ["Nirvana", "Smells Like Teen Spirit", "track"],
    "low",
  );
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

  await testProcessingList(
    page,
    ["Nirvana", "MTV Unplugged In New York", "album"],
    "high",
  );
});

test("Tidarr download : Should be able to download playlist", async ({
  page,
}) => {
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  await expect(page.getByRole("main")).toContainText("Grown Country");

  await page.getByRole("button", { name: "Get playlist" }).click();

  await testProcessingList(page, ["playlist", "Grown Country"], "high");
});

test("Tidarr download : Should be able to download discography", async ({
  page,
}) => {
  await runSearch("https://listen.tidal.com/artist/19368", page);

  await page.getByRole("button", { name: "Get all releases" }).click();

  await testProcessingList(page, ["All albums", "Nirvana", "artist"], "high");
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

test("Tidarr download : Should be able to download mix", async ({ page }) => {
  await mockConfigAPI(page);
  await goToHome(page);
  await page.getByRole("tab", { name: "My Mixes" }).first().click();

  await expect(page.getByRole("main")).toContainText("My Daily Discovery");
  await page.getByRole("button", { name: "Get mix" }).first().click();

  await testProcessingList(page, ["My Daily Discovery", "high", "mix"]);
});
