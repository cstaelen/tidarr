import { useState } from "react";
import { TIDAL_API_URL, TIDARR_PROXY_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { ConfigTiddleType } from "src/types";

const jsonMimeType = "application/json";

async function fetchTidal<T>(
  url: string,
  options: RequestInit = {},
  tiddlConfig?: ConfigTiddleType,
  useProxy?: boolean,
): Promise<T | undefined> {
  const countryCode = tiddlConfig?.auth.country_code || "EN";
  const TOKEN = tiddlConfig?.auth.token;

  let apiUrl = useProxy ? TIDARR_PROXY_URL : TIDAL_API_URL;

  if (import.meta.env.MODE !== "development") {
    apiUrl = apiUrl.replace("http://localhost:8484", "");
  }

  options.headers = new Headers({
    ...options?.headers,
    Authorization: `Bearer ${TOKEN}`,
  });

  const url_suffix = `${url.includes("?") ? "&" : "?"}countryCode=${countryCode}&deviceType=BROWSER&locale=en_US`;
  // POST, PUT payload encoding
  if (
    "undefined" !== options.body &&
    !(options.body instanceof FormData) &&
    null === options.headers.get("Content-Type")
  ) {
    options.headers.set("Content-Type", jsonMimeType);
  }

  const response = await fetch(`${apiUrl}${url}${url_suffix}`, {
    ...options,
  });

  // success

  return await response.json();
}

export function useFetchTidal() {
  const { tiddlConfig, config } = useConfigProvider();
  const [loading, setLoading] = useState<boolean>(false);

  async function fetcher<T>(url: string, options?: RequestInit) {
    setLoading(true);
    const data = await fetchTidal<T>(
      url,
      options,
      tiddlConfig,
      config?.ENABLE_TIDAL_PROXY === "true",
    );
    setLoading(false);
    return data;
  }

  return {
    loading,
    fetchTidal: fetcher,
  };
}
