import React, {
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { TidalResponseType } from "../types";
import { tidalDL } from "./server";

type TidalContextType = {
  searchResults: TidalResponseType;
  loading: boolean;
  processingList: ProcessingItemType[] | undefined;
  page: number;
  itemPerPage: number;
  actions: {
    performSearch: any;
    save: (urlToSave: string, id: number, artist: string, title: string, type: "album" | "track" | "artist") => void;
    setPage: (page: number) => void;
  };
};

type ProcessingItemType = {
  id: number;
  artist: string;
  title: string;
  type: string;
  url: string;
  loading: boolean;
  error: boolean;
}

const TidalContext = React.createContext<TidalContextType>(
  {} as TidalContextType
);

export function TidalProvider({ children }: { children: ReactNode }) {
  const itemPerPage = 20;
  const [processingList, setProcessingList] = useState<ProcessingItemType[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [searchResults, setSearchResults] = useState<TidalResponseType>(
    {} as TidalResponseType
  );
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (params?.get('query')) {
      search(page);
    }
  }, [params, page]);

  const performSearch = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/?query=${e?.target?.[0]?.value}`);
    return false;
  };

  const search = async (page: number) => {
    setLoading(true);
    const token = process.env.NEXT_PUBLIC_TIDAL_SEARCH_TOKEN || 'CzET4vdadNUFQ5JU';
    const country = process.env.NEXT_PUBLIC_TIDAL_COUNTRY_CODE || 'CA';
    const url = `https://listen.tidal.com/v1/search/top-hits?query=${params?.get('query')}&limit=${itemPerPage}&token=${token}&countryCode=${country}&offset=${(page - 1) * itemPerPage}`;
    const response = await fetch(url);
    const results: TidalResponseType = await response.json();

    const clone = searchResults;
    const data = {
      albums: { ...results?.albums, items: [...(clone?.albums?.items || []), ...results?.albums?.items] },
      artists: { ...results?.artists, items: [...(clone?.artists?.items || []), ...results?.artists?.items] },
      tracks: { ...results?.tracks, items: [...(clone?.tracks?.items || []), ...results?.tracks?.items] },
    };
    setSearchResults(data);
    setLoading(false);
  };

  const save = async (urlToSave: string, id: number, artist: string, title: string, type: string) => {
    const item = {
      id: id,
      artist: artist,
      title: title,
      type: type,
      loading: true,
      error: false,
      url: urlToSave,
    }
    setProcessingList([...(processingList || []), item]);

    try {
      const response = await tidalDL(urlToSave);

      setProcessingList([...(processingList || []), {
        ...item,
        loading: false,
      }]);
    } catch (err: any) {
      setProcessingList([...(processingList || []), {
        ...item,
        loading: false,
        error: true,
      }]);
    }

    // const url = "/api/save";
    //   console.log("saving url", urlToSave);
    //   const data = {
    //     url: urlToSave,
    //   };
    //   const body = JSON.stringify(data);

    // const resp = await fetch(url, {
    //   method: "POST",
    //   body: body,
    //   headers: { "content-type": "application/json; charset=UTF-8" },
    // });
    // console.log("resp", resp);
  };

  const value = {
    searchResults,
    processingList,
    loading,
    itemPerPage,
    page,
    actions: {
      performSearch,
      save,
      setPage,
    },
  };

  return (
    <TidalContext.Provider value={value}>{children}</TidalContext.Provider>
  );
}

export const useTidalProvider = () => {
  return useContext(TidalContext);
};
