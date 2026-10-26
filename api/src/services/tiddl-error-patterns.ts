// Classifies tiddl stdout lines as network errors, content/quality errors, or not errors.

export type TiddlErrorKind = "network" | "content" | null;

// Transient/connection failures — retriable
const NETWORK_ERROR_PATTERNS = [
  "Cannot connect to host",
  "Connection reset by peer",
  "ECONNRESET",
  "ContentLengthError",
  "is not completed",
  "TypeError: terminated",
];

// Content/quality issues — non-retriable
const CONTENT_ONLY_ERROR_PATTERNS = [
  "validation errors",
  "due to Dolby Atmos filter",
];

// `[31mError:` lines that are tiddl-handled fallbacks, not real errors
const IGNORED_ANSI_ERROR_SUBSTRINGS = ["not a MP4 file", "no longer available"];

// tiddl reports a failed API call as `API Error: <message>, <status>/<subStatus>`.
// These lines are never matched by `isAnsiErrorLine`, because the red prefix is
// `API Error:` and not `Error:`.
const API_ERROR_STATUS = /API Error:.*,\s(\d{3})\/\S+/;

// API statuses worth another attempt: rate limit, request timeout, upstream errors.
// Anything else, like a 404 on unavailable content, stays unclassified as before.
const RETRIABLE_API_STATUS = [408, 425, 429, 500, 502, 503, 504];

function isRetriableApiError(line: string): boolean {
  const status = line.match(API_ERROR_STATUS)?.[1];

  return status !== undefined && RETRIABLE_API_STATUS.includes(Number(status));
}

export function isRateLimitLine(line: string): boolean {
  return Number(line.match(API_ERROR_STATUS)?.[1]) === 429;
}

function isAnsiErrorLine(line: string): boolean {
  return (
    line.includes("[31mError:\x1B") &&
    !IGNORED_ANSI_ERROR_SUBSTRINGS.some((ignored) => line.includes(ignored))
  );
}

export function classifyTiddlLine(line: string): TiddlErrorKind {
  if (
    NETWORK_ERROR_PATTERNS.some((pattern) => line.includes(pattern)) ||
    isRetriableApiError(line)
  ) {
    return "network";
  }

  if (
    isAnsiErrorLine(line) ||
    CONTENT_ONLY_ERROR_PATTERNS.some((pattern) => line.includes(pattern))
  ) {
    return "content";
  }

  return null;
}
