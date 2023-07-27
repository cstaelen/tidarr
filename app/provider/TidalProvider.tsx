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
  actions: {
    performSearch: any;
    save: any;
  };
};

const TidalContext = React.createContext<TidalContextType>(
  {} as TidalContextType
);

export function TidalProvider({ children }: { children: ReactNode }) {
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
    console.log("performSearch");
    console.log("searching for ", params?.get('query'));

    console.log(process.env);
    const token = process.env.NEXT_PUBLIC_TIDAL_SEARCH_TOKEN;
    const country = process.env.NEXT_PUBLIC_TIDAL_COUNTRY_CODE;
    const url = `https://api.tidalhifi.com/v1/search?query=${params?.get('query')}&limit=20&token=${token}&countryCode=${country}`;
    console.log(`url: ${url}`);
    const response = await fetch(url);
    const results: TidalResponseType = await response.json();
    console.log("search results", results);

    setSearchResults(results);
    return false;
  };

  const save = async (urlToSave: string) => {
    await tidalDL(urlToSave);
  };

  const value = {
    searchResults,
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
