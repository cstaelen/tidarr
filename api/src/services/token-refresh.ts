import { Express } from "express";

import { TOKEN_CHECK_INTERVAL, TOKEN_REFRESH_THRESHOLD } from "../../constants";

import { refreshTidalToken } from "./tiddl";

let tokenRefreshInterval: NodeJS.Timeout | null = null;

/**
 * Initialize token refresh interval
 * Checks every x minutes if token needs refresh
 */
export function startTokenRefreshInterval(app: Express) {
  // Clear any existing interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }

  console.log(
    `✅ [TOKEN] Token refresh interval started (checks every ${TOKEN_REFRESH_THRESHOLD / 60} minutes)`,
  );

  // Run immediately on startup
  checkAndRefreshToken(app);

  // Then check every x minutes
  tokenRefreshInterval = setInterval(() => {
    checkAndRefreshToken(app);
  }, TOKEN_CHECK_INTERVAL);
}

/**
 * Stop the token refresh interval (used during shutdown)
 */
export function stopTokenRefreshInterval() {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
    console.log("⏹️ [TOKEN] Token refresh interval stopped");
  }
}

/**
 * Check if token needs refresh and refresh if needed
 */
function checkAndRefreshToken(app: Express) {
  const tiddlConfig = app.locals.tiddlConfig;

  // If config not loaded yet, skip
  if (!tiddlConfig) {
    return;
  }

  // Call refreshTidalToken with the config from app.locals
  refreshTidalToken(false, tiddlConfig);
}
