import { Express } from "express";

import { TOKEN_CHECK_INTERVAL } from "../../constants";
import {
  ensureFreshToken,
  getFreshTiddlConfig,
} from "../helpers/get-fresh-token";

let tokenRefreshInterval: NodeJS.Timeout | null = null;

/** Start token refresh interval (checks every 30min) */
export function startTokenRefreshInterval(app: Express) {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }

  console.log(
    `✅ [TOKEN] Refresh interval started (every ${TOKEN_CHECK_INTERVAL / 60000}min)`,
  );

  checkAndRefreshToken(app);
  tokenRefreshInterval = setInterval(() => {
    checkAndRefreshToken(app);
  }, TOKEN_CHECK_INTERVAL);
}

/** Stop token refresh interval */
export function stopTokenRefreshInterval() {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
    console.log("⏹️ [TOKEN] Refresh interval stopped");
  }
}

/** Check token and refresh if needed, updating app.locals.tiddlConfig */
export async function checkAndRefreshToken(app: Express): Promise<boolean> {
  try {
    await ensureFreshToken();
    const { config: freshConfig } = getFreshTiddlConfig();
    app.locals.tiddlConfig = freshConfig;
    return !!freshConfig?.auth?.token;
  } catch (error) {
    console.error(
      "❌ [TOKEN] Refresh check error:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
