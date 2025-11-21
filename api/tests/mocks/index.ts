/**
 * Common mocks for API tests
 *
 * This module exports all common mock functions that are used across multiple test files.
 * Import only the mocks you need in your test files.
 *
 * Usage:
 * ```ts
 * import { mockCommonServices } from "./mocks";
 *
 * // Before importing the Express app
 * mockCommonServices();
 *
 * describe("My tests", () => {
 *   // ...
 * });
 * ```
 */

import { mockConfigService, mockTiddlConfigHelper } from "./config.mock";
import { mockProcessingStackEmpty } from "./processing-stack.mock";
import { mockSyncServiceBasic } from "./sync.mock";
import { mockTokenRefreshService } from "./token-refresh.mock";

export { mockConfigService, mockTiddlConfigHelper } from "./config.mock";
export {
  mockProcessingStackEmpty,
  mockProcessingStackWithData,
} from "./processing-stack.mock";
export { mockSyncServiceBasic, mockSyncServiceFull } from "./sync.mock";
export { mockTokenRefreshService } from "./token-refresh.mock";

/**
 * Convenience function to mock all common services
 * Used by most tests that import the Express app
 */
export const mockCommonServices = () => {
  mockConfigService();
  mockTiddlConfigHelper();
  mockTokenRefreshService();
  mockSyncServiceBasic();
  mockProcessingStackEmpty();
};
