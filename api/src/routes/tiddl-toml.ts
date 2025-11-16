import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { validateRequestBody } from "../helpers/validation";
import { getTomlConfig, setTomlConfig } from "../services/tiddl-toml";

const router = Router();

/**
 * GET /api/tiddl/config
 * Get tiddl config file content
 */
router.get(
  "/tiddl/config",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      const content = getTomlConfig();
      res.status(200).json(content);
    } catch (error) {
      console.error("❌ [TOML] Failed to read Tiddl config:", error);
      res.status(500).json({ error: "Failed to read Tiddl config" });
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
  (req: Request, res: Response) => {
    try {
      const { toml } = req.body;

      if (typeof toml !== "string") {
        res.status(400).json({ error: "Content must be a string" });
        return;
      }

      setTomlConfig(toml);
      res
        .status(200)
        .json({ success: true, message: "Tiddl config saved successfully" });
    } catch (error) {
      console.error("❌ [TOML] Failed to save Tiddl config:", error);
      res.status(500).json({ error: "Failed to save Tiddl config" });
    }
  },
);

export default router;
