import { NextFunction, Request, Response } from "express";

/**
 * Validation helper for request body fields
 */
export function validateRequestBody(
  requiredFields: string[],
  optionalFields: string[] = [],
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== "object") {
      res
        .status(400)
        .json({ error: "Request body must be a valid JSON object" });
      return;
    }

    // Check for required fields
    const missingFields = requiredFields.filter(
      (field) => !(field in req.body),
    );

    if (missingFields.length > 0) {
      res.status(400).json({
        error: `Missing required field(s): ${missingFields.join(", ")}`,
      });
      return;
    }

    // Check for unknown fields
    const allowedFields = [...requiredFields, ...optionalFields];
    const unknownFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (unknownFields.length > 0) {
      console.warn(
        `[WARN] Unknown fields in request: ${unknownFields.join(", ")}`,
      );
    }

    next();
  };
}

/**
 * Validate item object structure for downloads
 */
function validateItem(item: unknown): item is {
  url?: string;
  type: string;
  status: string;
} {
  if (!item || typeof item !== "object") {
    return false;
  }

  const obj = item as Record<string, unknown>;

  // type and status are required
  if (typeof obj.type !== "string" || typeof obj.status !== "string") {
    return false;
  }

  // url is optional but must be string if present
  if (obj.url !== undefined && typeof obj.url !== "string") {
    return false;
  }

  // Validate type values
  const validTypes = [
    "album",
    "track",
    "video",
    "playlist",
    "mix",
    "artist",
    "artist_videos",
    "favorite_albums",
    "favorite_tracks",
    "favorite_playlists",
    "favorite_videos",
    "favorite_artists",
  ];

  if (!validTypes.includes(obj.type)) {
    return false;
  }

  return true;
}

/**
 * Middleware to validate item in request body
 */
export function validateItemMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { item } = req.body;

  if (!validateItem(item)) {
    res.status(400).json({
      error:
        "Invalid item structure. Required: { type: string, status: string, url?: string }",
    });
    return;
  }

  next();
}

/**
 * Validate ID parameter (must be non-empty string or number)
 */
function validateId(id: unknown): boolean {
  if (typeof id === "string" && id.trim().length > 0) {
    return true;
  }
  if (typeof id === "number" && !isNaN(id)) {
    return true;
  }
  return false;
}

/**
 * Middleware to validate ID in request body
 */
export function validateIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.body;

  if (!validateId(id)) {
    res.status(400).json({
      error:
        "Invalid or missing 'id' field. Must be a non-empty string or number.",
    });
    return;
  }

  next();
}
