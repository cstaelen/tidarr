/**
 * Parses a Tidal BTS manifest and returns the full URLs.
 * @param decoded Manifest decoded as text
 * @param mime MIME type of the manifest
 * @returns Array of extracted URLs
 */
export function parseManifest(decoded: string, mime: string): string[] {
  const urls: string[] = [];

  if (mime === "application/vnd.tidal.bts") {
    try {
      const data = JSON.parse(decoded);
      if (data.urls) {
        urls.push(...data.urls);
      }
    } catch {
      // ignore parsing error
    }
  }

  // Skip DASH/HLS because we don't want segments,
  // only complete BTS files
  return urls;
}
