import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { get_tiddl_config } from "../helpers/get_tiddl_config";
import { refreshTidalToken } from "../services/config";
import { deleteTiddlConfig, tidalToken } from "../services/tiddl";

const router = Router();

/**
 * GET /api/settings
 * Get Tidarr configuration and Tidal token status
 */
router.get(
  "/settings",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    refreshTidalToken();
    const tiddl_config = get_tiddl_config();
    res.app.set("tiddlConfig", tiddl_config);

    res.status(200).json({
      ...res.app.settings.config,
      noToken:
        !tiddl_config?.auth?.token || tiddl_config?.auth?.token?.length === 0,
      tiddl_config: tiddl_config,
    });
  },
);

/**
 * GET /api/run_token
 * Run Tidal authentication flow (SSE endpoint)
 */
router.get(
  "/run_token",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    await tidalToken(req, res);
  },
);

/**
 * GET /api/delete_token
 * Delete Tidal authentication token
 */
router.get(
  "/delete_token",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    deleteTiddlConfig();
    res.sendStatus(204);
  },
);

export default router;
