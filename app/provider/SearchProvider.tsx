import React, {
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { AlbumType, TidalResponseType, TrackType } from "../types";

type SearchContextType = {
  searchResults: TidalResponseType;
  loading: boolean;
  page: number;
  itemPerPage: number;
  processingList: ProcessingItemType[];
  actions: {
    performSearch: any;
    setPage: (page: number) => void;
    setProcessingList: Function;
    addItem: Function;
    queryTidal: (query: string, page: number) => void;
  };
};

export type ProcessingItemType = {
  id: number;
  artist: string;
  title: string;
  type: "artist" | "album" | "track";
  status: "queue" | "finished" | "beet" | "downloading" | "error";
  url: string;
  loading: boolean;
  error: boolean;
}

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
  const [processingList, setProcessingList] = useState<ProcessingItemType[]>([]);

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
  }

  const addItem = (item: AlbumType | TrackType, type: 'album' | 'track') => {
    if (processingList.filter(row => row.id === item.id)?.length > 0) return null;

    const itemToProcess: ProcessingItemType = {
      id: item.id,
      artist: item.artists?.[0].name,
      title: item?.title,
      type: type,
      status: 'queue',
      loading: true,
      error: false,
      url: item.url,
    }

    setProcessingList([...processingList, itemToProcess]);
  };

  useEffect(() => {
    if (keywords) queryTidal(keywords, page);
  }, [page])

  const value = {
    searchResults,
    loading,
    itemPerPage,
    page,
    processingList,
    actions: {
      performSearch,
      setPage,
      setProcessingList,
      addItem,
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
