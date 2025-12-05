import { useState } from "react";
import { TIDAL_API_URL, TIDARR_PROXY_URL } from "src/contants";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { ConfigTiddleType } from "src/types";
import { getApiUrl } from "src/utils/helpers";

const jsonMimeType = "application/json";

type FetchTidalProps = {
  url: string;
  options?: RequestInit;
  tiddlConfig?: ConfigTiddleType;
  useProxy?: boolean;
  search?: FetchTidalSearchProps;
  resetTidalToken: () => void;
  reloadTidalToken: () => Promise<ConfigTiddleType | undefined>;
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
  resetTidalToken,
  reloadTidalToken,
  retryCount = 0,
}: FetchTidalProps & { retryCount?: number }): Promise<T | undefined> {
  const countryCode = tiddlConfig?.auth.country_code || "EN";
  const TOKEN = tiddlConfig?.auth.token;

  const apiUrl = getApiUrl(
    useProxy ? `${TIDARR_PROXY_URL}/tidal` : TIDAL_API_URL,
  );

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
  if (response.status === 401) {
    switch (data.subStatus) {
      // Token needs refresh - reload config to get refreshed token from backend
      case 11003: {
        // Prevent infinite loop by limiting retries
        if (retryCount >= 3) {
          console.error(
            "[useFetchTidal] Token refresh retry limit reached. Resetting token.",
          );
          resetTidalToken();
          throw new Error("Token refresh failed after 3 attempts");
        }

        console.log(
          `[useFetchTidal] Token expired, reloading config... (attempt ${retryCount + 1}/3)`,
        );
        console.log(
          "[useFetchTidal] Old token:",
          tiddlConfig?.auth?.token?.substring(0, 50),
        );
        const updatedConfig = await reloadTidalToken();
        console.log(
          "[useFetchTidal] New token:",
          updatedConfig?.auth?.token?.substring(0, 50),
        );

        // Check if token actually changed
        if (
          tiddlConfig?.auth?.token &&
          updatedConfig?.auth?.token === tiddlConfig?.auth?.token
        ) {
          console.warn(
            "[useFetchTidal] Token unchanged after refresh attempt. Waiting before retry...",
          );
          // Wait 1 second before retrying to avoid rapid loops
          await new Promise((r) => setTimeout(r, 1000));
        }

        // Retry the same request with the refreshed token from backend
        return fetchTidal({
          url,
          options,
          tiddlConfig: updatedConfig,
          useProxy,
          search,
          resetTidalToken,
          reloadTidalToken,
          retryCount: retryCount + 1,
        });
      }

      // Token expired
      // Session not valid
      case 6001:
      case 11002:
        resetTidalToken();
        throw new Error(response.statusText);
    }
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
  const [loading, setLoading] = useState<boolean>(false);

  const {
    tiddlConfig,
    config,
    actions: { checkAPI },
  } = useConfigProvider();

  const {
    actions: { delete_token, get_settings },
  } = useApiFetcher();

  const resetTidalToken = async () => {
    await delete_token();
    await checkAPI();
  };

  const reloadTidalToken = async () => {
    // Reload config to get the refreshed token from backend
    const settings = await get_settings();
    // Also update the context state
    await checkAPI();
    return settings?.tiddl_config;
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
      useProxy: config?.ENABLE_TIDAL_PROXY === "true",
      search: search,
      resetTidalToken: resetTidalToken,
      reloadTidalToken: reloadTidalToken,
    });

    setLoading(false);
    return data;
  }

  return {
    loading,
    fetchTidal: fetcher,
  };
}
