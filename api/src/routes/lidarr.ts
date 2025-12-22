import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import {
  handleCapsRequest,
  handleDownloadFromLidarr,
  handleSearchRequest,
} from "../lidarr";

const router = Router();

/**
 * GET /api/lidarr - Newznab/Torznab indexer API
 * Implements basic Newznab protocol for Lidarr integration
 */
router.get(
  "/lidarr",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    try {
      const { t, q } = req.query;

      // Handle capabilities request (t=caps)
      if (t === "caps") {
        return handleCapsRequest(req, res);
      }

      // Handle search requests (t=search or t=music)
      return await handleSearchRequest(req, res, {
        q: q as string,
      });
    } catch (error) {
      handleRouteError(error, res, "Lidarr indexer request");
    }
  },
);

/**
 * GET /api/lidarr/download/:id - Trigger download
 * Called by Lidarr when grabbing an album
 */
router.get(
  "/lidarr/download/:id",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      handleDownloadFromLidarr(id, res);
    } catch (error) {
      handleRouteError(error, res, "Lidarr download");
    }
  },
);

export default router;
