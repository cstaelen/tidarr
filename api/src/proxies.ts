import apicache from "apicache";
import { Express } from "express";
import proxy from "express-http-proxy";

import { TIDAL_API_URL } from "../constants";

const cache = apicache.middleware;

/**
 * Configure all API proxies for the application
 * - Tidal API proxy (always enabled)
 * - Plex API proxy (optional, requires PLEX_URL and PLEX_TOKEN)
 * - Navidrome API proxy (optional, requires NAVIDROME_URL, NAVIDROME_USER, NAVIDROME_PASSWORD)
 */
export function setupProxies(app: Express): void {
  // Tidal API proxy
  app.use(
    "/proxy/tidal",
    cache("1 minute"),
    proxy(TIDAL_API_URL, {
      proxyReqOptDecorator: function (proxyReqOpts) {
        delete proxyReqOpts.headers["referer"];
        delete proxyReqOpts.headers["origin"];
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
