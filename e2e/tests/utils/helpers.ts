import { expect, Page } from "@playwright/test";

import { mockTidalQueries } from "./mock";

export async function waitForLoader(page: Page) {
  const loader = await page.getByTestId("loader")?.isVisible();
  if (loader) {
    await expect(page.getByTestId("loader")).not.toBeVisible({ timeout: 5000 });
  }
}

export async function waitForImgLoaded(page: Page) {
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.every((img) => img.complete);
  });
}

export async function testProcessingList(page: Page, shouldContains: string[]) {
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  shouldContains.map(async (searchString: string) => {
    await expect(page.getByLabel("Processing table")).toContainText(
      searchString,
    );
  });

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
  await page.getByRole("button", { name: "Close" }).click();
}

export async function emptyProcessingList(page: Page) {
  const isVisible = await page.locator("button.MuiFab-circular").isVisible();

  if (!isVisible || page.isClosed()) return null;

  // await page.locator("button.MuiFab-circular").click();
  const items = await page.locator("#Showprocessinglist-action-1 tbody tr");

  const firstButton = await items.getByRole("button").first();

  if (!firstButton || !firstButton.isVisible()) return null;

  await firstButton?.click();
  await expect(page.locator("button.MuiFab-circular")).not.toBeVisible();
}

export async function goToHome(page: Page) {
  mockTidalQueries(page);
  await page.goto("/");
  // await page.waitForLoadState("networkidle");
  await page.evaluateHandle("document.fonts.ready");
}
