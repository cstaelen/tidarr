import { Express, Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
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

const router = Router();

/**
 * GET /api/sync/list
 * Get list of synchronized playlists
 */
router.get(
  "/sync/list",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    const list = getSyncList();
    res.status(200).json(list);
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
    addItemToSyncList(req.body.item);
    createCronJob(req.app as Express);

    res.sendStatus(201);
  },
);

/**
 * POST /api/sync/remove
 * Remove a playlist from synchronization list
 */
router.post(
  "/sync/remove",
  ensureAccessIsGranted,
  validateRequestBody(["id"]),
  validateIdMiddleware,
  async (req: Request, res: Response) => {
    removeItemFromSyncList(req.body.id);
    createCronJob(req.app as Express);

    res.sendStatus(201);
  },
);

/**
 * POST /api/sync/remove-all
 * Remove all playlists from synchronization list
 */
router.post(
  "/sync/remove-all",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    removeAllFromSyncList();
    createCronJob(req.app as Express);

    res.sendStatus(204);
  },
);

/**
 * GET /api/sync/now
 * Manually trigger synchronization of all items
 */
router.get(
  "/sync/now",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    process_sync_list(res.app as Express);

    res.sendStatus(200);
  },
);

export default router;
