import { Express } from "express";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.CONFIG_PATH = "/tmp/tidarr-test";
process.env.ADMIN_PASSWORD = "test123";

// Mock authentication middleware to always pass
vi.mock("../src/helpers/auth", () => ({
  ensureAccessIsGranted: vi.fn((req, res, next) => next()),
  generateJWT: vi.fn(() => "mock-jwt-token"),
}));

// Mock processing jobs
vi.mock("../src/processing/jobs", () => ({
  cleanFolder: vi.fn().mockResolvedValue("finished"),
  moveAndClean: vi.fn().mockResolvedValue("finished"),
  hasFileToMove: vi.fn().mockReturnValue(true),
  killProcess: vi.fn().mockResolvedValue(undefined),
  replacePathInM3U: vi.fn().mockResolvedValue(undefined),
  setPermissions: vi.fn().mockResolvedValue(undefined),
  getFolderToScan: vi.fn().mockReturnValue([]),
  executeCustomScript: vi.fn().mockResolvedValue(undefined),
}));

// Global test state
export let testApp: Express;

beforeAll(async () => {
  // Setup test database/files if needed
  console.log("🧪 Test suite starting...");
});

afterAll(async () => {
  // Cleanup
  console.log("🧪 Test suite finished");
});

beforeEach(() => {
  // Reset state before each test
});

// Helper to create auth token for tests
export function getTestAuthToken(): string {
  // This would generate a valid JWT token for testing
  // For now, return a mock token
  return "Bearer test-token-123";
}

// Helper to mock Tidal config
export function getMockTiddlConfig() {
  return {
    template: {
      album: "albums/{album_artist}/{year} - {album}/{number:02d}. {title}",
      track: "tracks/{artist}/{artist} - {title}",
      video: "videos/{artist}/{artist} - {title}",
      playlist:
        "playlists/{playlist}/{playlist_number:02d}. {artist} - {title}",
    },
    download: {
      quality: "high",
      video_quality: "high",
      path: "/home/app/standalone/shared/library",
      threads: 5,
    },
    metadata: {
      cache_dir: "/home/app/standalone/shared/.tiddl/cache",
      language: "en",
    },
    cover: {
      size: "1280x1280",
      format: "jpg",
    },
    m3u: {
      enabled: false,
      absolute_path: false,
      base_path: "/music",
    },
    auth: {
      token: "mock-tidal-token",
      refresh_token: "mock-refresh-token",
      expires: 604800,
      expires_at: Math.floor(Date.now() / 1000) + 604800,
      user_id: "123456",
      country_code: "US",
    },
  };
}
