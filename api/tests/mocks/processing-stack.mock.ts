import { vi } from "vitest";

/**
 * Mock for ProcessingStack with empty queue
 * Used by most tests that don't need queue data
 */
export const mockProcessingStackEmpty = () => {
  vi.mock("../../src/processing/ProcessingStack", () => ({
    ProcessingStack: vi.fn(() => ({
      data: [],
      actions: {
        addItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
        removeAllItems: vi.fn().mockResolvedValue(undefined),
        removeFinishedItems: vi.fn().mockResolvedValue(undefined),
        getQueue: vi.fn().mockReturnValue([]),
        pauseQueue: vi.fn().mockResolvedValue(undefined),
        resumeQueue: vi.fn().mockResolvedValue(undefined),
        getQueueStatus: vi.fn().mockReturnValue({ isPaused: false }),
        loadDataFromFile: vi.fn().mockResolvedValue(undefined),
        addOutputLog: vi.fn(),
        getItemOutput: vi.fn().mockReturnValue(""),
      },
    })),
  }));
};

/**
 * Mock for ProcessingStack with test data
 * Used by SSE tests that need queue items
 */
export const mockProcessingStackWithData = () => {
  vi.mock("../../src/processing/ProcessingStack", () => ({
    ProcessingStack: vi.fn(() => ({
      data: [
        {
          id: "123",
          type: "album",
          title: "Test Album",
          artist: "Test Artist",
          status: "queue",
        },
      ],
      actions: {
        addItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
        removeAllItems: vi.fn().mockResolvedValue(undefined),
        removeFinishedItems: vi.fn().mockResolvedValue(undefined),
        getQueue: vi.fn().mockReturnValue([]),
        pauseQueue: vi.fn().mockResolvedValue(undefined),
        resumeQueue: vi.fn().mockResolvedValue(undefined),
        getQueueStatus: vi.fn().mockReturnValue({ isPaused: false }),
        loadDataFromFile: vi.fn().mockResolvedValue(undefined),
        addOutputLog: vi.fn(),
        getItemOutput: vi.fn().mockReturnValue("Mock output logs"),
      },
    })),
  }));
};
