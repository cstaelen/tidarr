import React, {
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { TidalResponseType } from "../types";
import { useSearchParams } from "next/navigation";

type SearchContextType = {
  searchResults: TidalResponseType;
  loading: boolean;
  page: number;
  itemPerPage: number;
  actions: {
    performSearch: any;
    setPage: (page: number) => void;
    queryTidal: (query: string, page: number) => void;
  };
};

const SearchContext = React.createContext<SearchContextType>(
  {} as SearchContextType
);

export function SearchProvider({ children }: { children: ReactNode }) {
  const itemPerPage = 10;
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [keywords, setKeywords] = useState<string>();
  const [searchResults, setSearchResults] = useState<TidalResponseType>(
    {} as TidalResponseType
  );

  const params = useSearchParams();

  const performSearch = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    queryTidal(e?.target?.[0]?.value, 1);
  };

  const queryTidal = async (query: string, page: number = 1) => {
    const token = process.env.NEXT_PUBLIC_TIDAL_SEARCH_TOKEN || 'CzET4vdadNUFQ5JU';
    const country = process.env.NEXT_PUBLIC_TIDAL_COUNTRY_CODE || 'CA';
    const url = `https://listen.tidal.com/v1/search/top-hits?query=${query}&limit=${itemPerPage}&token=${token}&countryCode=${country}&offset=${(page - 1) * itemPerPage}`;
    const response = await fetch(url);
    const results: TidalResponseType = await response.json();

    const clone = { ...searchResults };
    const data = {
      albums: { ...results?.albums, items: [...(page > 1 ? (clone?.albums?.items || []) : []), ...results?.albums?.items] },
      artists: { ...results?.artists, items: [...(page > 1 ? (clone?.artists?.items || []) : []), ...results?.artists?.items] },
      tracks: { ...results?.tracks, items: [...(page > 1 ? (clone?.tracks?.items || []) : []), ...results?.tracks?.items] },
    };
    setSearchResults(data);
    if (document.getElementById('filled-basic')) {
      (document.getElementById('filled-basic') as HTMLInputElement).value = query;
    }
    setKeywords(query);
    setPage(page);
    setLoading(false);
    history.pushState({}, "pushState search", `/?query=${query}`);
  }

  // Fetch on page change
  useEffect(() => {
    if (keywords) queryTidal(keywords, page);
  }, [page]);

  // If url query exists on load
  useEffect(() => {
    const query = params.get('query');
    if (query) 
      queryTidal(query, 1);
  }, []);

  const value = {
    searchResults,
    loading,
    itemPerPage,
    page,
    actions: {
      performSearch,
      setPage,
      queryTidal,
    },
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export const useSearchProvider = () => {
  return useContext(SearchContext);
};
