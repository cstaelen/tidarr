import { Application } from "express";

import { refreshTidalToken } from "../services/tiddl";

import { get_tiddl_config } from "./get_tiddl_config";

// Mutex to prevent concurrent refreshes
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/**
 * Refresh token with mutex to prevent concurrent refreshes.
 * Can be called from multiple places (proxy, tiddl CLI) safely.
 */
export async function refreshTokenOnce(app: Application): Promise<void> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  console.log("🔄 [TOKEN] Refreshing...");

  isRefreshing = true;
  refreshPromise = refreshTidalToken()
    .then(() => {
      const { config } = get_tiddl_config();
      app.locals.tiddlConfig = config;
      logExpiresToken(config?.auth?.expires_at);
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

export function logExpiresToken(expires_at?: number) {
  if (!expires_at) {
    console.log(`⚠️ [TIDAL] No token found - authentication required`);
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = expires_at - now;
  if (expiresIn > 0) {
    const minutes = Math.floor(expiresIn / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    console.log(`🔑 [TIDAL] Token expires in ${hours}h ${remainingMinutes}min`);
  } else {
    console.log(
      `⚠️ [TIDAL] Token expired ${Math.abs(Math.floor(expiresIn / 60))}min ago`,
    );
  }
}
