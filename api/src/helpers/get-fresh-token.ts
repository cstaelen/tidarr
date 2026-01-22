import { refreshTidalToken, shouldRefreshToken } from "../services/tiddl";
import { TiddlConfig } from "../types";

import { get_tiddl_config } from "./get_tiddl_config";

/**
 * Get the current Tidal token, always reading from disk (no cache)
 * This ensures the token is always fresh and synchronized with auth.json
 */
export function getFreshTiddlConfig(): {
  config: TiddlConfig;
  errors: string[];
} {
  return get_tiddl_config();
}

/**
 * Get fresh Tidal token, with automatic refresh if needed
 * This is the main function to use when you need a valid Tidal token
 *
 * @returns Promise<string> - Fresh Tidal token
 * @throws Error if no token available
 */
export async function ensureFreshToken(): Promise<string> {
  const { config } = getFreshTiddlConfig();

  // No token available
  if (!config?.auth?.token) {
    throw new Error("No Tidal token available. Please authenticate first.");
  }

  // Check if token needs refresh (< 30 minutes until expiry)
  if (shouldRefreshToken(config)) {
    await refreshTidalToken();

    // Read again after refresh
    const { config: freshConfig } = getFreshTiddlConfig();
    return freshConfig.auth.token;
  }

  return config.auth.token;
}

/**
 * Get fresh Tidal token without refresh (read-only)
 * Use this when you just need to read the current token
 * without triggering a refresh
 */
export function getCurrentToken(): string | undefined {
  const { config } = getFreshTiddlConfig();
  return config?.auth?.token;
}
