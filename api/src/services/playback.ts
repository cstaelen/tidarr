import { Buffer } from "buffer";

import { parseManifest } from "../helpers/manifest";

/**
 * Retrieves playback URLs for a track from Tidal.
 * @param id Track ID
 * @param quality Requested quality (HI_RES_LOSSLESS, LOSSLESS, HIGH, LOW)
 * @param token Tidal authentication token
 * @param country Country code (e.g., "EN")
 * @returns Array of URLs or null if none are available
 */
export async function getPlaybackInfo(
  id: string,
  quality: string,
  token: string,
  country: string,
): Promise<string[] | null> {
  const url = `https://api.tidal.com/v1/tracks/${id}/playbackinfo?countryCode=${country}&audioquality=${quality}&playbackmode=STREAM&assetpresentation=FULL`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(
        `getPlaybackInfo: upstream responded ${res.status} for ${id} (${quality})`,
      );
      return null;
    }

    const data = await res.json();
    if (!data.manifest) return null;

    // Only accept BTS JSON manifests
    if (data.manifestMimeType !== "application/vnd.tidal.bts") {
      return null;
    }

    const decoded = Buffer.from(data.manifest, "base64").toString("utf8");
    const urls = parseManifest(decoded, data.manifestMimeType);

    return urls;
  } catch (err) {
    console.error("getPlaybackInfo error:", err);
    return null;
  }
}
