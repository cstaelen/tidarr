import { Express, Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
import { handleRouteError } from "../helpers/error-handler";
import {
  validateIdMiddleware,
  validateRequestBody,
} from "../helpers/validation";
import {
  addItemToSyncList,
  createCronJob,
  getSyncList,
  process_sync_list,
  removeAllFromSyncList,
  removeItemFromSyncList,
} from "../services/sync";
import { SyncListResponse } from "../types";

const router = Router();

/**
 * GET /api/sync/list
 * Get list of synchronized playlists
 *
 * @openapi
 * /api/sync/list:
 *   get:
 *     operationId: getSyncList
 *     summary: Get list of synchronized playlists
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Sync list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SyncItem'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/sync/list",
  ensureAccessIsGranted,
  async (_req: Request, res: Response<SyncListResponse>) => {
    try {
      const list = await getSyncList();
      res.status(200).json(list);
    } catch (error) {
      handleRouteError(error, res, "get sync list");
    }
  },
);

/**
 * POST /api/sync/save
 * Add a playlist to synchronization list
 *
 * @openapi
 * /api/sync/save:
 *   post:
 *     operationId: addToSyncList
 *     summary: Add a playlist to the sync list
 *     tags: [Sync]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item]
 *             properties:
 *               item:
 *                 $ref: '#/components/schemas/SyncItem'
 *     responses:
 *       201:
 *         description: Item added to sync list
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/sync/save",
  ensureAccessIsGranted,
  validateRequestBody(["item"]),
  async (req: Request, res: Response) => {
    try {
      await addItemToSyncList(req.body.item);
      await createCronJob(req.app as Express);

      res.sendStatus(201);
    } catch (error) {
      handleRouteError(error, res, "add item to sync list");
    }
  },
);

/**
 * DELETE /api/sync/remove
 * Remove a playlist from synchronization list
 *
 * @openapi
 * /api/sync/remove:
 *   delete:
 *     operationId: removeFromSyncList
 *     summary: Remove a playlist from the sync list
 *     tags: [Sync]
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
 *     responses:
 *       204:
 *         description: Item removed
 *       400:
 *         description: Invalid or missing ID
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/sync/remove",
  ensureAccessIsGranted,
  validateRequestBody(["id"]),
  validateIdMiddleware,
  async (req: Request, res: Response) => {
    try {
      await removeItemFromSyncList(req.body.id);
      await createCronJob(req.app as Express);

      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "remove item from sync list");
    }
  },
);

/**
 * DELETE /api/sync/remove-all
 * Remove all playlists from synchronization list
 *
 * @openapi
 * /api/sync/remove-all:
 *   delete:
 *     operationId: clearSyncList
 *     summary: Remove all items from the sync list
 *     tags: [Sync]
 *     responses:
 *       204:
 *         description: Sync list cleared
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/sync/remove-all",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    try {
      await removeAllFromSyncList();
      await createCronJob(req.app as Express);

      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "remove all items from sync list");
    }
  },
);

/**
 * POST /api/sync/trigger
 * Manually trigger synchronization of all items
 *
 * @openapi
 * /api/sync/trigger:
 *   post:
 *     operationId: triggerSync
 *     summary: Manually trigger sync for all items
 *     tags: [Sync]
 *     responses:
 *       202:
 *         description: Sync triggered
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/sync/trigger",
  ensureAccessIsGranted,
  async (_req: Request, res: Response) => {
    try {
      await process_sync_list(res.app as Express);

      res.sendStatus(202);
    } catch (error) {
      handleRouteError(error, res, "trigger sync");
    }
  },
);

export default router;
