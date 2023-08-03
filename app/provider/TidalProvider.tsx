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
  actions: {
    performSearch: any;
    save: any;
  };
};

const TidalContext = React.createContext<TidalContextType>(
  {} as TidalContextType
);

export function TidalProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<TidalResponseType>(
    {} as TidalResponseType
  );
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (params?.get('query')) {
      search();
    }
  }, [params]);

  const performSearch = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/?query=${e?.target?.[0]?.value}`);
    return false;
  };

  const search = async () => {
    setLoading(true);
    const token = process.env.NEXT_PUBLIC_TIDAL_SEARCH_TOKEN || 'CzET4vdadNUFQ5JU';
    const country = process.env.NEXT_PUBLIC_TIDAL_COUNTRY_CODE || 'CA';
    const url = `https://listen.tidal.com/v1/search/top-hits?query=${params?.get('query')}&limit=20&token=${token}&countryCode=${country}`;
    const response = await fetch(url);
    const results: TidalResponseType = await response.json();

    setSearchResults(results);
    setLoading(false);
  };

  const save = async (urlToSave: string) => {
    return await tidalDL(urlToSave);
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
    loading,
    actions: {
      performSearch,
      save,
    },
  };

  return (
    <TidalContext.Provider value={value}>{children}</TidalContext.Provider>
  );
}

export const useTidalProvider = () => {
  return useContext(TidalContext);
};
