import { Response } from "express";

/**
 * Centralized error handler for API routes
 * Provides consistent error responses across all endpoints
 */

export interface ApiError {
  error: string;
  details?: unknown;
}

/**
 * Handle route errors with consistent formatting and logging
 * @param error - The error object
 * @param res - Express response object
 * @param context - Description of what operation failed (e.g., "read custom CSS", "save config")
 */
export function handleRouteError(
  error: unknown,
  res: Response,
  context: string,
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`[ERROR] Failed to ${context}:`, error);

  const response: ApiError = {
    error: `Failed to ${context}`,
  };

  // Include error details in development mode
  if (process.env.NODE_ENV === "development") {
    response.details = errorMessage;
  }

  res.status(500).json(response);
}

/**
 * Handle validation errors with 400 status
 * @param res - Express response object
 * @param message - Validation error message
 */
export function handleValidationError(res: Response, message: string): void {
  console.warn(`[VALIDATION ERROR] ${message}`);

  res.status(400).json({
    error: message,
  });
}

/**
 * Handle not found errors with 404 status
 * @param res - Express response object
 * @param resource - What resource was not found
 */
export function handleNotFoundError(res: Response, resource: string): void {
  console.warn(`[NOT FOUND] ${resource}`);

  res.status(404).json({
    error: `${resource} not found`,
  });
}
