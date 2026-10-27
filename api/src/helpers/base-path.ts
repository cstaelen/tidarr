/**
 * Returns the URL prefix the app is served under (from URL_BASE).
 * Always starts with "/" and never ends with one, or "" when served from the root.
 */
let warnedAboutSanitize = false;

export function getBasePath(): string {
  const raw = process.env.URL_BASE ?? "";

  // Whitelist chars: the value ends up inside the <base href> attribute.
  const trimmed = raw
    .replace(/[^\w\-./]/g, "")
    .replace(/\.{2,}/g, "")
    .replace(/^\/+|\/+$/g, "");

  const basePath = trimmed ? `/${trimmed}` : "";

  // Called on every Lidarr/playback request, so warn only once
  if (
    !warnedAboutSanitize &&
    raw &&
    basePath !== `/${raw.replace(/^\/+|\/+$/g, "")}`
  ) {
    warnedAboutSanitize = true;
    console.warn(
      `⚠️ [SERVER] URL_BASE "${raw}" contains unsupported characters, using "${basePath || "/"}" instead`,
    );
  }

  return basePath;
}
