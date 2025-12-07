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

test("Custom CSS: Should apply styles to DOM and persist", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  const newCSS = "body { background-color: rgb(255, 0, 0); }";

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

  // Wait for page to reload
  await page.waitForLoadState("load");

  // Verify the CSS is actually applied to the DOM
  const backgroundColor = await page.locator("body").evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(backgroundColor).toBe("rgb(255, 0, 0)");

  // After reload, verify the CSS is still there in the editor
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Custom CSS" }).click();

  await page.locator(".monaco-editor").waitFor();

  const editorText = await page
    .locator(".monaco-editor .view-lines")
    .innerText();
  expect(editorText).toContain("background-color");
  // Normalize whitespace since Monaco may format differently
  expect(editorText.replace(/\s+/g, " ")).toContain("rgb(255, 0, 0)");
});
