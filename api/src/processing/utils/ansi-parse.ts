/**
 * Strip problematic ANSI escape sequences while keeping colors:
 * - Keep: Color codes (ESC[...m)
 * - Remove: OSC 8 hyperlinks (ESC]8;...;...ESC\)
 * - Remove: Cursor movements (ESC[...A, ESC[...B, ESC[2K, etc.)
 * - Remove: Other control characters
 */
export function stripAnsiCodes(text: string): string {
  const ESC = "\x1b";

  return (
    text
      // Remove OSC 8 hyperlinks: ]8;id=123;file://path\ text ]8;;\
      // Pattern 1: with ESC character - ESC]8;...ESC\ text ESC]8;;ESC\
      .replace(
        new RegExp(
          `${ESC}\\]8;[^${ESC}]*${ESC}\\\\([^${ESC}]*)${ESC}\\]8;;${ESC}\\\\`,
          "g",
        ),
        "$1",
      )
      // Pattern 2: without ESC (already stripped) - ]8;id=...;url\ text ]8;;\
      .replace(/]8;[^\\]*\\([^\]]*)]8;;\\?/g, "$1")
      // Remove cursor movements: ESC[nA, ESC[nB, ESC[nC, ESC[nD, ESC[2K, ESC[1A, etc.
      .replace(new RegExp(`${ESC}\\[[0-9]*[ABCDEFGJKST]`, "g"), "")
      // Remove other OSC sequences (but keep CSI color codes)
      .replace(new RegExp(`${ESC}\\][^\x07]*\x07`, "g"), "")
      // Remove remaining control characters except newlines, carriage returns, and ESC (for colors)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1A\x1C-\x1F\x7F]/g, "")
  );
}

/**
 * Extract first line from tiddl output and clean it
 * Used for "Exists" and "Downloaded" status lines
 */
export function extractFirstLineClean(text: string): string {
  // Split by line breaks and get the first non-empty line
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) return "";

  // Clean the first line from ANSI codes
  return stripAnsiCodes(firstLine);
}
