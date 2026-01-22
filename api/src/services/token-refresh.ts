import { Express } from "express";

import { TOKEN_CHECK_INTERVAL } from "../../constants";
import { ensureFreshToken, getFreshTiddlConfig } from "../helpers/get-fresh-token";

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
    `✅ [TOKEN] Token refresh interval started (checks every ${TOKEN_CHECK_INTERVAL / 60000} minutes)`,
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
 * Uses ensureFreshToken() which handles all the logic
 */
async function checkAndRefreshToken(app: Express) {
  try {
    // ensureFreshToken() will check expiry and refresh if needed
    await ensureFreshToken();

    // Update app.locals with fresh config for backward compatibility
    // (Some routes still use app.locals.tiddlConfig)
    const { config: freshConfig } = getFreshTiddlConfig();
    app.locals.tiddlConfig = freshConfig;
  } catch (error) {
    console.error(
      "❌ [TOKEN] Error during token refresh check:",
      error instanceof Error ? error.message : error,
    );
  }
}
