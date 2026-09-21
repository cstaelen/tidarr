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

function isAnsiErrorLine(line: string): boolean {
  return (
    line.includes("[31mError:\x1B") &&
    !IGNORED_ANSI_ERROR_SUBSTRINGS.some((ignored) => line.includes(ignored))
  );
}

export function classifyTiddlLine(line: string): TiddlErrorKind {
  if (NETWORK_ERROR_PATTERNS.some((pattern) => line.includes(pattern))) {
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
