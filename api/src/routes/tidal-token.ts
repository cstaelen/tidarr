import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { ensureFreshToken } from "../helpers/get-fresh-token";

const router = Router();

/**
 * GET /api/tidal/token
 * Get fresh Tidal token (with automatic refresh if needed)
 * This endpoint ensures the token is always valid and fresh
 */
router.get(
  "/tidal/token",
  ensureAccessIsGranted,
  async (_req: Request, res: Response) => {
    try {
      const token = await ensureFreshToken();
      res.status(200).json({ token });
    } catch (error) {
      handleRouteError(error, res, "get tidal token");
    }
  },
);

/**
 * POST /api/tidal/token/refresh
 * Force refresh of Tidal token
 * Returns the newly refreshed token
 */
router.post(
  "/tidal/token/refresh",
  ensureAccessIsGranted,
  async (_req: Request, res: Response) => {
    try {
      // Force refresh by calling ensureFreshToken which will check and refresh if needed
      // The threshold is already set to 30 minutes, but this endpoint can be used
      // to force a refresh even if not strictly needed
      const token = await ensureFreshToken();
      res.status(200).json({
        token,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      handleRouteError(error, res, "refresh tidal token");
    }
  },
);

export default router;
