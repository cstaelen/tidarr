import { expect, test } from "@playwright/test";

import mockHome from "./mocks/home.json";
import mockSearch from "./mocks/search.json";
import {
  emptyProcessingList,
  goToHome,
  testProcessingList,
} from "./utils/helpers";
import { mockConfigAPI, mockItemOutputSSE } from "./utils/mock";
import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

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
  await mockItemOutputSSE(page, "high");

  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();

  await expect(page.getByRole("main")).toContainText("Nevermind");
  await page
    .locator("div:nth-child(2) > .MuiPaper-root > div:nth-child(2)")
    .getByTestId("btn-dl")
    .click();

  await testProcessingList(page, ["Nirvana", "In Utero", "album"], "high");
});

test("Tidarr download : Should be able to download track", async ({ page }) => {
  await mockItemOutputSSE(page, "low");
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Tracks" }).first().click();

  await expect(page.getByRole("main")).toContainText(
    "Smells Like Teen Spirit5 min.NirvanaAlbum : NevermindAlbumTrack",
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
  await mockItemOutputSSE(page, "high");
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Tracks" }).first().click();

  await expect(page.getByRole("main")).toContainText(
    "MTV Unplugged In New York",
  );

  await page.getByTestId("btn-dl").nth(8).click();

  await testProcessingList(
    page,
    ["Nirvana", "MTV Unplugged In New York", "album"],
    "high",
  );
});

test("Tidarr download : Should be able to download playlist", async ({
  page,
}) => {
  await mockItemOutputSSE(page, "high");
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  await expect(page.getByRole("main")).toContainText("Grown Country");

  await page.getByTestId("btn-dl").nth(0).click();

  await testProcessingList(page, ["playlist", "Grown Country"], "high");
});

test("Tidarr download : Should be able to download discography", async ({
  page,
}) => {
  await mockItemOutputSSE(page, "high");
  await runSearch("https://listen.tidal.com/artist/19368", page);

  await page.getByRole("button", { name: "Get all releases" }).click();

  await testProcessingList(page, ["All albums", "Nirvana", "artist"], "high");
});

test("Tidarr download : Should be able to download all artist videos", async ({
  page,
}) => {
  await mockItemOutputSSE(page, "high");
  await runSearch("https://listen.tidal.com/artist/19368", page);

  await page.getByRole("button", { name: "Get all videos" }).click();

  await testProcessingList(
    page,
    ["All artist videos", "Nirvana", "artist_videos"],
    "high",
  );
});

test("Tidarr download : Should be able to download video", async ({ page }) => {
  await mockItemOutputSSE(page);
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
  // Mock mix output with special message
  await page.route("**/stream_item_output/*", async (route) => {
    const itemId = route.request().url().split("/").pop();
    const mockOutput = `Mix: get track from mix id\r\nMix: create new playlist\r\nMix: add track ids to new playlist\r\nMix: download playlist\r\n=== Tiddl ===\r\nExecuting: tiddl url download -q high`;

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: `data: ${JSON.stringify({ id: itemId, output: mockOutput })}\n\n`,
    });
  });

  await mockConfigAPI(page);
  await goToHome(page);
  await page.getByRole("tab", { name: "My Mixes" }).first().click();

  await expect(page.getByRole("main")).toContainText("My Daily Discovery");
  await page.getByRole("button", { name: "Get mix" }).first().click();

  await testProcessingList(page, ["My Daily Discovery", "high", "mix"]);
});

// test("Tidarr download : Should be able to download favorite albums", async ({
//   page,
// }) => {
//   // Mock favorite albums output
//   await page.route("**/stream_item_output/*", async (route) => {
//     const itemId = route.request().url().split("/").pop();
//     const mockOutput = `=== Tiddl ===\r\nExecuting: tiddl fav -r album download -q high`;

//     await route.fulfill({
//       status: 200,
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//       },
//       body: `data: ${JSON.stringify({ id: itemId, output: mockOutput })}\n\n`,
//     });
//   });

//   await mockConfigAPI(page);
//   await goToHome(page);
//   await page.getByRole("tab", { name: "My Favorites" }).first().click();

//   await expect(page.getByRole("main")).toContainText("My Favorite albums");
//   await page.getByRole("button", { name: "Favorite albums" }).first().click();

//   await testProcessingList(page, [
//     "Favorite albums",
//     "favorite_albums",
//     "high",
//   ]);
// });

