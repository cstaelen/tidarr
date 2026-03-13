import React, { ReactNode, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFetchTidal } from "src/hooks/useFetchTidal";

import { TIDAL_ITEMS_PER_PAGE } from "../contants";
import { TidalResponseType } from "../types";

import { useConfigProvider } from "./ConfigProvider";

type SearchContextType = {
  searchResults: TidalResponseType;
  keywords: string | undefined;
  loading: boolean;
  page: number;
  actions: {
    setPage: (page: number) => void;
    runSearch: (keywords: string) => void;
    queryTidal: (query: string, page: number) => void;
  };
};

const SearchContext = React.createContext<SearchContextType>(
  {} as SearchContextType,
);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [keywords, setKeywords] = useState<string>();
  const { config } = useConfigProvider();

  const [searchResults, setSearchResults] = useState<TidalResponseType>(
    {} as TidalResponseType,
  );

  const params = useParams();

  const { fetchTidal } = useFetchTidal();

  async function runSearch(searchString: string) {
    setLoading(true);
    await queryTidal(searchString);
    setLoading(false);
  }

  async function queryTidal(query: string) {
    const results = await fetchTidal<TidalResponseType>(
      "/v1/search",
      {},
      {
        query: query,
        offset: (page - 1) * TIDAL_ITEMS_PER_PAGE,
        limit: TIDAL_ITEMS_PER_PAGE,
      },
    );

    const clone = { ...searchResults };
    const data = {
      albums: {
        ...results?.albums,
        items: [
          ...(page > 1 ? clone?.albums?.items || [] : []),
          ...(results?.albums?.items || []),
        ],
      },
      artists: {
        ...results?.artists,
        items: [
          ...(page > 1 ? clone?.artists?.items || [] : []),
          ...(results?.artists?.items || []),
        ],
      },
      tracks: {
        ...results?.tracks,
        items: [
          ...(page > 1 ? clone?.tracks?.items || [] : []),
          ...(results?.tracks?.items || []),
        ],
      },
      playlists: {
        ...results?.playlists,
        items: [
          ...(page > 1 ? clone?.playlists?.items || [] : []),
          ...(results?.playlists?.items || []),
        ],
      },
      videos: {
        ...results?.videos,
        items: [
          ...(page > 1 ? clone?.videos?.items || [] : []),
          ...(results?.videos?.items || []),
        ],
      },
    };

    setSearchResults(data as TidalResponseType);
  }

  // Fetch on page change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (keywords) runSearch(keywords);
  }, [page]);

  useEffect(() => {
    if (keywords) {
      // window.scrollTo(0, 0);

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults({} as TidalResponseType);
      if (page > 1) {
        setPage(1);
        return;
      }

      runSearch(keywords);
    }
  }, [keywords]);

  // If url query exists on load
  useEffect(() => {
    if (!params.keywords || !config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKeywords(undefined);
      return;
    }

    setKeywords(params.keywords);
  }, [params, config]);

  const value = {
    searchResults,
    loading,
    keywords,
    page,
    actions: {
      setPage,
      queryTidal,
      runSearch,
    },
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export const useSearchProvider = () => {
  return useContext(SearchContext);
};
