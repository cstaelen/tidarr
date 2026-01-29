import { Application, Express, Request, Response } from "express";
import proxy from "express-http-proxy";

import { TIDAL_API_URL } from "../constants";

import { get_tiddl_config } from "./helpers/get_tiddl_config";
import { refreshTidalToken } from "./services/tiddl";

// Mutex to prevent concurrent refreshes
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/**
 * Refresh token with mutex to prevent concurrent refreshes
 */
async function refreshTokenOnce(app: Application): Promise<void> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshTidalToken()
    .then(() => {
      const { config } = get_tiddl_config();
      app.locals.tiddlConfig = config;
      console.log(
        "🔄 [PROXY] Token refreshed, new expires_at:",
        config.auth?.expires_at,
      );
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Configure all API proxies for the application
 * - Tidal API proxy (always enabled) - with refresh on 401
 * - Plex API proxy (optional, requires PLEX_URL and PLEX_TOKEN)
 * - Navidrome API proxy (optional, requires NAVIDROME_URL, NAVIDROME_USER, NAVIDROME_PASSWORD)
 */
export function setupProxies(app: Express): void {
  // Tidal proxy - refresh on 401, retry once
  app.use("/proxy/tidal", async (req: Request, res: Response) => {
    const token = req.app.locals.tiddlConfig?.auth?.token;

    if (!token) {
      res.status(401).json({
        status: 401,
        userMessage: "Authentication required. Please log in to Tidal.",
      });
      return;
    }

    const targetUrl = TIDAL_API_URL + req.url;

    const makeRequest = async (
      authToken: string,
    ): Promise<globalThis.Response> => {
      const headers: Record<string, string> = {
        authorization: `Bearer ${authToken}`,
      };

      // Forward relevant headers
      if (req.headers["content-type"]) {
        headers["content-type"] = req.headers["content-type"] as string;
      }
      if (req.headers["accept"]) {
        headers["accept"] = req.headers["accept"] as string;
      }

      return fetch(targetUrl, {
        method: req.method,
        headers,
        body: ["POST", "PUT", "PATCH"].includes(req.method)
          ? JSON.stringify(req.body)
          : undefined,
      });
    };

    try {
      let response = await makeRequest(token);

      // If 401, refresh token and retry once
      if (response.status === 401) {
        console.log("🔑 [PROXY] Got 401, refreshing token...");
        await refreshTokenOnce(req.app);

        const newToken = req.app.locals.tiddlConfig?.auth?.token;
        if (newToken && newToken !== token) {
          response = await makeRequest(newToken);
        }
      }

      // Forward response
      res.status(response.status);

      // Forward headers (skip problematic ones)
      response.headers.forEach((value, key) => {
        if (
          !["content-encoding", "transfer-encoding", "connection"].includes(
            key.toLowerCase(),
          )
        ) {
          res.setHeader(key, value);
        }
      });

      const body = await response.arrayBuffer();
      res.send(Buffer.from(body));
    } catch (error) {
      console.error("❌ [PROXY] Tidal request failed:", error);
      res.status(502).json({
        status: 502,
        userMessage: "Failed to reach Tidal API",
      });
    }
  });

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