// test("Tidarr download : Should be able to download favorite tracks", async ({
//   page,
// }) => {
//   // Mock favorite tracks output
//   await page.route("**/stream_item_output/*", async (route) => {
//     const itemId = route.request().url().split("/").pop();
//     const mockOutput = `=== Tiddl ===\r\nExecuting: tiddl fav -r track download -q high`;

//     await route.fulfill({
//       status: 200,
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//       },
//       body: `data: ${JSON.stringify({ id: itemId, output: mockOutput })}\n\n`,
//     });
//   });

//   await mockConfigAPI(page);
//   await goToHome(page);
//   await page.getByRole("tab", { name: "My Favorites" }).first().click();

//   await expect(page.getByRole("main")).toContainText("My Favorite tracks");
//   await page.getByRole("button", { name: "Favorite tracks" }).first().click();

//   await testProcessingList(page, [
//     "Favorite tracks",
//     "favorite_tracks",
//     "high",
//   ]);
// });

// test("Tidarr download : Should be able to download favorite playlists", async ({
//   page,
// }) => {
//   // Mock favorite playlists output
//   await page.route("**/stream_item_output/*", async (route) => {
//     const itemId = route.request().url().split("/").pop();
//     const mockOutput = `=== Tiddl ===\r\nExecuting: tiddl fav -r playlist download -q high`;

//     await route.fulfill({
//       status: 200,
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//       },
//       body: `data: ${JSON.stringify({ id: itemId, output: mockOutput })}\n\n`,
//     });
//   });

//   await mockConfigAPI(page);
//   await goToHome(page);
//   await page.getByRole("tab", { name: "My Favorites" }).first().click();

//   await expect(page.getByRole("main")).toContainText("My Favorite playlists");
//   await page
//     .getByRole("button", { name: "Favorite playlists" })
//     .first()
//     .click();

//   await testProcessingList(page, [
//     "Favorite playlists",
//     "favorite_playlists",
//     "high",
//   ]);
// });

test("Tidarr download : Should be able to clear finished items", async ({
  page,
}) => {
  // Mock API endpoints
  await mockItemOutputSSE(page, "high");
  let removeFinishedCalled = false;
  await page.route("**/remove_finished", async (route) => {
    removeFinishedCalled = true;
    await route.fulfill({ status: 204 });
  });

  // Add multiple items to processing list
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();

  // Download first album
  await page
    .locator("div:nth-child(2) > .MuiPaper-root > div:nth-child(2)")
    .getByTestId("btn-dl")
    .click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Verify item is in the list
  await expect(page.getByLabel("Processing table")).toContainText("In Utero");

  // Mock the item as finished by simulating the status
  await page.route("**/stream_processing", async (route) => {
    const mockData = [
      {
        id: "123",
        title: "In Utero",
        artist: "Nirvana",
        type: "album",
        quality: "high",
        status: "finished",
        loading: false,
      },
    ];
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

  // Wait a bit for the mock to take effect
  await page.waitForTimeout(500);

  // Click "Clear finished" button
  await page.getByRole("button", { name: "Clear finished" }).click();

  // Verify the API was called
  await page.waitForTimeout(500);
  expect(removeFinishedCalled).toBe(true);

  // Clean up
  await page.route("**/stream_processing", (route) => route.continue());
  await emptyProcessingList(page);
});

test("Tidarr download : Should be able to clear all items with confirmation", async ({
  page,
}) => {
  // Mock API endpoints
  await mockItemOutputSSE(page, "high");
  let removeAllCalled = false;
  await page.route("**/remove_all", async (route) => {
    removeAllCalled = true;
    await route.fulfill({ status: 204 });
  });

  // Add items to processing list
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();

  // Download an album
  await page.getByRole("button", { name: "Get album" }).nth(2).click();

  // Open processing list
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Verify item is in the list
  await expect(page.getByLabel("Processing table")).toContainText("In Utero");

  // Setup confirmation dialog handler - dismiss first
  page.once("dialog", (dialog) => {
    expect(dialog.message()).toContain(
      "Are you sure you want to clear all items from the queue?",
    );
    dialog.dismiss();
  });

  // Click "Clear all" button - should not remove because we dismissed
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Clear all" }).click();

  // Wait and verify API was NOT called
  await page.waitForTimeout(500);
  expect(removeAllCalled).toBe(false);

  // Now accept the confirmation
  page.once("dialog", (dialog) => {
    expect(dialog.message()).toContain(
      "Are you sure you want to clear all items from the queue?",
    );
    dialog.accept();
  });

  // Click "Clear all" again
  await page.getByRole("button", { name: "Clear all" }).click();

  // Verify the API was called this time
  await page.waitForTimeout(500);
  expect(removeAllCalled).toBe(true);
});
