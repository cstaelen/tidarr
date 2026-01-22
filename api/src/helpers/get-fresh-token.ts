import { refreshTidalToken, shouldRefreshToken } from "../services/tiddl";
import { TiddlConfig } from "../types";

import { get_tiddl_config } from "./get_tiddl_config";

// Prevent concurrent token refreshes
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/** Read tiddl config from disk (no cache) */
export function getFreshTiddlConfig(): {
  config: TiddlConfig;
  errors: string[];
} {
  return get_tiddl_config();
}

/** Get fresh token with automatic refresh if < 30min to expiry */
export async function ensureFreshToken(): Promise<string> {
  const { config } = getFreshTiddlConfig();

  if (!config?.auth?.token) {
    throw new Error("No Tidal token available. Please authenticate first.");
  }

  if (shouldRefreshToken(config)) {
    // Wait for ongoing refresh
    if (isRefreshing && refreshPromise) {
      await refreshPromise;
      const { config: freshConfig } = getFreshTiddlConfig();
      return freshConfig.auth.token;
    }

    // Start refresh
    isRefreshing = true;
    refreshPromise = refreshTidalToken()
      .then(() => {
        isRefreshing = false;
        refreshPromise = null;
      })
      .catch((error) => {
        isRefreshing = false;
        refreshPromise = null;
        throw error;
      });

    await refreshPromise;

    const { config: freshConfig } = getFreshTiddlConfig();
    return freshConfig.auth.token;
  }

  return config.auth.token;
}
