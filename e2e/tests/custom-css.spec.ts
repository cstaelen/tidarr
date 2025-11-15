import test, { expect, Page } from "@playwright/test";
import dotenv from "dotenv";

import { emptyProcessingList, goToHome } from "./utils/helpers";
import { mockConfigAPI } from "./utils/mock";

dotenv.config({ path: "../.env", override: false, quiet: true });

async function mockCustomCSSAPI(page: Page, initialCSS = "") {
  let storedCSS = initialCSS;

  // GET custom-css
  await page.route("**/custom-css", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ css: storedCSS }),
      });
    } else if (route.request().method() === "POST") {
      // POST custom-css
      const postData = route.request().postDataJSON();
      storedCSS = postData.css;
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
  await mockCustomCSSAPI(page);

  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Tab Custom CSS
  await expect(page.getByRole("tab", { name: "Custom CSS" })).toBeVisible();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  await expect(
    page.getByPlaceholder("/* Add your custom CSS here */"),
  ).toBeVisible();
});

test("Custom CSS: Should load existing CSS from API", async ({ page }) => {
  await mockConfigAPI(page);
  const existingCSS = "body { background-color: red; }";
  await mockCustomCSSAPI(page, existingCSS);

  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  const textarea = page.getByPlaceholder("/* Add your custom CSS here */");
  await expect(textarea).toHaveValue(existingCSS);
});

test("Custom CSS: Should enable save button when CSS is modified", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockCustomCSSAPI(page, "");

  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  const saveButton = page.getByRole("button", { name: "Save & Reload" });
  await expect(saveButton).toBeDisabled();

  const textarea = page.getByPlaceholder("/* Add your custom CSS here */");
  await textarea.fill("body { color: blue; }");

  await expect(saveButton).toBeEnabled();
});

test("Custom CSS: Should save CSS to API and persist", async ({ page }) => {
  await mockConfigAPI(page);
  await mockCustomCSSAPI(page, "");

  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  const newCSS = "h1 { font-size: 32px; }";
  const textarea = page.getByPlaceholder("/* Add your custom CSS here */");
  await textarea.fill(newCSS);

  // Wait for the navigation after save

  await expect(
    page.getByRole("button", { name: "Save & Reload" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Save & Reload" }).click();

  // After reload, verify the CSS is still there
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  await expect(textarea).toHaveValue(newCSS);
});
