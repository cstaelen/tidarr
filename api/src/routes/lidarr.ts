import { Request, Response, Router } from "express";

import { getAppInstance } from "../helpers/app-instance";
import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { generateNzbContent } from "../helpers/lidarr-utils";
import {
  addAlbumToQueue,
  handleCapsRequest,
  handleSearchRequest,
} from "../services/lidarr";

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
      console.log(`[Lidarr] Download triggered for album ID: ${id}`);

      const app = getAppInstance();
      const tiddlConfig = app.locals.tiddlConfig;
      const countryCode = tiddlConfig?.auth?.country_code || "US";
      const albumUrl = `${process.env.TIDAL_API_URL || "https://api.tidal.com"}/v1/albums/${id}?countryCode=${countryCode}`;

      const response = await fetch(albumUrl, {
        headers: {
          Authorization: `Bearer ${tiddlConfig?.auth?.token}`,
        },
      });

      if (response.ok) {
        const albumData = await response.json();
        await addAlbumToQueue(app, albumData, id);

        const nzbContent = generateNzbContent(id);
        res.set("Content-Type", "application/x-nzb");
        res.set(
          "Content-Disposition",
          `attachment; filename="tidarr-${id}.nzb"`,
        );
        res.send(nzbContent);

        console.log(`[Lidarr] Successfully returned NZB for album ${id}`);
      } else {
        const errorBody = await response.text();
        console.error(
          `[Lidarr] Failed to fetch album details: ${response.status} ${response.statusText}`,
        );
        console.error(`[Lidarr] Error response body: ${errorBody}`);

        res.status(500).json({
          error: "Failed to fetch album details from Tidal",
          tidalStatus: response.status,
          tidalStatusText: response.statusText,
        });
      }
    } catch (error) {
      handleRouteError(error, res, "Lidarr download");
    }
  },
);

export default router;
