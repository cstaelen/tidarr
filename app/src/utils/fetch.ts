const jsonMimeType = "application/json";

export async function fetchTidal<T>(
  url: string,
  options: RequestInit = {},
): Promise<T | undefined> {
  const TOKEN = window._env_.REACT_APP_TIDAL_SEARCH_TOKEN;
  const COUNTRY = window._env_.REACT_APP_TIDAL_COUNTRY_CODE;

  options.headers = new Headers(options?.headers);

  const url_suffix = `${url.includes("?") ? "&" : "?"}token=${TOKEN}&countryCode=${COUNTRY}&deviceType=BROWSER&locale=en_US`;
  // POST, PUT payload encoding
  if (
    "undefined" !== options.body &&
    !(options.body instanceof FormData) &&
    null === options.headers.get("Content-Type")
  ) {
    options.headers.set("Content-Type", jsonMimeType);
  }

  const response = await fetch(`${url}${url_suffix}`, {
    ...options,
  });

  // success

  if (response?.ok) {
    return await response.json();
  }
}
