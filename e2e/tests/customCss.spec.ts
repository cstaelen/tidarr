import { expect } from "@playwright/test";
import dotenv from "dotenv";

import { test } from "../test-isolation";

dotenv.config({ path: "../.env", override: false, quiet: true });

test("Custom CSS: Should enable save button when CSS is modified", async ({
  page,
}) => {
  await page.goto("/");

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
  await page.goto("/");

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
