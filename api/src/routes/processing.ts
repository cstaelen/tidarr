import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import {
  validateIdMiddleware,
  validateItemMiddleware,
  validateRequestBody,
} from "../helpers/validation";

const router = Router();

/**
 * POST /api/save
 * Add an item to the download queue
 */
router.post(
  "/save",
  ensureAccessIsGranted,
  validateRequestBody(["item"]),
  validateItemMiddleware,
  async (req: Request, res: Response) => {
    try {
      req.app.locals.processingStack.actions.addItem(req.body.item);
      res.sendStatus(201);
    } catch (error) {
      handleRouteError(error, res, "add item to queue");
    }
  },
);

/**
 * DELETE /api/remove
 * Remove a specific item from the queue by ID
 */
router.delete(
  "/remove",
  ensureAccessIsGranted,
  validateRequestBody(["id"]),
  validateIdMiddleware,
  (req: Request, res: Response) => {
    try {
      req.app.locals.processingStack.actions.removeItem(req.body.id);
      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "remove item from queue");
    }
  },
);

/**
 * DELETE /api/remove-all
 * Clear the entire download queue
 */
router.delete(
  "/remove-all",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    try {
      req.app.locals.processingStack.actions.removeAllItems();
      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "remove all items from queue");
    }
  },
);

/**
 * DELETE /api/remove-finished
 * Remove all finished items from the queue
 */
router.delete(
  "/remove-finished",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    try {
      req.app.locals.processingStack.actions.removeFinishedItems();
      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "remove finished items from queue");
    }
  },
);

/**
 * POST /api/queue/pause
 * Pause the download queue (cancels current item and sets it back to queue)
 */
router.post(
  "/queue/pause",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    try {
      await req.app.locals.processingStack.actions.pauseQueue();
      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "pause queue");
    }
  },
);

/**
 * POST /api/queue/resume
 * Resume the download queue
 */
router.post(
  "/queue/resume",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    try {
      req.app.locals.processingStack.actions.resumeQueue();
      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "resume queue");
    }
  },
);

/**
 * GET /api/queue/status
 * Get the current queue status (paused or not)
 */
router.get(
  "/queue/status",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    try {
      const status = req.app.locals.processingStack.actions.getQueueStatus();
      res.json(status);
    } catch (error) {
      handleRouteError(error, res, "get queue status");
    }
  },
);

export default router;
