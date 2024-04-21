const jsonMimeType = "application/json";

export async function fetchTidal<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const TOKEN = window._env_.NEXT_PUBLIC_TIDAL_SEARCH_TOKEN;
  const COUNTRY = window._env_.NEXT_PUBLIC_TIDAL_COUNTRY_CODE;

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

  // error

  if (500 <= response?.status) {
    throw new Error("An error occured");
  }
  if (403 === response?.status) {
    throw new Error("Authorization error");
  }
  if (404 === response?.status) {
    throw new Error("Not found");
  }

  throw new Error();
}
