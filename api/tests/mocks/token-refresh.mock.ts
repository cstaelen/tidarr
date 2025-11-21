import { vi } from "vitest";

/**
 * Mock for token refresh service
 * Used by all tests that import the Express app
 */
export const mockTokenRefreshService = () => {
  vi.mock("../../src/services/token-refresh", () => ({
    startTokenRefreshInterval: vi.fn(),
    stopTokenRefreshInterval: vi.fn(),
  }));
};
