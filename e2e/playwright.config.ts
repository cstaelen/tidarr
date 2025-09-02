import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  snapshotDir: "./snapshots",
  outputDir: "./test-results",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [
      process.env.CI ? "html" : "list",
      {
        host: "0.0.0.0",
        outputFolder: "./playwright-report",
        open: process.env.CI === undefined,
      },
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://localhost:${process.env.IS_DOCKER ? 8484 : 3000}/`,
    locale: "en-US",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",

    // Whether to ignore HTTPS errors during navigation.
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      threshold: 0.3,
      maxDiffPixelRatio: 0.03,
      animations: "allow",
    },
  },
});
