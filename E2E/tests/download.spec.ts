import { test, expect } from "@playwright/test";
import { mockAPI } from "./utils/mock";

test("Download items", async ({ page }) => {
  mockAPI(page);
  await page.goto("/");

  await page.getByTestId("search-input").click();
  await page.getByTestId("search-input").fill("Nirvana");
  await page.getByTestId("search-input").press("Enter");
  await page.getByRole("button", { name: "Show discography" }).first().click();
  await expect(
    page
      .locator(
        "div:nth-child(5) > .MuiPaper-root > div:nth-child(2) > .MuiBox-root > .MuiCardContent-root > .MuiButtonBase-root",
      )
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Nevermind by Nirvana");
  await expect(page.getByRole("main")).toContainText(
    "hi_res13 tracks49 min1991",
  );
  await page
    .locator(
      "div:nth-child(5) > .MuiPaper-root > div:nth-child(2) > .MuiBox-root > .MuiCardContent-root > .MuiButtonBase-root",
    )
    .first()
    .click();
  await page.locator("button.MuiFab-circular").first().hover();

  await expect(page.getByLabel("Show processing list")).toBeVisible();
  await expect(page.locator("tbody")).toContainText("processing");
  await expect(page.locator("tbody")).toContainText("Nevermind");
  await expect(page.locator("tbody")).toContainText("Nirvana");
  await expect(
    page.getByLabel("Processing table").getByRole("link"),
  ).toContainText("Nevermind");
  await expect(page.locator("tbody")).toContainText("album");

  await expect(
    page.getByLabel("Processing table").getByRole("button").first(),
  ).toBeVisible();
  await expect(
    page.getByLabel("Processing table").locator("div").getByRole("button"),
  ).toBeVisible();

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

  await expect(page.getByLabel("Show processing list")).not.toBeVisible();
});
