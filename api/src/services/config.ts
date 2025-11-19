import { execSync, spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { CONFIG_PATH, ROOT_PATH, SYNC_DEFAULT_CRON } from "../../constants";

export async function configureServer() {
  console.log(`---------------------`);
  console.log(`⚙️ LOAD TIDARR CONFIG`);
  console.log(`---------------------`);

  try {
    const output_config = execSync(
      `bash ${ROOT_PATH}/api/scripts/init.sh ${process.env.ENVIRONMENT}`,
      {
        encoding: "utf-8",
      },
    );

    console.log(output_config);

    return {
      output: output_config,
      parameters: {
        ENABLE_BEETS: process.env.ENABLE_BEETS || "",
        PLEX_URL: process.env.PLEX_URL || "",
        PLEX_LIBRARY: process.env.PLEX_LIBRARY || "",
        PLEX_TOKEN: process.env.PLEX_TOKEN || "",
        PLEX_PATH: process.env.PLEX_PATH || "",
        NAVIDROME_URL: process.env.NAVIDROME_URL || "",
        NAVIDROME_USER: process.env.NAVIDROME_USER || "",
        NAVIDROME_PASSWORD: process.env.NAVIDROME_PASSWORD ? "****" : "",
        GOTIFY_URL: process.env.GOTIFY_URL || "",
        GOTIFY_TOKEN: process.env.GOTIFY_TOKEN || "",
        PUID: process.env.PUID || "",
        PGID: process.env.PGID || "",
        UMASK: process.env.UMASK || "",
        TIDARR_VERSION: process.env.VERSION || "",
        APPRISE_API_ENDPOINT: process.env.APPRISE_API_ENDPOINT || "",
        APPRISE_API_TAG: process.env.APPRISE_API_TAG || "",
        PUSH_OVER_URL: process.env.PUSH_OVER_URL || "",
        LOCK_QUALITY: process.env.LOCK_QUALITY || "",
        ENABLE_TIDAL_PROXY: process.env.ENABLE_TIDAL_PROXY || "",
        SYNC_CRON_EXPRESSION:
          process.env.SYNC_CRON_EXPRESSION || SYNC_DEFAULT_CRON || "",
      },
    };
  } catch (error: unknown) {
    console.log("❌ [TIDARR] Error config", error);
  }
}

/**
 * Check if Tidal token needs refresh based on expires_at timestamp
 * Refreshes if token expires in less than 30 minutes
 */
function shouldRefreshToken(): boolean {
  const authPath = join(CONFIG_PATH, ".tiddl", "auth.json");

  // If auth file doesn't exist, no need to refresh
  if (!existsSync(authPath)) {
    return false;
  }

  try {
    const authData = JSON.parse(readFileSync(authPath, "utf-8"));
    const expiresAt = authData.expires_at;

    if (!expiresAt) {
      return false;
    }

    // Current time in seconds
    const nowInSeconds = Math.floor(Date.now() / 1000);
    // Refresh if token expires in less than 30 minutes (1800 seconds)
    const timeUntilExpiry = expiresAt - nowInSeconds;

    return timeUntilExpiry < 1800;
  } catch {
    console.log("⚠️ [TIDDL] Could not read auth.json, skipping token refresh");
    return false;
  }
}

export function refreshTidalToken(force = false) {
  // Skip refresh if token is still valid (unless forced)
  if (!force && !shouldRefreshToken()) {
    return;
  }

  console.log("🕖 [TIDDL] Refreshing Tidal token...");

  // Use async spawn to avoid blocking Node.js event loop
  const refreshProcess = spawn("tiddl", ["auth", "refresh"], {
    env: { ...process.env },
  });

  refreshProcess.on("close", (code) => {
    if (code === 0) {
      console.log(
        `✅ [TIDDL] Tidal token refreshed and saved to ${CONFIG_PATH}/.tiddl/auth.json`,
      );
    } else {
      console.log(`⚠️ [TIDDL] Token refresh exited with code ${code}`);
    }
  });

  refreshProcess.on("error", (error) => {
    console.log(`❌ [TIDDL] Token refresh error: ${error.message}`);
  });
}
