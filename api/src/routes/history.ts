import { Request, Response, Router } from "express";

import { getAppInstance } from "../helpers/app-instance";
import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import { flushHistory } from "../services/history";

const router = Router();

/**
 * GET /api/history/list
 * Get the download history
 *
 * @openapi
 * /api/history/list:
 *   get:
 *     operationId: getHistory
 *     summary: Get download history
 *     tags: [History]
 *     responses:
 *       200:
 *         description: List of downloaded item IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
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
 * DELETE /api/history/list
 * Clear download history
 *
 * @openapi
 * /api/history/list:
 *   delete:
 *     operationId: clearHistory
 *     summary: Clear download history
 *     tags: [History]
 *     responses:
 *       204:
 *         description: History cleared
 *       401:
 *         description: Unauthorized
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
