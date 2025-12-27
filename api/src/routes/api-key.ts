import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { getOrCreateApiKey, regenerateApiKey } from "../services/api-key";

const router = Router();

/**
 * GET /api/api-key
 * Get the current API key for *arr integrations (Lidarr, Radarr, etc.)
 */
router.get(
  "/api-key",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      const apiKey = getOrCreateApiKey();

      res.status(200).json({
        apiKey,
      });
    } catch (error) {
      handleRouteError(error, res, "get API key");
    }
  },
);

/**
 * POST /api/api-key/regenerate
 * Regenerate the API key (creates a new random key)
 */
router.post(
  "/api-key/regenerate",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      const newApiKey = regenerateApiKey();
      res.status(200).json({
        apiKey: newApiKey,
      });
    } catch (error) {
      handleRouteError(error, res, "regenerate API key");
    }
  },
);

export default router;
