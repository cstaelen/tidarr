import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { validateRequestBody } from "../helpers/validation";

import { getCustomCSS, setCustomCSS } from "../services/custom-css";

const router = Router();

/**
 * GET /api/custom-css
 * Get custom CSS content
 */
router.get(
  "/custom-css",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      const cssContent = getCustomCSS();
      res.status(200).json(cssContent);
    } catch (error) {
      console.error("[ERROR] Failed to read custom CSS:", error);
      res.status(500).json({ error: "Failed to read custom CSS" });
    }
  },
);

/**
 * POST /api/custom-css
 * Save custom CSS content
 */
router.post(
  "/custom-css",
  ensureAccessIsGranted,
  validateRequestBody(["css"]),
  (req: Request, res: Response) => {
    try {
      const { css } = req.body;

      if (typeof css !== "string") {
        res.status(400).json({ error: "CSS content must be a string" });
        return;
      }

      setCustomCSS(css);
      res
        .status(200)
        .json({ success: true, message: "Custom CSS saved successfully" });
    } catch (error) {
      console.error("[ERROR] Failed to save custom CSS:", error);
      res.status(500).json({ error: "Failed to save custom CSS" });
    }
  },
);

export default router;
