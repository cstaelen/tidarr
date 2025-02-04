import { expect, Page, test } from "@playwright/test";

import { emptyProcessingList } from "./utils/helpers";
import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

async function testProcessingList(page: Page) {
  await page.locator("button.MuiFab-circular").first().hover();

  await expect(page.getByLabel("Processing table")).toHaveScreenshot();

  await expect(page.locator(".MuiDialog-container button")).not.toBeVisible();
  await page
    .getByLabel("Processing table")
    .locator("div")
    .getByRole("button")
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Console output" }),
  ).toBeVisible();
  await expect(page.getByText("=== Tiddl ===")).toBeVisible();
  await expect(page.locator(".MuiDialog-container button")).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();

  await emptyProcessingList(page);

  await expect(
    page.getByLabel("Processing table").getByRole("button").first(),
  ).not.toBeVisible();

  await expect(
    page.getByLabel("Processing table").getByRole("button").first(),
  ).not.toBeVisible();
}

test("Tidarr download : Should be able to download album", async ({ page }) => {
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Albums" }).first().click();

  await expect(page.getByRole("main")).toContainText(
    "MTV Unplugged In New York",
  );
  await page
    .locator(
      "div:nth-child(2) > .MuiPaper-root > div:nth-child(2) > .MuiBox-root > .MuiCardContent-root > .MuiButtonBase-root",
    )
    .click();

  await testProcessingList(page);
});

test("Tidarr download : Should be able to download track", async ({ page }) => {
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Tracks" }).first().click();

  await expect(page.getByRole("main")).toContainText("Come As You Are");

  await page.getByRole("button", { name: "Track" }).nth(3).click();

  await testProcessingList(page);
});

test("Tidarr download : Should be able to download track album", async ({
  page,
}) => {
  await runSearch("Nirvana", page);
  await page.getByRole("tab", { name: "Tracks" }).first().click();

  await expect(page.getByRole("main")).toContainText("Come As You Are");

  await page.getByRole("button", { name: "Album", exact: true }).nth(4).click();

  await testProcessingList(page);
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

  await testProcessingList(page);
});
