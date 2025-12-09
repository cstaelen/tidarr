import { Request, Response, Router } from "express";

import { getAppInstance } from "../helpers/app-instance";
import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { flushHistory } from "../services/history";

const router = Router();

/**
 * GET /api/history/list
 * Get the download history
 */
router.get(
  "/history/list",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      const app = getAppInstance();
      res.json(app.locals.history);
    } catch (error) {
      handleRouteError(error, res, "get history");
    }
  },
);

/**
 * DELETE /api/remove-all
 * Clear the entire download queue
 */
router.delete(
  "/history/list",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      flushHistory();
      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "remove all items from history");
    }
  },
);

export default router;
