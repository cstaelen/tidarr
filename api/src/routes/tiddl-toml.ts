import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import {
  handleRouteError,
  handleValidationError,
} from "../helpers/error-handler";
import { validateRequestBody } from "../helpers/validation";
import { getTomlConfig, setTomlConfig } from "../services/tiddl-toml";
import { TiddlTomlResponse, TiddlTomlSaveResponse } from "../types";

const router = Router();

/**
 * GET /api/tiddl/config
 * Get tiddl config file content
 *
 * @openapi
 * /api/tiddl/config:
 *   get:
 *     operationId: getTiddlConfig
 *     summary: Get tiddl TOML config content
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: TOML config content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TiddlTomlResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/tiddl/config",
  ensureAccessIsGranted,
  (_req: Request, res: Response<TiddlTomlResponse>) => {
    try {
      const content = getTomlConfig();
      res.status(200).json(content);
    } catch (error) {
      handleRouteError(error, res, "read Tiddl config");
    }
  },
);

/**
 * POST /api/tiddl/config
 * Save tiddl config file content
 *
 * @openapi
 * /api/tiddl/config:
 *   post:
 *     operationId: saveTiddlConfig
 *     summary: Save tiddl TOML config content
 *     tags: [Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toml]
 *             properties:
 *               toml:
 *                 type: string
 *     responses:
 *       200:
 *         description: Config saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TiddlTomlSaveResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/tiddl/config",
  ensureAccessIsGranted,
  validateRequestBody(["toml"]),
  (req: Request, res: Response<TiddlTomlSaveResponse>) => {
    try {
      const { toml } = req.body;

      if (typeof toml !== "string") {
        handleValidationError(res, "TOML content must be a string");
        return;
      }

      setTomlConfig(toml);
      res
        .status(200)
        .json({ success: true, message: "Tiddl config saved successfully" });
    } catch (error) {
      handleRouteError(error, res, "save Tiddl config");
    }
  },
);

export default router;
