import { useState } from "react";
import { TIDAL_API_URL, TIDARR_PROXY_URL } from "src/contants";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { ConfigTiddleType } from "src/types";

const jsonMimeType = "application/json";

type FetchTidalProps = {
  url: string;
  options?: RequestInit;
  tiddlConfig?: ConfigTiddleType;
  useProxy?: boolean;
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
  useProxy,
  search,
  resetTidalToken,
}: FetchTidalProps): Promise<T | undefined> {
  const countryCode = tiddlConfig?.auth.country_code || "EN";

  const apiUrl = useProxy ? `${TIDARR_PROXY_URL}/tidal` : TIDAL_API_URL;

  // Mode proxy: Backend gère le token automatiquement, pas besoin de l'envoyer
  // Mode direct: Récupérer le token depuis l'API backend
  if (useProxy) {
    // Proxy mode: No Authorization header needed (backend adds it)
    options.headers = new Headers({
      ...options?.headers,
    });
  } else {
    // Direct mode: Get fresh token from backend
    try {
      const tokenResponse = await fetch(`${TIDARR_PROXY_URL}/tidal/token`);
      if (!tokenResponse.ok) {
        throw new Error("Failed to get Tidal token from backend");
      }
      const { token } = await tokenResponse.json();
      options.headers = new Headers({
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error("[FETCH_TIDAL] Failed to get token:", error);
      throw error;
    }
  }

  // POST, PUT payload encoding
  if (
    "undefined" !== options.body &&
    !(options.body instanceof FormData) &&
    null === options.headers.get("Content-Type")
  ) {
    options.headers.set("Content-Type", jsonMimeType);
  }

  // Use TIDAL_API_URL as base for URL parsing (always absolute)
  const urlObj = new URL(url, TIDAL_API_URL);
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

  // 401 - Token invalid or expired
  if (response.status === 401) {
    console.error("[FETCH_TIDAL] 401 Unauthorized - Token invalid");
    console.error("[FETCH_TIDAL] SubStatus:", data.subStatus);

    // All 401 errors mean the token is invalid
    // User needs to re-authenticate
    resetTidalToken();
    throw new Error(
      `Tidal authentication failed: ${data.userMessage || response.statusText}`,
    );
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
      useProxy: config?.ENABLE_TIDAL_PROXY === "true",
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
