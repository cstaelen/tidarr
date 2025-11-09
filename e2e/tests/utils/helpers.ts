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

export async function testProcessingList(
  page: Page,
  shouldContains: string[],
  quality?: string,
) {
  await expect(page.locator("button.MuiFab-circular")).toBeVisible();
  await page.locator("button.MuiFab-circular").click();

  // Wait for the table to be visible
  await page.waitForSelector('[aria-label="Processing table"]', {
    state: "visible",
    timeout: 5000,
  });

  // Fix: Use for...of instead of .map() to properly await async operations
  for (const searchString of shouldContains) {
    await expect(page.getByLabel("Processing table")).toContainText(
      searchString,
    );
  }

  if (quality) {
    await expect(page.getByLabel("Processing table")).toContainText(quality);
  }

  await expect(page.locator(".MuiDialog-container button")).not.toBeVisible();

  await page.getByTestId("btn-console").first().click();

  await expect(
    page.getByRole("heading", { name: "Console output" }),
  ).toBeVisible();

  if (shouldContains.includes("mix")) {
    await expect(page.getByText("Mix: create new playlist")).toBeVisible();
  } else {
    await expect(page.getByText("=== Tiddl ===")).toBeVisible();
  }

  if (quality) {
    await expect(page.getByText(`-q ${quality}`)).toBeVisible();
  }

  // await page.getByRole("button", { name: "close" }).first().click();
  await page.locator(".MuiDialog-container button").first().click();
}

export async function emptyProcessingList(page: Page) {
  const isVisible = await page.locator("button.MuiFab-circular").isVisible();

  if (!isVisible) return null;

  // Open the processing list if not already open
  const isExpanded = await page
    .locator("button.MuiFab-circular")
    .getAttribute("aria-expanded");
  if (isExpanded !== "true") {
    await page.locator("button.MuiFab-circular").click();
    // Wait for the table to be visible
    await page.waitForSelector('[aria-label="Processing table"]', {
      state: "visible",
      timeout: 5000,
    });
  }

  await page.waitForTimeout(250);
  const clearButton = await page.getByRole("button", {
    name: "Clear finished",
  });
  const isClearButtonVisible = await clearButton.isVisible();
  const isPageClosed = page.isClosed();
  if (!isPageClosed && isClearButtonVisible) await clearButton.click();
  await page.waitForTimeout(250);
}

export async function emptySyncList(page: Page) {
  // Call the API to clear all sync items
  await page.request.post("http://localhost:8484/api/sync/remove-all");
  await page.waitForTimeout(250);
}

export async function goToHome(page: Page) {
  await mockTidalQueries(page);
  await page.goto("/");
}
