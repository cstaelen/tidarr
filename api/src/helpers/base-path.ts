/**
 * Returns the URL prefix the app is served under (from URL_BASE).
 * Always starts with "/" and never ends with one, or "" when served from the root.
 */
export function getBasePath(): string {
  // Whitelist chars: the value ends up inside the <base href> attribute
  const trimmed = (process.env.URL_BASE ?? "")
    .replace(/[^\w\-./]/g, "")
    .replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}
