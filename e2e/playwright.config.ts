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
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://localhost:${process.env.IS_DOCKER ? 8484 : 3000}/`,
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
      testIgnore: ["**/downloads.spec.ts", "**/sync.spec.ts"],
    },
    // {
    //   name: "Mobile Safari",
    //   use: { ...devices["iPhone 12"] },
    //   testIgnore: [
    //     "**/custom-css.spec.ts",
    //     "**/downloads.spec.ts",
    //     "**/sync.spec.ts",
    //   ],
    // },
    {
      name: "serial-tests",
      testMatch: ["**/downloads.spec.ts", "**/sync.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
      fullyParallel: false,
    },
  ],
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
});
