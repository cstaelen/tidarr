import { vi } from "vitest";

import { getMockTiddlConfig } from "../setup";

/**
 * Mock for config service
 * Used by all tests that import the Express app
 */
export const mockConfigService = () => {
  vi.mock("../../src/services/config", () => ({
    configureServer: vi.fn().mockResolvedValue({
      PLEX_URL: "",
      PLEX_TOKEN: "",
      NAVIDROME_URL: "",
      NAVIDROME_USER: "",
      NAVIDROME_PASSWORD: "",
      BEETS_ENABLE: false,
      GOTIFY_ENABLE: false,
      APPRISE_ENABLE: false,
      ENABLE_TIDAL_PROXY: false,
    }),
    refreshAndReloadConfig: vi.fn().mockResolvedValue({
      config: getMockTiddlConfig(),
      errors: [],
    }),
  }));
};

/**
 * Mock for tiddl config helper
 * Used by all tests that import the Express app
 */
export const mockTiddlConfigHelper = () => {
  vi.mock("../../src/helpers/get_tiddl_config", () => ({
    get_tiddl_config: vi.fn().mockReturnValue({
      config: getMockTiddlConfig(),
      errors: [],
    }),
  }));
};
