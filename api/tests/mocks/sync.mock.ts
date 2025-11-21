import { vi } from "vitest";

/**
 * Mock for sync service with basic cron job
 * Used by tests that don't need full sync functionality
 */
export const mockSyncServiceBasic = () => {
  vi.mock("../../src/services/sync", () => ({
    createCronJob: vi.fn(),
  }));
};

/**
 * Mock for sync service with full functionality
 * Used by sync.spec.ts for testing sync endpoints
 */
export const mockSyncServiceFull = () => {
  vi.mock("../../src/services/sync", () => ({
    createCronJob: vi.fn(),
    getSyncList: vi.fn().mockResolvedValue([]),
    addItemToSyncList: vi.fn().mockResolvedValue(undefined),
    removeItemFromSyncList: vi.fn().mockResolvedValue(undefined),
    removeAllFromSyncList: vi.fn().mockResolvedValue(undefined),
    process_sync_list: vi.fn().mockResolvedValue(undefined),
  }));
};
