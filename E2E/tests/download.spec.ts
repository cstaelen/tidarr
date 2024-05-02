import { test, expect, Page } from "@playwright/test";
import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

async function testProcessingList(page: Page) {
  await page.locator("button.MuiFab-circular").first().click();
  await expect(page.getByLabel("Processing table")).toHaveScreenshot({
    maxDiffPixels: 10,
  });

  await expect(page.locator(".MuiDialog-container button")).not.toBeVisible();
  await page
    .getByLabel("Processing table")
    .locator("div")
    .getByRole("button")
    .click();
  await expect(
    page.getByRole("heading", { name: "Console output" }),
  ).toBeVisible();
  await expect(page.locator(".MuiDialog-container button")).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();

  await page.getByLabel("Processing table").getByRole("button").first().click();
  await page.waitForTimeout(500);
  await expect(page.getByLabel("Show processing list")).not.toBeVisible();
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

  await page
    .locator(
      "div:nth-child(5) > .MuiPaper-root > div:nth-child(2) > .MuiBox-root > .MuiCardContent-root > div:nth-child(2) > button:nth-child(2)",
    )
    .click();

  await testProcessingList(page);
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

  await page
    .locator(
      ".MuiGrid-item .MuiBox-root > .MuiCardContent-root > .MuiButtonBase-root",
    )
    .click();

  await testProcessingList(page);
});
