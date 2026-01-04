import express, { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import {
  handleAddUrlRequest,
  handleGetConfigRequest,
  handleVersionRequest,
} from "../lidarr/downloader";
import {
  handleCapsRequest,
  handleDownloadFromLidarr,
  handleSearchRequest,
} from "../lidarr/indexer";

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
      const { t, q, artist, album } = req.query;

      // Handle capabilities request (t=caps)
      if (t === "caps") {
        return handleCapsRequest(req, res);
      }

      // Handle search requests (t=search or t=music)
      return await handleSearchRequest(req, res, {
        q: q as string,
        artist: artist as string,
        album: album as string,
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

/**
 * SABnzbd API handler - shared by GET and POST
 */
const handleSabnzbdRequest = async (req: Request, res: Response) => {
  try {
    const { mode } = req.query;

    console.log(`[SABNZBD] mode: ${mode}`);

    switch (mode) {
      case "version":
        return handleVersionRequest(req, res);

      case "get_config":
        return handleGetConfigRequest(req, res);

      case "addurl":
      case "addfile":
        return await handleAddUrlRequest(req, res);

      case "queue":
        return "[Sabdnzbd] Mode 'queue' not handled.";

      case "history":
        return "[Sabdnzbd] Mode 'history' not handled.";

      default:
        return res.status(400).json({
          error:
            "Invalid mode. Supported: version, get_config, addurl, addfile, queue, history",
        });
    }
  } catch (error) {
    handleRouteError(error, res, "SABnzbd API");
  }
};

/**
 * GET /api/sabnzbd/api - SABnzbd-compatible download client API
 * Allows Lidarr to use Tidarr as a download client
 */
router.get("/sabnzbd/api", ensureAccessIsGranted, handleSabnzbdRequest);

/**
 * POST /api/sabnzbd/api - SABnzbd-compatible download client API
 * Used by Lidarr to upload NZB files
 *
 * IMPORTANT: We need raw body for multipart parsing, so we use express.raw()
 */
router.post(
  "/sabnzbd/api",
  express.raw({ type: "multipart/form-data", limit: "10mb" }),
  ensureAccessIsGranted,
  handleSabnzbdRequest,
);

export default router;
