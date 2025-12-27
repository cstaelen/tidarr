import { expect, Page } from "@playwright/test";
import jwt from "jsonwebtoken";

/**
 * Login to Tidarr with password authentication
 * @param page - Playwright page object
 * @param password - Password to use for login (default: "passwdtidarr")
 */
export async function login(page: Page, password = "passwdtidarr") {
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();

  // When I proceed to login
  await page.getByPlaceholder("Password...").fill(password);
  await page.getByRole("button", { name: "Submit" }).click();

  // Then I should be on homepage
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
  await page.waitForTimeout(500);
}

export async function oidcLogin(page: Page): Promise<string> {
  // Create a valid token
  const jwtSecret = process.env.JWT_SECRET || "tidarr-secret";
  const tidarrToken = jwt.sign(
    {
      oidcSub: "test-user-123",
      email: "test@example.com",
      name: "Test User",
    },
    jwtSecret,
    { expiresIn: "12h" },
  );

  // Simulate OIDC callback
  await page.goto(`/?token=${tidarrToken}`);
  await page.waitForTimeout(1000);

  return tidarrToken;
}
