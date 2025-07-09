import { useConfigProvider } from "src/provider/ConfigProvider";

import { TIDAL_API_LISTEN_URL } from "../contants";

const jsonMimeType = "application/json";

async function fetchTidal<T>(
  url: string,
  options: RequestInit = {},
  countryCode: string,
): Promise<T | undefined> {
  const TOKEN = window._env_.REACT_APP_TIDAL_SEARCH_TOKEN;

  options.headers = new Headers(options?.headers);

  const url_suffix = `${url.includes("?") ? "&" : "?"}token=${TOKEN}&countryCode=${countryCode}&deviceType=BROWSER&locale=en_US`;
  // POST, PUT payload encoding
  if (
    "undefined" !== options.body &&
    !(options.body instanceof FormData) &&
    null === options.headers.get("Content-Type")
  ) {
    options.headers.set("Content-Type", jsonMimeType);
  }

  const response = await fetch(`${TIDAL_API_LISTEN_URL}${url}${url_suffix}`, {
    ...options,
  });

  // success

  if (response?.ok) {
    return await response.json();
  }
}

export function useFetchTidal() {
  const { tiddlConfig } = useConfigProvider();

  function fetcher<T>(url: string, options?: RequestInit) {
    return fetchTidal<T>(url, options, tiddlConfig?.auth.country_code || "EN");
  }

  return {
    fetchTidal: fetcher,
  };
}
