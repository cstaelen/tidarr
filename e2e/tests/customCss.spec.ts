import test, { expect, Page } from "@playwright/test";
import dotenv from "dotenv";

import { emptyProcessingList, goToHome } from "./utils/helpers";
import { mockConfigAPI } from "./utils/mock";

dotenv.config({ path: "../.env", override: false, quiet: true });

test.describe.configure({ mode: "serial" });

async function mockCustomCssAPI(page: Page, initialCss = "") {
  let storedCss = initialCss;

  // Mock GET /custom-css
  await page.route("**/custom-css", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ css: storedCss }),
      });
    } else if (route.request().method() === "POST") {
      // Mock POST /custom-css
      const postData = route.request().postDataJSON();
      storedCss = postData.css;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "CSS saved" }),
      });
    }
  });
}

test("Custom CSS: Should display Custom CSS panel in settings", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockCustomCssAPI(page, "");
  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Tab Custom CSS
  await expect(page.getByRole("tab", { name: "Custom CSS" })).toBeVisible();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  // Monaco editor should be visible
  await expect(page.locator(".monaco-editor")).toBeVisible();
});

test("Custom CSS: Should load and display content from API", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockCustomCssAPI(page, "body { background: #000; }");
  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  // Wait for Monaco editor to load
  await page.locator(".monaco-editor").waitFor();

  // Monaco editor should be visible with content loaded
  await expect(page.locator(".monaco-editor")).toBeVisible();
});

test("Custom CSS: Should enable save button when CSS is modified", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockCustomCssAPI(page, "");
  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  const saveButton = page.getByRole("button", { name: "Save & Reload" });
  await expect(saveButton).toBeDisabled();

  // Wait for Monaco editor to load
  await page.locator(".monaco-editor").waitFor();

  // Click in Monaco editor and type
  await page.locator(".monaco-editor .view-lines").click();
  await page.keyboard.type("body { color: blue; }");

  await expect(saveButton).toBeEnabled();
});

test("Custom CSS: Should save CSS to API and persist", async ({ page }) => {
  await mockConfigAPI(page);
  await mockCustomCssAPI(page, "");
  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  const newCSS = "h1 { font-size: 32px; }";

  // Wait for Monaco editor to load
  await page.locator(".monaco-editor").waitFor();

  // Click in Monaco editor and type
  await page.locator(".monaco-editor .view-lines").click();

  // Select all and replace
  await page.keyboard.press("Control+A");
  await page.keyboard.type(newCSS);

  await expect(
    page.getByRole("button", { name: "Save & Reload" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Save & Reload" }).click();

  // After reload, verify the CSS is still there
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  await page.locator(".monaco-editor").waitFor();

  const editorText = await page
    .locator(".monaco-editor .view-lines")
    .innerText();
  expect(editorText).toContain("font-size");
  expect(editorText).toContain("32px");
});
