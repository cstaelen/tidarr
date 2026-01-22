import { useState } from "react";
import { TIDARR_PROXY_URL } from "src/contants";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { ConfigTiddleType } from "src/types";

const jsonMimeType = "application/json";

type FetchTidalProps = {
  url: string;
  options?: RequestInit;
  tiddlConfig?: ConfigTiddleType;
  search?: FetchTidalSearchProps;
  resetTidalToken: () => void;
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
  search,
  resetTidalToken,
}: FetchTidalProps): Promise<T | undefined> {
  const countryCode = tiddlConfig?.auth.country_code || "EN";
  const apiUrl = `${TIDARR_PROXY_URL}/tidal`;

  options.headers = new Headers({ ...options?.headers });

  if (
    "undefined" !== options.body &&
    !(options.body instanceof FormData) &&
    null === options.headers.get("Content-Type")
  ) {
    options.headers.set("Content-Type", jsonMimeType);
  }

  const urlObj = new URL(url, "https://api.tidal.com");
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

  if (response.status === 401) {
    console.error("[FETCH_TIDAL] 401 - Token invalid");
    console.error("[FETCH_TIDAL] SubStatus:", data.subStatus);
    resetTidalToken();
    throw new Error(
      `Tidal authentication failed: ${data.userMessage || response.statusText}`,
    );
  }

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return data;
}

export function useFetchTidal() {
  const [loading, setLoading] = useState<boolean>(false);

  const {
    tiddlConfig,
    actions: { checkAPI },
  } = useConfigProvider();

  const {
    actions: { delete_token },
  } = useApiFetcher();

  const resetTidalToken = async () => {
    await delete_token();
    await checkAPI();
  };

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
      search: search,
      resetTidalToken: resetTidalToken,
    });

    setLoading(false);
    return data;
  }

  return {
    loading,
    fetchTidal: fetcher,
  };
}
