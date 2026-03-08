import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import {
  handleRouteError,
  handleValidationError,
} from "../helpers/error-handler";
import { validateRequestBody } from "../helpers/validation";
import { CustomCSSResponse, CustomCSSSaveResponse } from "../types";

import { getCustomCSS, setCustomCSS } from "../services/custom-css";

const router = Router();

/**
 * GET /api/custom-css
 * Get custom CSS content
 *
 * @openapi
 * /api/custom-css:
 *   get:
 *     operationId: getCustomCss
 *     summary: Get custom CSS content
 *     tags: [Customization]
 *     responses:
 *       200:
 *         description: Custom CSS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomCSSResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/custom-css",
  ensureAccessIsGranted,
  (_req: Request, res: Response<CustomCSSResponse>) => {
    try {
      const cssContent = getCustomCSS();
      res.status(200).json(cssContent);
    } catch (error) {
      handleRouteError(error, res, "read custom CSS");
    }
  },
);

/**
 * POST /api/custom-css
 * Save custom CSS content
 *
 * @openapi
 * /api/custom-css:
 *   post:
 *     operationId: saveCustomCss
 *     summary: Save custom CSS content
 *     tags: [Customization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [css]
 *             properties:
 *               css:
 *                 type: string
 *     responses:
 *       200:
 *         description: CSS saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomCSSSaveResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/custom-css",
  ensureAccessIsGranted,
  validateRequestBody(["css"]),
  (req: Request, res: Response<CustomCSSSaveResponse>) => {
    try {
      const { css } = req.body;

      if (typeof css !== "string") {
        handleValidationError(res, "CSS content must be a string");
        return;
      }

      setCustomCSS(css);
      res
        .status(200)
        .json({ success: true, message: "Custom CSS saved successfully" });
    } catch (error) {
      handleRouteError(error, res, "save custom CSS");
    }
  },
);

export default router;
