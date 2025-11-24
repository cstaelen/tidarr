import { expect, Page } from "@playwright/test";

export async function waitForLoader(page: Page) {
  const loader = await page.getByTestId("loader")?.isVisible();
  if (loader) {
    await expect(page.getByTestId("loader")).not.toBeVisible({ timeout: 5000 });
  }
}

export async function waitForImgLoaded(page: Page) {
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.every((img) => img?.complete);
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
  await page.waitForTimeout(250);
}
