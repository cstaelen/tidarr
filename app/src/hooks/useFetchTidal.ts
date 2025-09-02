import { useState } from "react";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { ConfigTiddleType } from "src/types";

import { TIDAL_API_URL } from "../contants";

const jsonMimeType = "application/json";

async function fetchTidal<T>(
  url: string,
  options: RequestInit = {},
  tiddlConfig?: ConfigTiddleType,
): Promise<T | undefined> {
  const countryCode = tiddlConfig?.auth.country_code || "EN";
  const TOKEN = tiddlConfig?.auth.token;

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

  const response = await fetch(`${TIDAL_API_URL}${url}${url_suffix}`, {
    ...options,
  });

  // success

  return await response.json();
}

export function useFetchTidal() {
  const { tiddlConfig } = useConfigProvider();
  const [loading, setLoading] = useState<boolean>(false);

  async function fetcher<T>(url: string, options?: RequestInit) {
    setLoading(true);
    const data = await fetchTidal<T>(url, options, tiddlConfig);
    setLoading(false);
    return data;
  }

  return {
    loading,
    fetchTidal: fetcher,
  };
}
