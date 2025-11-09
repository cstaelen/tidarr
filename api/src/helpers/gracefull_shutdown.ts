import { Express, Response } from "express";
import { Server } from "http";
// Graceful shutdown
export function gracefulShutdown(signal: string, app: Express, server: Server) {
  console.log(`\n[INFO] ${signal} received. Starting graceful shutdown...`);

  // Close all active SSE connections
  const listConnections = app.settings.activeListConnections || [];
  console.log(
    `[INFO] Closing ${listConnections.length} processing list SSE connections...`,
  );
  listConnections.forEach((conn: Response) => {
    try {
      conn.end();
    } catch (error) {
      console.error("[ERROR] Failed to close SSE connection:", error);
    }
  });

  // Close all active item output SSE connections
  const itemOutputConnections: Map<string, Response[]> =
    app.settings.activeItemOutputConnections || new Map();
  let totalItemConnections = 0;
  itemOutputConnections.forEach((connections) => {
    totalItemConnections += connections.length;
    connections.forEach((conn) => {
      try {
        conn.end();
      } catch (error) {
        console.error(
          "[ERROR] Failed to close item output SSE connection:",
          error,
        );
      }
    });
  });
  console.log(
    `[INFO] Closing ${totalItemConnections} item output SSE connections...`,
  );

  // Close the server
  server.close(() => {
    console.log("[INFO] HTTP server closed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("[ERROR] Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}
