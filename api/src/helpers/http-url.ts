/**
 * Prefixes a scheme-less host with http://, the way curl used to guess it.
 * Notification URLs are documented as `<url|ip:port>` and fetch rejects anything
 * without an absolute scheme, so `192.168.1.5:8080` has to be completed here.
 *
 * @param url - URL or bare `host:port` coming from the environment
 * @returns An absolute URL fetch can parse
 */
export function withHttpScheme(url: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`;
}
