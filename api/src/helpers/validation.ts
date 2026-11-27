import { NextFunction, Request, Response } from "express";

import { ContentType, ProcessingItemType, QualityType } from "../types";

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
 * An item id ends up as a filesystem path (`${PROCESSING_PATH}/${item.id}`,
 * which post-processing later deletes) and as a Map key, so it has to stay a
 * single safe segment. Tidal ids are numbers, playlist uuids and mix ids are
 * alphanumeric, and favorites carry their own type name.
 */
const SAFE_ID = /^[\w-]{1,64}$/;

/**
 * Everything below reaches the tiddl CLI as an argv entry, so it is
 * whitelisted rather than type-checked. Typed from the item so a value that
 * no longer exists cannot compile.
 */
const VALID_TYPES: ContentType[] = [
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

const VALID_STATUSES: ProcessingItemType["status"][] = [
  "queue_download",
  "download",
  "queue_processing",
  "processing",
  "queue",
  "finished",
  "error",
];

const VALID_QUALITIES: QualityType[] = ["low", "normal", "high", "max"];
const VALID_ATMOS_FILTERS = ["none", "only", "allow"];
const VALID_SOURCES: NonNullable<ProcessingItemType["source"]>[] = [
  "lidarr",
  "tidarr",
];

const MAX_URL_LENGTH = 2048;

/**
 * Validate an item posted to the download queue.
 * Returns the reason it was refused, or null when it is fine.
 */
function validateItem(item: unknown): string | null {
  if (!item || typeof item !== "object") {
    return "item must be an object";
  }

  const obj = item as Record<string, unknown>;

  const id =
    typeof obj.id === "number" && !isNaN(obj.id) ? String(obj.id) : obj.id;
  if (typeof id !== "string" || !SAFE_ID.test(id)) {
    return "item.id must be a number or a string of letters, digits, _ and -";
  }

  if (
    typeof obj.type !== "string" ||
    !VALID_TYPES.includes(obj.type as ContentType)
  ) {
    return `item.type must be one of: ${VALID_TYPES.join(", ")}`;
  }

  if (
    typeof obj.status !== "string" ||
    !VALID_STATUSES.includes(obj.status as ProcessingItemType["status"])
  ) {
    return `item.status must be one of: ${VALID_STATUSES.join(", ")}`;
  }

  // Optional, but it is passed as an argument to tiddl: a value starting with
  // "-" would be read as an option
  if (obj.url !== undefined) {
    if (typeof obj.url !== "string" || obj.url.length > MAX_URL_LENGTH) {
      return `item.url must be a string of at most ${MAX_URL_LENGTH} characters`;
    }
    // eslint-disable-next-line no-control-regex
    if (obj.url.startsWith("-") || /[\s\u0000-\u001f]/.test(obj.url)) {
      return "item.url must not start with '-' nor contain whitespace";
    }
  }

  if (
    obj.quality !== undefined &&
    !VALID_QUALITIES.includes(obj.quality as QualityType)
  ) {
    return `item.quality must be one of: ${VALID_QUALITIES.join(", ")}`;
  }

  if (
    obj.atmosFilter !== undefined &&
    !VALID_ATMOS_FILTERS.includes(obj.atmosFilter as string)
  ) {
    return `item.atmosFilter must be one of: ${VALID_ATMOS_FILTERS.join(", ")}`;
  }

  if (
    obj.source !== undefined &&
    !VALID_SOURCES.includes(
      obj.source as NonNullable<ProcessingItemType["source"]>,
    )
  ) {
    return `item.source must be one of: ${VALID_SOURCES.join(", ")}`;
  }

  // Server-side only: it holds the running ChildProcess, and the API never
  // sends it to a client either
  if (obj.process !== undefined) {
    return "item.process is server-side only";
  }

  return null;
}

/**
 * Middleware to validate item in request body
 */
export function validateItemMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const error = validateItem(req.body.item);

  if (error) {
    res.status(400).json({ error: `Invalid item: ${error}` });
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
