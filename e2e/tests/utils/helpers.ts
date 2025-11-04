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

  shouldContains.map(async (searchString: string) => {
    await expect(page.getByLabel("Processing table")).toContainText(
      searchString,
    );
  });

  if (quality) {
    await expect(page.getByLabel("Processing table")).toContainText(quality);
  }

  await expect(page.locator(".MuiDialog-container button")).not.toBeVisible();

  await page.getByTestId("btn-console").click();

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
  await page.getByRole("button", { name: "Close" }).click();
  await emptyProcessingList(page);
}

export async function emptyProcessingList(page: Page) {
  const isVisible = await page.locator("button.MuiFab-circular").isVisible();

  if (!isVisible || page.isClosed()) return null;

  await page.locator("button.MuiFab-circular").hover();

  const items = await page
    .locator("#Showprocessinglist-action-1 tbody tr")
    .all();
  for (const item of items) {
    if (page.isClosed()) break;

    const firstButton = item.getByRole("button").first();
    if (!page.isClosed()) {
      await firstButton?.click();
    }
    return;
  }

  await expect(page.locator("button.MuiFab-circular")).not.toBeVisible();
}

export async function goToHome(page: Page) {
  await mockTidalQueries(page);
  await page.goto("/");
}
