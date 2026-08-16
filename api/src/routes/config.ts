import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { get_tiddl_config } from "../helpers/get_tiddl_config";
import {
  completePkceLogin,
  hasAtmosAuth,
  isPkceAuth,
  startPkceLogin,
} from "../services/tidal-pkce";
import { deleteTiddlConfig, tidalAtmosToken } from "../services/tiddl";
import { SettingsResponse } from "../types";

const router = Router();

/**
 * GET /api/settings
 * Get Tidarr configuration and Tidal token status
 */
router.get(
  "/settings",
  ensureAccessIsGranted,
  (_req: Request, res: Response<SettingsResponse>) => {
    try {
      // Force reload config from disk to detect config.toml changes
      // This ensures we always have the latest download path and quality settings
      const { config: tiddl_config, errors: configErrors } = get_tiddl_config();

      // Update app.locals with fresh config
      res.app.locals.tiddlConfig = tiddl_config;

      res.status(200).json({
        ...res.app.locals.config,
        noToken:
          !tiddl_config?.auth?.token || tiddl_config?.auth?.token?.length === 0,
        requiresPkceAuth:
          !!tiddl_config?.auth?.token && !isPkceAuth(tiddl_config.auth),
        noAtmosToken: !hasAtmosAuth(),
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
 * Deprecated legacy authentication endpoint.
 */
router.get(
  "/run-token",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    res.status(410).json({
      message:
        "This authentication endpoint was replaced by the Hi-Res PKCE and Atmos profile endpoints.",
      pkceStart: "/api/token/pkce/start",
      pkceComplete: "/api/token/pkce/complete",
      atmosphere: "/api/token/atmos",
    });
  },
);

/**
 * GET /api/token/atmos
 * Run the device authorization used by TIDAL's Atmos-capable client profile.
 */
router.get(
  "/token/atmos",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      await tidalAtmosToken(req, res);
    } catch (error) {
      handleRouteError(error, res, "run Atmos token authentication");
    }
  },
);

/**
 * GET /api/token/pkce/start
 * Start a Hi-Res-capable TIDAL PKCE authentication flow.
 */
router.get(
  "/token/pkce/start",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      res.status(200).json(startPkceLogin());
    } catch (error) {
      handleRouteError(error, res, "start TIDAL PKCE authentication");
    }
  },
);

/**
 * POST /api/token/pkce/complete
 * Exchange the redirected TIDAL URL for a refreshable Hi-Res token.
 */
router.post(
  "/token/pkce/complete",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    const { loginId, redirectUrl } = req.body || {};
    if (typeof loginId !== "string" || typeof redirectUrl !== "string") {
      res.status(200).json({
        success: false,
        message: "Both loginId and redirectUrl are required.",
      });
      return;
    }

    try {
      await completePkceLogin(loginId, redirectUrl);
      const { config: freshConfig } = get_tiddl_config();
      req.app.locals.tiddlConfig = freshConfig;
      res.status(200).json({ success: true, message: "Authenticated!" });
    } catch (error) {
      res.status(200).json({
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
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
