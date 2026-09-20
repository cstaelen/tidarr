/**
 * Classifies a single line of tiddl stdout as a network error, a content/quality
 * error, or not an error at all.
 *
 * Extracted from tiddl.ts because this list has grown several times already as
 * new failure modes were discovered in production (see lessons-learned.md) —
 * having it in one place with named pattern lists makes it easy to extend and
 * testable without mocking `spawn`.
 */

export type TiddlErrorKind = "network" | "content" | null;

/**
 * Patterns that indicate a transient network/connection failure — retriable.
 */
const NETWORK_ERROR_PATTERNS = [
  "Cannot connect to host",
  "Connection reset by peer",
  "ECONNRESET",
  "ContentLengthError",
  "is not completed",
  "TypeError: terminated",
];

/**
 * Patterns that indicate a content/quality issue (not network) — non-retriable.
 * Excludes the network patterns above, which are checked first.
 */
const CONTENT_ONLY_ERROR_PATTERNS = [
  "validation errors",
  "due to Dolby Atmos filter",
];

/**
 * `[31mError:` lines that are tiddl-handled fallbacks, not real errors.
 */
const IGNORED_ANSI_ERROR_SUBSTRINGS = ["not a MP4 file", "no longer available"];

function isAnsiErrorLine(line: string): boolean {
  return (
    line.includes("[31mError:\x1B") &&
    !IGNORED_ANSI_ERROR_SUBSTRINGS.some((ignored) => line.includes(ignored))
  );
}

/**
 * Classifies one line of tiddl stdout.
 * @returns "network" for a retriable connection failure, "content" for any
 * other recognized error, or null if the line isn't an error at all.
 */
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
