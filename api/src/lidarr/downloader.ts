import { Request, Response } from "express";

import { extractAlbumIdFromNzb, parseMultipartNzb } from "./utils/nzb";
import { addAlbumToQueue } from "./utils/tidal-search-albums";

/**
 * SABnzbd-compatible API for Lidarr download client integration
 * Minimal implementation supporting: version, addurl, queue, history
 */

/**
 * GET /api/sabnzbd?mode=version
 * Returns SABnzbd version for compatibility check
 */
export function handleVersionRequest(req: Request, res: Response) {
  res.json({
    version: "3.0.0",
  });
}

/**
 * GET /api/sabnzbd?mode=get_config
 * Returns SABnzbd configuration
 * Required by Lidarr to validate the download client
 */
export function handleGetConfigRequest(req: Request, res: Response) {
  res.json({
    config: {
      version: "3.0.0",
      categories: [
        {
          name: "music",
          priority: 0,
          pp: "3",
          script: "None",
          dir: "/music",
        },
        {
          name: "*",
          priority: 0,
          pp: "3",
          script: "None",
          dir: "/music",
        },
      ],
      misc: {
        complete_dir: "/music",
        download_dir: "/shared/.processing",
        api_key: "",
      },
    },
  });
}

/**
 * GET /api/sabnzbd?mode=addurl&name=<url>&nzbname=<name>&cat=<category>&priority=<priority>
 * POST /api/sabnzbd?mode=addfile (multipart/form-data with NZB file)
 * Adds an album to the download queue
 */
export async function handleAddUrlRequest(req: Request, res: Response) {
  try {
    const { mode } = req.query;

    // mode=addfile - Lidarr uploads NZB file
    if (mode === "addfile") {
      console.log("[SABnzbd] Processing addfile request (NZB upload)");

      // Extract boundary from Content-Type header
      const contentType = req.headers["content-type"];
      if (!contentType || !contentType.includes("multipart/form-data")) {
        console.log("[SABnzbd] Invalid content type for addfile");
        return res.json({
          status: false,
          error: "multipart/form-data required for addfile",
        });
      }

      const boundaryMatch = contentType.match(/boundary=(.+)/);
      if (!boundaryMatch) {
        console.log("[SABnzbd] No boundary found in content-type");
        return res.json({
          status: false,
          error: "No boundary in multipart data",
        });
      }

      const boundary = boundaryMatch[1].replace(/^-+/, ""); // Remove leading dashes

      // Get raw body content - express.raw() provides it as a Buffer in req.body
      const rawBody = req.body;
      if (!rawBody || !Buffer.isBuffer(rawBody)) {
        console.log("[SABnzbd] No body data received or invalid format");
        return res.json({
          status: false,
          error: "No file data received",
        });
      }

      // Convert Buffer to string for parsing
      const bodyString = rawBody.toString("utf8");

      // Parse NZB content from multipart data
      const nzbContent = parseMultipartNzb(bodyString, boundary);

      if (!nzbContent) {
        console.log("[SABnzbd] Failed to extract NZB content from upload");
        return res.json({
          status: false,
          error: "Failed to parse NZB file",
        });
      }

      // Extract album ID from NZB content
      const albumId = extractAlbumIdFromNzb(nzbContent);

      if (!albumId) {
        console.log("[SABnzbd] Failed to extract album ID from NZB");
        return res.json({
          status: false,
          error: "Invalid NZB format - album ID not found",
        });
      }

      console.log(`[SABnzbd] Extracted album ID from NZB: ${albumId}`);

      await addAlbumToQueue(albumId);

      return res.json({
        status: true,
        nzo_ids: [`tidarr_nzo_${albumId}`],
      });
    }

    // Fallback
    console.log(`[SABnzbd] Unknown addurl/addfile request`);
    return res.json({
      status: true,
      nzo_ids: ["tidarr_nzo_unknown"],
    });
  } catch (error) {
    console.error("[SABnzbd] Error in addurl/addfile:", error);
    return res.json({
      status: false,
      error: String(error),
    });
  }
}
