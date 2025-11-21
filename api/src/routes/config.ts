import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { refreshAndReloadConfig } from "../services/config";
import { deleteTiddlConfig, tidalToken } from "../services/tiddl";
import { SettingsResponse } from "../types";

const router = Router();

/**
 * GET /api/settings
 * Get Tidarr configuration and Tidal token status
 */
router.get(
  "/settings",
  ensureAccessIsGranted,
  async (_req: Request, res: Response<SettingsResponse>) => {
    try {
      // Get config from app.locals (already loaded on startup)
      let tiddl_config = res.app.locals.tiddlConfig;

      // Refresh and reload if token needs it (expired or expiring soon)
      // refreshAndReloadConfig checks internally via shouldRefreshToken()
      const refreshed = await refreshAndReloadConfig(tiddl_config);
      tiddl_config = refreshed.config;
      const configErrors = refreshed.errors;

      // Update app.locals with fresh config
      res.app.locals.tiddlConfig = tiddl_config;

      res.status(200).json({
        ...res.app.locals.config,
        noToken:
          !tiddl_config?.auth?.token || tiddl_config?.auth?.token?.length === 0,
        tiddl_config: tiddl_config,
        configErrors: configErrors.length > 0 ? configErrors : undefined,
      });
    } catch (error) {
      handleRouteError(error, res, "get settings");
    }
  },
);

/**
 * GET /api/run-token
 * Run Tidal authentication flow (SSE endpoint)
 */
router.get(
  "/run-token",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      await tidalToken(req, res);
    } catch (error) {
      handleRouteError(error, res, "run token authentication");
    }
  },
);

/**
 * DELETE /api/token
 * Delete Tidal authentication token
 */
router.delete(
  "/token",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      deleteTiddlConfig();
      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "delete token");
    }
  },
);

export default router;
