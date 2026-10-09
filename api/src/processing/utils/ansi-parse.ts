/**
 * Strip all ANSI escape sequences and invalid control characters.
 * Removes: colors, hyperlinks, cursor movements, and any non-printable ASCII.
 */
export function stripAnsiCodes(text: string): string {
  return (
    text
      /* eslint-disable no-control-regex */
      // 1. Remove OSC 8 hyperlinks (starts with ESC ] 8;)
      .replace(/\u001b]8;[^\u0007\u001b]*[\u0007\u001b\\]/g, "")
      // 2. Remove ALL ANSI escape sequences (CSI codes, etc.)
      .replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        "",
      )
      // 3. Remove control characters (NULL, BEL, etc.) except \r, \n
      .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, "")
      /* eslint-enable no-control-regex */
      // 4. Remove non-ASCII characters (keeps only printable ASCII + \r\n)
      .replace(/[^\x20-\x7E\r\n]/g, "")
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
