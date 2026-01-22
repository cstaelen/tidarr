import { Express } from "express";
import proxy from "express-http-proxy";

import { TIDAL_API_URL } from "../constants";

import { ensureFreshToken } from "./helpers/get-fresh-token";

/**
 * Configure all API proxies for the application
 * - Tidal API proxy (always enabled)
 * - Plex API proxy (optional, requires PLEX_URL and PLEX_TOKEN)
 * - Navidrome API proxy (optional, requires NAVIDROME_URL, NAVIDROME_USER, NAVIDROME_PASSWORD)
 */
export function setupProxies(app: Express): void {
  // Tidal API proxy
  // Note: No cache to ensure fresh token is always used
  // Automatically adds Authorization header with fresh Tidal token
  app.use(
    "/proxy/tidal",
    proxy(TIDAL_API_URL, {
      proxyReqOptDecorator: async function (proxyReqOpts) {
        delete proxyReqOpts.headers["referer"];
        delete proxyReqOpts.headers["origin"];

        // Add fresh Tidal token to Authorization header
        try {
          const token = await ensureFreshToken();
          if (!proxyReqOpts.headers) {
            proxyReqOpts.headers = {};
          }
          proxyReqOpts.headers["authorization"] = `Bearer ${token}`;
        } catch (error) {
          console.error(
            "⚠️ [PROXY] Failed to get Tidal token:",
            error instanceof Error ? error.message : error,
          );
        }

        return proxyReqOpts;
      },
    }),
  );

  // Plex API proxy (optional)
  if (process.env.PLEX_URL && process.env.PLEX_TOKEN) {
    const plexBaseUrl = process.env.PLEX_URL.replace(/\/$/, "");
    app.use(
      "/proxy/plex",
      proxy(plexBaseUrl, {
        proxyReqPathResolver: function (req) {
          // Keep the path and add Plex token
          const url = new URL(req.url, "http://localhost");
          url.searchParams.set("X-Plex-Token", process.env.PLEX_TOKEN || "");
          return url.pathname + url.search;
        },
        proxyReqOptDecorator: function (proxyReqOpts) {
          delete proxyReqOpts.headers["referer"];
          delete proxyReqOpts.headers["origin"];
          return proxyReqOpts;
        },
      }),
    );
  }

  // Jellyfin API proxy
  if (process.env.JELLYFIN_URL && process.env.JELLYFIN_API_KEY) {
    const jellyfinBaseUrl = process.env.JELLYFIN_URL.replace(/\/$/, "");
    app.use(
      "/proxy/jellyfin",
      proxy(jellyfinBaseUrl, {
        proxyReqOptDecorator: function (proxyReqOpts) {
          delete proxyReqOpts.headers["referer"];
          delete proxyReqOpts.headers["origin"];
          // Add Jellyfin API key in header
          if (!proxyReqOpts.headers) {
            proxyReqOpts.headers = {};
          }
          proxyReqOpts.headers["X-Emby-Token"] =
            process.env.JELLYFIN_API_KEY || "";
          return proxyReqOpts;
        },
      }),
    );
  }

  // Navidrome API proxy (optional)
  if (
    process.env.NAVIDROME_URL &&
    process.env.NAVIDROME_USER &&
    process.env.NAVIDROME_PASSWORD
  ) {
    const navidromeBaseUrl = process.env.NAVIDROME_URL.replace(/\/$/, "");
    app.use(
      "/proxy/navidrome",
      proxy(navidromeBaseUrl, {
        proxyReqPathResolver: function (req) {
          // Keep the path and add Subsonic auth params
          const url = new URL(req.url, "http://localhost");
          url.searchParams.set("u", process.env.NAVIDROME_USER || "");
          url.searchParams.set("p", process.env.NAVIDROME_PASSWORD || "");
          url.searchParams.set("v", "1.16.1");
          url.searchParams.set("c", "tidarr");
          url.searchParams.set("f", "json");
          return url.pathname + url.search;
        },
        proxyReqOptDecorator: function (proxyReqOpts) {
          delete proxyReqOpts.headers["referer"];
          delete proxyReqOpts.headers["origin"];
          return proxyReqOpts;
        },
      }),
    );
  }
}
