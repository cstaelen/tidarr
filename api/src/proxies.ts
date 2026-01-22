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
  // Tidal proxy - auto-adds fresh token
  app.use(
    "/proxy/tidal",
    async (_req, res, next) => {
      try {
        await ensureFreshToken();
        next();
      } catch (error) {
        console.error(
          "⚠️ [PROXY] No Tidal token available:",
          error instanceof Error ? error.message : error,
        );
        res.status(401).json({
          status: 401,
          userMessage: "Authentication required. Please log in to Tidal.",
        });
      }
    },
    proxy(TIDAL_API_URL, {
      proxyReqOptDecorator: async function (proxyReqOpts) {
        delete proxyReqOpts.headers["referer"];
        delete proxyReqOpts.headers["origin"];

        const token = await ensureFreshToken();
        if (!proxyReqOpts.headers) {
          proxyReqOpts.headers = {};
        }
        proxyReqOpts.headers["authorization"] = `Bearer ${token}`;

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
