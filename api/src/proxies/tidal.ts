import { Express, Request, Response } from "express";

import { TIDAL_API_URL } from "../../constants";
import { ensureAccessIsGranted } from "../helpers/auth";
import { refreshTokenOnce } from "../helpers/refresh-token";

/**
 * Setup Tidal API proxy with automatic token refresh on 401
 */
export function setupTidalProxy(app: Express): void {
  app.use(
    "/proxy/tidal",
    ensureAccessIsGranted,
    async (req: Request, res: Response) => {
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
    },
  );
}
