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
 *
 * @openapi
 * /api/save:
 *   post:
 *     operationId: addToQueue
 *     summary: Add a Tidal item to the download queue
 *     tags: [Download Queue]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item]
 *             properties:
 *               item:
 *                 type: object
 *                 required: [type, status]
 *                 properties:
 *                   url:
 *                     type: string
 *                     description: Tidal URL (e.g. https://listen.tidal.com/album/251082404)
 *                   type:
 *                     $ref: '#/components/schemas/ContentType'
 *                   status:
 *                     type: string
 *                     description: Initial status, typically "queue"
 *     responses:
 *       201:
 *         description: Item added to queue
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
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
 *
 * @openapi
 * /api/remove:
 *   delete:
 *     operationId: removeFromQueue
 *     summary: Remove an item from the download queue
 *     tags: [Download Queue]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *                 description: Item ID to remove
 *     responses:
 *       204:
 *         description: Item removed
 *       400:
 *         description: Invalid or missing ID
 *       401:
 *         description: Unauthorized
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
 *
 * @openapi
 * /api/remove-all:
 *   delete:
 *     operationId: clearQueue
 *     summary: Clear the entire download queue
 *     tags: [Download Queue]
 *     responses:
 *       204:
 *         description: Queue cleared
 *       401:
 *         description: Unauthorized
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
 *
 * @openapi
 * /api/remove-finished:
 *   delete:
 *     operationId: removeFinishedItems
 *     summary: Remove all finished items from the queue
 *     tags: [Download Queue]
 *     responses:
 *       204:
 *         description: Finished items removed
 *       401:
 *         description: Unauthorized
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
 *
 * @openapi
 * /api/queue/pause:
 *   post:
 *     operationId: pauseQueue
 *     summary: Pause the download queue
 *     tags: [Download Queue]
 *     responses:
 *       204:
 *         description: Queue paused
 *       401:
 *         description: Unauthorized
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
 *
 * @openapi
 * /api/queue/resume:
 *   post:
 *     operationId: resumeQueue
 *     summary: Resume the download queue
 *     tags: [Download Queue]
 *     responses:
 *       204:
 *         description: Queue resumed
 *       401:
 *         description: Unauthorized
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
 *
 * @openapi
 * /api/queue/status:
 *   get:
 *     operationId: getQueueStatus
 *     summary: Get the queue status (paused or running)
 *     tags: [Download Queue]
 *     responses:
 *       200:
 *         description: Queue status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueueStatusResponse'
 *       401:
 *         description: Unauthorized
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
