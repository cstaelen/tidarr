import { Request, Response, Router } from "express";

import { ensureAccessIsGranted } from "../helpers/auth";

const router = Router();

/**
 * GET /api/stream-processing
 * Server-Sent Events endpoint for processing queue updates
 */
router.get(
  "/stream-processing",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Add the new connection to the list
    req.app.locals.activeListConnections.push(res);

    // Remove the connection from the list when it closes
    req.on("close", () => {
      req.app.locals.activeListConnections =
        req.app.locals.activeListConnections.filter(
          (conn: Response) => conn !== res,
        );
    });

    // Send initial state to the new client
    const data = JSON.stringify(req.app.locals.processingStack.data);
    res.write(`data: ${data}\n\n`);
  },
);

/**
 * GET /api/stream-item-output/:id
 * Server-Sent Events endpoint for individual item output logs
 */
router.get(
  "/stream-item-output/:id",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    const itemId = req.params.id;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Get or create the connections array for this item
    const connections: Map<string, Response[]> =
      req.app.locals.activeItemOutputConnections;
    if (!connections.has(itemId)) {
      connections.set(itemId, []);
    }
    connections.get(itemId)?.push(res);

    // Remove the connection when it closes
    req.on("close", () => {
      const itemConnections = connections.get(itemId);
      if (itemConnections) {
        const filtered = itemConnections.filter((conn) => conn !== res);
        if (filtered.length === 0) {
          connections.delete(itemId);
        } else {
          connections.set(itemId, filtered);
        }
      }
    });

    // Send initial output for this item
    const output =
      req.app.locals.processingStack.actions.getItemOutput(itemId) || "";
    res.write(`data: ${JSON.stringify({ id: itemId, output })}\n\n`);
  },
);

export default router;
