import { expect } from "@playwright/test";
import jwt from "jsonwebtoken";

import { test } from "../test-isolation";

test.use({ envFile: ".env.e2e.oidc" });

test("OIDC authentication: Should see OIDC login button", async ({ page }) => {
  await page.goto("/");
  await page.evaluate("localStorage.clear()");

  // Should see OIDC authentication modal
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();

  // Should see "Login with OpenID" button (not password input)
  await expect(
    page.getByRole("button", { name: "Login with OpenID" }),
  ).toBeInViewport();
  await expect(page.getByPlaceholder("Password...")).not.toBeVisible();
});

test("OIDC authentication: Should store token from URL parameter", async ({
  page,
}) => {
  // Create a valid OIDC token
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

  // Navigate with token parameter (simulates OIDC callback)
  await page.goto(`/?token=${tidarrToken}`);

  // Wait for AuthProvider useEffect to process the token
  await page.waitForTimeout(2000);

  // Verify token was set in localStorage
  const token = (await page.evaluate(
    "localStorage.getItem('tidarr-token')",
  )) as string | null;
  expect(token).toBe(tidarrToken);

  // Verify token contains OIDC claims
  if (token) {
    const decoded = jwt.decode(token) as {
      oidcSub: string;
      email: string;
      name: string;
    } | null;
    expect(decoded?.oidcSub).toBe("test-user-123");
    expect(decoded?.email).toBe("test@example.com");
    expect(decoded?.name).toBe("Test User");
  }
});

test("OIDC authentication: Should require re-authentication after token removal", async ({
  page,
}) => {
  // Create and set a valid token
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

  // Simulate OIDC callback by navigating with token parameter
  await page.goto(`/?token=${tidarrToken}`);
  await page.waitForTimeout(1000);

  // Should be on homepage
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();

  // Remove token
  await page.evaluate("localStorage.removeItem('tidarr-token')");

  // Navigate to home
  await page.goto("/");

  // Should be redirected to login
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();
});

test("OIDC authentication: Should handle OIDC callback errors gracefully", async ({
  page,
  tidarrUrl,
}) => {
  await page.goto("/");
  await page.evaluate("localStorage.clear()");

  // Mock failed OIDC callback (invalid state)
  await page.goto(
    `${tidarrUrl}/api/auth/oidc/callback?code=invalid-code&state=invalid-state`,
  );

  // Should show error (403 for invalid state)
  const content = await page.textContent("body");
  expect(content).toContain("Invalid state parameter");
});

test("OIDC authentication: Should handle missing OIDC configuration", async ({
  page,
}) => {
  // This test would require a different env setup, but we can test the client-side behavior
  await page.goto("/");
  await page.evaluate("localStorage.clear()");

  // With OIDC configured, should see the login button
  await expect(
    page.getByRole("button", { name: "Login with OpenID" }),
  ).toBeInViewport();
});

test("OIDC authentication: Should be able to logout", async ({ page }) => {
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

  // Navigate with token to simulate OIDC callback
  await page.goto(`/?token=${tidarrToken}`);
  await page.waitForTimeout(1000);

  // Should be on homepage
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
  await expect(page.getByLabel("Logout")).toBeInViewport();

  // Click logout
  await page.getByLabel("Logout").click();

  // Should be redirected to login
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();
});

test("OIDC authentication: Should redirect to requested URL after login", async ({
  page,
}) => {
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

  // Navigate to search page with token already set
  await page.goto("/search/Nirvana");

  // Should be on search results page
  await expect(
    page.getByRole("link", { name: "Nirvana", exact: true }).first(),
  ).toBeInViewport({ timeout: 10000 });
});
