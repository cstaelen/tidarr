import test, { expect, Page } from "@playwright/test";
import dotenv from "dotenv";

import { emptyProcessingList, goToHome } from "./utils/helpers";
import { mockConfigAPI } from "./utils/mock";

dotenv.config({ path: "../.env", override: false, quiet: true });

test.describe.configure({ mode: "serial" });

async function mockTiddlTomlAPI(page: Page, initialToml = "") {
  let storedToml = initialToml;

  // GET tiddl-toml
  await page.route("**/tiddl-toml", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: storedToml }),
      });
    } else if (route.request().method() === "POST") {
      // POST tiddl-toml
      const postData = route.request().postDataJSON();
      storedToml = postData.content;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Config saved" }),
      });
    }
  });
}

test("Edit Config: Should display Tiddl Config tab in settings", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await goToHome(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Tab Tidal
  await expect(page.getByRole("tab", { name: "Tidal" })).toBeVisible();
  await page.getByRole("tab", { name: "Tidal" }).click();

  // Should show "Config" tab within Tidal panel
  await expect(
    page.getByRole("button", { name: "Toggle editor" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle editor" }).click();

  // Monaco editor should be visible (check for the editor container)
  await expect(page.locator(".monaco-editor")).toBeVisible();
});

test("Edit Config: Should load existing TOML config from API", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await goToHome(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Tidal" }).click();
  await page.getByRole("button", { name: "Toggle editor" }).click();

  // Wait for Monaco editor to load
  await page.locator(".monaco-editor").waitFor();

  // Check if content is loaded in Monaco editor
  const editorText = await page
    .locator(".monaco-editor .view-lines")
    .innerText();
  expect(editorText).toContain("config.toml");
});

test("Edit Config: Should enable save button when config is modified", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockTiddlTomlAPI(page, "");

  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Tidal" }).click();
  await page.getByRole("button", { name: "Toggle editor" }).click();

  const saveButton = page.getByRole("button", { name: "Save & Reload" });
  await expect(saveButton).toBeDisabled();

  // Wait for Monaco editor to load
  await page.locator(".monaco-editor").waitFor();

  // Click in Monaco editor and type
  await page.locator(".monaco-editor .view-lines").click();
  await page.keyboard.type("[download]");

  await expect(saveButton).toBeEnabled();
});

test("Edit Config: Should save TOML config to API and persist", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockTiddlTomlAPI(page, "");

  await goToHome(page);
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Tidal" }).click();
  await page.getByRole("button", { name: "Toggle editor" }).click();

  const newToml = `[download]
track_quality = "low"`;

  // Wait for Monaco editor to load
  await page.locator(".monaco-editor").waitFor();

  // Click in Monaco editor and type
  await page.locator(".monaco-editor .view-lines").click();

  // Select all and replace
  await page.keyboard.press("Control+A");
  await page.keyboard.type(newToml);

  await expect(
    page.getByRole("button", { name: "Save & Reload" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Save & Reload" }).click();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Tidal" }).click();
  await page.getByRole("button", { name: "Toggle editor" }).click();

  await page.locator(".monaco-editor").waitFor();

  const editorText = await page
    .locator(".monaco-editor .view-lines")
    .innerText();
  expect(editorText).toContain("track_quality");
  expect(editorText).toContain("low");
});

test("Edit Config: Should display error dialog when config has errors", async ({
  page,
}) => {
  // Mock /settings endpoint with configErrors
  await page.route("**/settings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        output: "",
        parameters: {
          TIDARR_VERSION: "v2.0.0",
        },
        noToken: false,
        tiddl_config: {
          templates: {},
          download: {
            track_quality: "high",
          },
        },
        configErrors: [
          "Config file error: Cannot redefine existing key 'templates'.",
          "Config path: /home/app/standalone/shared/.tiddl/config.toml",
        ],
      }),
    });
  });

  await goToHome(page);

  // DialogConfigError should be visible
  await expect(
    page.getByRole("heading", { name: "Tiddl Configuration Error" }),
  ).toBeVisible();

  // Check error message content
  await expect(
    page.getByText("Please check your config.toml file for syntax errors."),
  ).toBeVisible();

  // Check file path
  await expect(page.getByText("shared/.tiddl/config.toml")).toHaveCount(2);

  // Check error details
  await expect(page.getByText("Error details:")).toBeVisible();
  await expect(
    page.getByText(
      "Config file error: Cannot redefine existing key 'templates'.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Config path: /home/app/standalone/shared/.tiddl/config.toml",
    ),
  ).toBeVisible();

  // Close the dialog
  await page.getByRole("button", { name: "Close" }).click();
  await expect(
    page.getByRole("heading", { name: "Tiddl Configuration Error" }),
  ).not.toBeVisible();
});
