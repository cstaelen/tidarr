/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import * as dotenv from "dotenv";
import * as fs from "fs";
import path from "path";
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers";

type TidarrFixtures = {
  tidarrContainer: StartedTestContainer;
  tidarrUrl: string;
};

type TestOptions = {
  envFile?: string; // Optional env file name (e.g., '.env.e2e.auth')
};

// Load environment variables from .env.e2e and optional .env.e2e.local or custom env file
function loadE2EEnv(customEnvFile?: string): Record<string, string> {
  const envPath = path.resolve(__dirname, ".env.e2e");

  const env: Record<string, string> = {
    CI: "true",
  };

  // Load base .env.e2e
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const [key, value] of Object.entries(envConfig)) {
      if (value && value.trim() !== "") {
        env[key] = value;
      }
    }
  } else {
    console.warn("Warning: .env.e2e not found, using default environment");
  }

  // Override with custom env file if specified
  if (customEnvFile) {
    const customEnvPath = path.resolve(__dirname, customEnvFile);
    if (fs.existsSync(customEnvPath)) {
      const customEnvConfig = dotenv.parse(fs.readFileSync(customEnvPath));
      for (const [key, value] of Object.entries(customEnvConfig)) {
        if (value && value.trim() !== "") {
          env[key] = value;
        }
      }
      console.log(`Loaded custom env from ${customEnvFile}`);
    } else {
      console.warn(`Warning: Custom env file ${customEnvFile} not found`);
    }
  }

  return env;
}

import {
  mockConfigAPI,
  mockRelease,
  mockTidalQueries,
} from "./tests/utils/mock";

export const test = base.extend<TidarrFixtures & TestOptions>({
  // Test option: specify custom env file
  envFile: [undefined, { option: true }],

  // Override baseURL with dynamic port for each test
  baseURL: async ({ tidarrContainer }, use) => {
    const port = tidarrContainer.getMappedPort(8484);
    const url = `http://localhost:${port}`;
    await use(url);
  },

  tidarrContainer: async ({ envFile }, use) => {
    // Load E2E environment variables with optional custom env file
    const e2eEnv = loadE2EEnv(envFile);

    // Start a fresh container for this test with dynamic port mapping
    const container = await new GenericContainer("tidarr-prod")
      .withExposedPorts(8484) // Let Docker assign a random port
      .withEnvironment(e2eEnv)
      .withWaitStrategy(Wait.forHttp("/", 8484).forStatusCode(200))
      .withStartupTimeout(120_000) // 2 minutes timeout
      .start();

    // Provide container to test
    await use(container);

    // Cleanup: stop and remove container
    await container.stop();
  },

  tidarrUrl: async ({ tidarrContainer }, use) => {
    const port = tidarrContainer.getMappedPort(8484);
    const url = `http://localhost:${port}`;
    await use(url);
  },

  // Auto-fixture: setup global mocks for all tests
  page: async ({ page }, use) => {
    // Setup global mocks before each test
    await mockConfigAPI(page);
    await mockRelease(page);
    await mockTidalQueries(page);
    // Provide page to test
    await use(page);

    // Cleanup after test (if needed)
  },
});
