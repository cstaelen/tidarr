import { useState } from "react";
import { TIDAL_API_URL, TIDARR_PROXY_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { ConfigTiddleType } from "src/types";

const jsonMimeType = "application/json";

type FetchTidalProps = {
  url: string;
  options?: RequestInit;
  tiddlConfig?: ConfigTiddleType;
  useProxy?: boolean;
  search?: FetchTidalSearchProps;
};

export type FetchTidalSearchProps = {
  order?: string;
  orderDirection?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
  albumId?: string;
  mixId?: string;
  query?: string;
};

async function fetchTidal<T>({
  url,
  options = {},
  tiddlConfig,
  useProxy,
  search,
}: FetchTidalProps): Promise<T | undefined> {
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

  // POST, PUT payload encoding
  if (
    "undefined" !== options.body &&
    !(options.body instanceof FormData) &&
    null === options.headers.get("Content-Type")
  ) {
    options.headers.set("Content-Type", jsonMimeType);
  }

  const urlObj = new URL(url, TIDARR_PROXY_URL);
  urlObj.searchParams.append("countryCode", countryCode);
  urlObj.searchParams.append("deviceType", "BROWSER");
  urlObj.searchParams.append("locale", "en_US");

  Object.entries(search || {})?.map(([key, value]) => {
    if (!value) return;
    urlObj.searchParams.append(key, value?.toString());
  });

  const urlWithParams = `${apiUrl}${urlObj.pathname}${urlObj.search}`;

  const response = await fetch(urlWithParams, options);
  const data = await response.json();

  // 401
  if (response.status === 401 && data.subStatus === 11003) {
    window.location.reload();
    return;
  }

  // Error
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  // success
  return data;
}

export function useFetchTidal() {
  const { tiddlConfig, config } = useConfigProvider();
  const [loading, setLoading] = useState<boolean>(false);

  async function fetcher<T>(
    url: string,
    options?: RequestInit,
    search?: FetchTidalSearchProps,
  ) {
    setLoading(true);
    const data = await fetchTidal<T>({
      url: url,
      options: options || {},
      tiddlConfig: tiddlConfig,
      useProxy: config?.ENABLE_TIDAL_PROXY === "true",
      search: search,
    });
    setLoading(false);
    return data;
  }

  return {
    loading,
    fetchTidal: fetcher,
  };
}
