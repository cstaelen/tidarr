import { expect } from "@playwright/test";

import { test } from "../test-isolation";

const makeSyncItem = (
  id: string,
  title: string,
  artist: string,
  type = "album",
) => ({
  id,
  title,
  artist,
  type,
  quality: "high",
  status: "finished",
  loading: false,
});

async function goToWatchList(page: Parameters<typeof test>[1]["page"]) {
  await page.goto("/processing");
  await page.getByRole("tab", { name: /Watch list/ }).click();
  await page.waitForSelector('[aria-label="synced playlist table"]', {
    state: "visible",
    timeout: 5000,
  });
}

test("WatchList: Should filter items by keyword on title and artist", async ({
  page,
}) => {
  const items = [
    makeSyncItem("1", "Nevermind", "Nirvana"),
    makeSyncItem("2", "In Utero", "Nirvana"),
    makeSyncItem("3", "OK Computer", "Radiohead"),
  ];

  await page.route("**/sync/list", async (route) => {
    await route.fulfill({ status: 200, json: items });
  });

  await goToWatchList(page);

  const table = page.getByLabel("synced playlist table");

  // All items visible initially
  await expect(table).toContainText("Nevermind");
  await expect(table).toContainText("In Utero");
  await expect(table).toContainText("OK Computer");

  // Filter by title
  await page.getByPlaceholder("Filter by title or artist…").fill("Nevermind");
  await expect(table).toContainText("Nevermind");
  await expect(table).not.toContainText("In Utero");
  await expect(table).not.toContainText("OK Computer");

  // Filter by artist
  await page.getByPlaceholder("Filter by title or artist…").fill("Nirvana");
  await expect(table).toContainText("Nevermind");
  await expect(table).toContainText("In Utero");
  await expect(table).not.toContainText("OK Computer");

  // Clear filter restores all items
  await page.getByPlaceholder("Filter by title or artist…").fill("");
  await expect(table).toContainText("OK Computer");
});

test("WatchList: Should sort items by column on click", async ({ page }) => {
  const items = [
    makeSyncItem("1", "Ziggy", "Bowie", "album"),
    makeSyncItem("2", "Abbey Road", "Beatles", "playlist"),
    makeSyncItem("3", "Nevermind", "Nirvana", "album"),
  ];

  await page.route("**/sync/list", async (route) => {
    await route.fulfill({ status: 200, json: items });
  });

  await goToWatchList(page);

  const table = page.getByLabel("synced playlist table");
  const rows = table.getByRole("row");

  // Default sort: title asc → Abbey Road, Nevermind, Ziggy
  await expect(rows.nth(1)).toContainText("Abbey Road");
  await expect(rows.nth(2)).toContainText("Nevermind");
  await expect(rows.nth(3)).toContainText("Ziggy");

  // Click Title → desc
  await page.getByRole("columnheader", { name: "Title" }).click();
  await expect(rows.nth(1)).toContainText("Ziggy");
  await expect(rows.nth(3)).toContainText("Abbey Road");

  // Click Artist → asc
  await page.getByRole("columnheader", { name: "Artist" }).click();
  await expect(rows.nth(1)).toContainText("Beatles");
  await expect(rows.nth(2)).toContainText("Bowie");
  await expect(rows.nth(3)).toContainText("Nirvana");

  // Click Artist again → desc
  await page.getByRole("columnheader", { name: "Artist" }).click();
  await expect(rows.nth(1)).toContainText("Nirvana");
  await expect(rows.nth(3)).toContainText("Beatles");

  // Click Type → asc (album, album, playlist)
  await page.getByRole("columnheader", { name: "Type" }).click();
  await expect(rows.nth(3)).toContainText("playlist");
});

test("WatchList: Should paginate with show more button when list exceeds 50 items", async ({
  page,
}) => {
  const items = Array.from({ length: 60 }, (_, i) =>
    makeSyncItem(String(i + 1), `Album ${i + 1}`, "Artist"),
  );

  await page.route("**/sync/list", async (route) => {
    await route.fulfill({ status: 200, json: items });
  });

  await goToWatchList(page);

  const table = page.getByLabel("synced playlist table");

  // Sorted asc by title: "Album 1" comes first, but "Album 10" before "Album 2" (lexicographic)
  // Just verify first 50 are shown and last 10 are not
  await expect(table).toContainText("Album 1");
  await expect(
    page.getByRole("button", { name: /Show more \(10 remaining\)/ }),
  ).toBeVisible();

  // Items 51-60 not yet visible
  const allCells = await table.getByRole("cell").allTextContents();
  const titles = allCells.filter((t) => t.startsWith("Album "));
  expect(titles).toHaveLength(50);

  // Click show more
  await page
    .getByRole("button", { name: /Show more \(10 remaining\)/ })
    .click();

  const allCellsAfter = await table.getByRole("cell").allTextContents();
  const titlesAfter = allCellsAfter.filter((t) => t.startsWith("Album "));
  expect(titlesAfter).toHaveLength(60);

  await expect(
    page.getByRole("button", { name: /Show more/ }),
  ).not.toBeVisible();
});
