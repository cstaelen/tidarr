import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";
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
    req.app.settings.processingList.actions.addItem(req.body.item);
    res.sendStatus(201);
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
    req.app.settings.processingList.actions.removeItem(req.body.id);
    res.sendStatus(204);
  },
);

/**
 * DELETE /api/remove_all
 * Clear the entire download queue
 */
router.delete(
  "/remove_all",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    req.app.settings.processingList.actions.removeAllItems();
    res.sendStatus(204);
  },
);

/**
 * DELETE /api/remove_finished
 * Remove all finished items from the queue
 */
router.delete(
  "/remove_finished",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    req.app.settings.processingList.actions.removeFinishedItems();
    res.sendStatus(204);
  },
);

export default router;
