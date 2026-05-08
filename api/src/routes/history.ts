import { Request, Response, Router } from "express";

import { getAppInstance } from "../helpers/app-instance";
import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { flushHistory } from "../services/history";

const router = Router();

/**
 * GET /api/history/list
 * Get the download history, optionally paginated via ?offset=0&limit=100
 */
router.get(
  "/history/list",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      const app = getAppInstance();
      const history = app.locals.history;

      const offset = Math.max(
        0,
        parseInt(String(_req.query.offset ?? 0), 10) || 0,
      );
      const limit =
        Math.max(1, parseInt(String(_req.query.limit ?? 0), 10) || 0) ||
        undefined;

      const items = limit
        ? history.slice(offset, offset + limit)
        : history.slice(offset);

      res.json({
        total: history.length,
        offset,
        limit: limit ?? null,
        items,
      });
    } catch (error) {
      handleRouteError(error, res, "get history");
    }
  },
);

/**
 * DELETE /api/history/list
 * Clear the download history
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
