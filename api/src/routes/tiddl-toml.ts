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
