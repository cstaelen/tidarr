import { Express } from "express";

/**
 * Singleton to hold the Express app instance.
 * This allows other modules to access app.locals without passing the app around.
 */
let appInstance: Express | null = null;

export function setAppInstance(app: Express): void {
  appInstance = app;
}

export function getAppInstance(): Express {
  if (!appInstance) {
    throw new Error(
      "App instance not initialized. Call setAppInstance() first.",
    );
  }
  return appInstance;
}
