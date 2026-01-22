import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { get_tiddl_config } from "../helpers/get_tiddl_config";
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
      // Force reload config from disk to detect config.toml changes
      // This ensures we always have the latest download path and quality settings
      // refreshAndReloadConfig() now uses ensureFreshToken() internally
      const refreshed = await refreshAndReloadConfig();
      const tiddl_config = refreshed.config;
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
      // Reload config after deleting token (will have no auth now)
      const { config: freshConfig } = get_tiddl_config();
      res.app.locals.tiddlConfig = freshConfig;
      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "delete token");
    }
  },
);

export default router;
