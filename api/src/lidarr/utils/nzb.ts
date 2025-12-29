/**
 * Extract album ID from NZB content
 * NZB format: <meta type="title">Tidarr Album {albumId}</meta>
 */
export function extractAlbumIdFromNzb(nzbContent: string): string | null {
  const match = nzbContent.match(
    /<meta type="title">Tidarr Album (\d+)<\/meta>/,
  );
  return match ? match[1] : null;
}

/**
 * Parse multipart/form-data to extract NZB file content
 * Simple implementation without external dependencies
 */
export function parseMultipartNzb(
  body: string,
  boundary: string,
): string | null {
  try {
    // Split by boundary
    const parts = body.split(`--${boundary}`);

    // Find the part containing the NZB file
    for (const part of parts) {
      // Check if this part contains a file upload (has Content-Disposition)
      if (
        part.includes("Content-Disposition") &&
        part.includes('name="name"')
      ) {
        // Extract content after headers (double CRLF)
        const contentMatch = part.split("\r\n\r\n");
        if (contentMatch.length >= 2) {
          // Return the NZB content (everything after headers, before next boundary)
          return contentMatch.slice(1).join("\r\n\r\n").trim();
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[SABnzbd] Error parsing multipart data:", error);
    return null;
  }
}
