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
 */
router.get(
  "/sync/list",
  ensureAccessIsGranted,
  (_req: Request, res: Response<SyncListResponse>) => {
    try {
      const list = getSyncList();
      res.status(200).json(list);
    } catch (error) {
      handleRouteError(error, res, "get sync list");
    }
  },
);

/**
 * POST /api/sync/save
 * Add a playlist to synchronization list
 */
router.post(
  "/sync/save",
  ensureAccessIsGranted,
  validateRequestBody(["item"]),
  async (req: Request, res: Response) => {
    try {
      addItemToSyncList(req.body.item);
      createCronJob(req.app as Express);

      res.sendStatus(201);
    } catch (error) {
      handleRouteError(error, res, "add item to sync list");
    }
  },
);

/**
 * DELETE /api/sync/remove
 * Remove a playlist from synchronization list
 */
router.delete(
  "/sync/remove",
  ensureAccessIsGranted,
  validateRequestBody(["id"]),
  validateIdMiddleware,
  async (req: Request, res: Response) => {
    try {
      removeItemFromSyncList(req.body.id);
      createCronJob(req.app as Express);

      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "remove item from sync list");
    }
  },
);

/**
 * DELETE /api/sync/remove-all
 * Remove all playlists from synchronization list
 */
router.delete(
  "/sync/remove-all",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    try {
      removeAllFromSyncList();
      createCronJob(req.app as Express);

      res.sendStatus(204);
    } catch (error) {
      handleRouteError(error, res, "remove all items from sync list");
    }
  },
);

/**
 * POST /api/sync/trigger
 * Manually trigger synchronization of all items
 */
router.post(
  "/sync/trigger",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      process_sync_list(res.app as Express);

      res.sendStatus(202);
    } catch (error) {
      handleRouteError(error, res, "trigger sync");
    }
  },
);

export default router;
