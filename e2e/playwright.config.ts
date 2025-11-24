import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Global setup - builds Docker image before all tests */
  globalSetup: require.resolve("./global-setup"),

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
  workers: process.env.CI ? 2 : undefined,
  /* Global timeout for each test */
  timeout: 30000,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [
      "html",
      {
        host: "0.0.0.0",
        outputFolder: "./playwright-report",
        open: process.env.CI === undefined,
      },
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Note: baseURL is set dynamically per test via the tidarrUrl fixture */
    /* Each test gets its own isolated container on a random port */
    locale: "en-US",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    // Whether to ignore HTTPS errors during navigation.
    ignoreHTTPSErrors: true,

    // Reduce memory usage in CI
    video: "off",
    screenshot: process.env.CI ? "only-on-failure" : "on",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
});
