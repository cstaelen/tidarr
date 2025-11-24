import { expect } from "@playwright/test";
import dotenv from "dotenv";

import { test } from "../test-isolation";

import { mockConfigAPI } from "./utils/mock";

dotenv.config({ path: "../.env", override: false, quiet: true });

test("Edit Config: Should display Tiddl Config tab in settings", async ({
  page,
}) => {
  await page.goto("/");

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
  await page.goto("/");

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Tidal" }).click();
  await page.getByRole("button", { name: "Toggle editor" }).click();

  // Wait for Monaco editor to load
  await page.locator(".monaco-editor").waitFor();

  // Check if content is loaded in Monaco editor
  const editorText = await page
    .locator(".monaco-editor .view-lines")
    .innerText();
  await page.waitForTimeout(250);
  expect(editorText).toContain("#");
});

test("Edit Config: Should enable save button when config is modified", async ({
  page,
}) => {
  await page.goto("/");

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
  await page.goto("/");

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
  await mockConfigAPI(page, {
    configErrors: [
      "Config file error: Cannot redefine existing key 'templates'.",
      "Config path: /home/app/standalone/shared/.tiddl/config.toml",
    ],
  });

  await page.goto("/");

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
