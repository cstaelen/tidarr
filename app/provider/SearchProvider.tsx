import React, { useContext, useState, ReactNode, useEffect } from "react";

import {
  TidalArtistAlbumsListType,
  TidalArtistModuleType,
  TidalArtistResponseType,
  TidalResponseType,
} from "../types";
import { useSearchParams } from "next/navigation";
import { fetchTidal } from "../utils/fetch";
import { TIDAL_ITEMS_PER_PAGE, TIDAL_API_LISTEN_URL } from "../contants";

type QualityType = "lossless" | "hi_res" | "all";

type SearchContextType = {
  searchResults: TidalResponseType;
  artistResults: TidalArtistModuleType[];
  keywords: string | undefined;
  loading: boolean;
  artistPagerLoading: number | undefined;
  page: number;
  quality: QualityType;
  actions: {
    performSearch: any;
    setPage: (page: number) => void;
    setQuality: (quality: QualityType) => void;
    fetchArtistPage: (url: string, index: number, offset: number) => void;
    queryTidal: (query: string, page: number) => void;
    queryArtist: (id: number, name: string, page: number) => void;
  };
};

const SearchContext = React.createContext<SearchContextType>(
  {} as SearchContextType
);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [keywords, setKeywords] = useState<string>();
  const [quality, setQuality] = useState<QualityType>("all");
  const [artistPagerLoading, setArtistPagerLoading] = useState<number>();
  const [searchResults, setSearchResults] = useState<TidalResponseType>(
    {} as TidalResponseType
  );
  const [artistResults, setArtistResults] = useState<TidalArtistModuleType[]>(
    [] as TidalArtistModuleType[]
  );

  const params = useSearchParams();

  function performSearch(e: any) {
    e.preventDefault();
    const searchString = e?.target?.[0]?.value as string;
    setKeywords(searchString);
  }

  function fetchData(searchString: string) {
    if (searchString.substring(0, 4) === "http") {
      directDownload(searchString);
    } else if (searchString.split(":").length > 2) {
      queryArtist(
        parseInt(searchString.split(":")[1]),
        searchString.split(":")[2]
      );
    } else {
      queryTidal(searchString);
    }
  }

  async function queryTidal(query: string) {
    setArtistResults([] as TidalArtistModuleType[]);
    setLoading(true);

    const results = await fetchTidal<TidalResponseType>(
      `${TIDAL_API_LISTEN_URL}/search/top-hits?query=${query}&type=lossless&limit=${TIDAL_ITEMS_PER_PAGE}&offset=${
        (page - 1) * TIDAL_ITEMS_PER_PAGE
      }`
    );

    const clone = { ...searchResults };
    const data = {
      albums: {
        ...results?.albums,
        items: [
          ...(page > 1 ? clone?.albums?.items || [] : []),
          ...results?.albums?.items,
        ],
      },
      artists: {
        ...results?.artists,
        items: [
          ...(page > 1 ? clone?.artists?.items || [] : []),
          ...results?.artists?.items,
        ],
      },
      tracks: {
        ...results?.tracks,
        items: [
          ...(page > 1 ? clone?.tracks?.items || [] : []),
          ...results?.tracks?.items,
        ],
      },
    };
    setSearchResults(data);
    postFetch(query);
  }

  async function queryArtist(id: number, name: string) {
    setSearchResults({} as TidalResponseType);
    setArtistResults([] as TidalArtistModuleType[]);
    setLoading(true);

    const data_artist = await fetchTidal<TidalArtistResponseType>(
      `${TIDAL_API_LISTEN_URL}/pages/artist?artistId=${id}`
    );

    if (data_artist?.rows?.length > 0) {
      const album_block = data_artist?.rows
        .filter(
          (row) =>
            row.modules.filter((module) => module.type === "ALBUM_LIST")
              .length > 0
        )
        .map((row) => row.modules[0])
        .map((block) => ({
          ...block,
          pagedList: {
            ...block.pagedList,
            items: block.pagedList.items.slice(0, TIDAL_ITEMS_PER_PAGE),
          },
        }));
      setArtistResults(album_block);
    }

    postFetch(`artist:${id}:${data_artist.title}`);
  }

  async function directDownload(url: string) {
    const id = url.substring(url.lastIndexOf("/") + 1, url.length);
    const splittedUrl = url.split("/");
    const type = splittedUrl[splittedUrl?.length - 2];

    if (type === "artist") {
      queryArtist(parseInt(id), "");
    }
    if (type === "album") {
      setSearchResults({} as TidalResponseType);
      setArtistResults([] as TidalArtistModuleType[]);
      setLoading(true);

      const data_album = await fetchTidal<TidalArtistResponseType>(
        `${TIDAL_API_LISTEN_URL}/pages/album?albumId=${id}`
      );

      const data: any = {
        albums: {
          items: [data_album.rows[0].modules[0].album],
          totalNumberOfItems: 1,
        },
        artists: { items: [], totalNumberOfItems: 0 },
        tracks: { items: [], totalNumberOfItems: 0 },
      };
      setSearchResults(data);
      postFetch(url);
    }
  }

  async function fetchArtistPage(url: string, index: number, page: number) {
    setArtistPagerLoading(index);
    const data_artist_page = await fetchTidal<TidalArtistAlbumsListType>(
      `${TIDAL_API_LISTEN_URL}/${url}&limit=${TIDAL_ITEMS_PER_PAGE}&offset=${
        page * TIDAL_ITEMS_PER_PAGE
      }`
    );

    if (data_artist_page?.items?.length > 0) {
      const clone: TidalArtistModuleType[] = [...artistResults];
      const updatedData = {
        ...artistResults[index],
        pagedList: {
          ...clone[index].pagedList,
          items: [
            ...artistResults[index].pagedList.items,
            ...data_artist_page?.items,
          ],
        },
      };
      clone[index] = updatedData;

      setArtistResults(clone);
      setArtistPagerLoading(undefined);
    }
  }

  function postFetch(searchString: string) {
    if (document.getElementById("filled-basic")) {
      (document.getElementById("filled-basic") as HTMLInputElement).value =
        searchString;
    }
    history.pushState({}, "pushState search", `/?query=${searchString}`);
    setLoading(false);
  }

  // Fetch on page change
  useEffect(() => {
    if (keywords) fetchData(keywords);
  }, [page]);

  useEffect(() => {
    if (keywords) {
      setSearchResults({} as TidalResponseType);
      setPage(1);
      fetchData(keywords);
      window.scrollTo(0, 0);
    }
  }, [keywords]);

  // If url query exists on load
  useEffect(() => {
    const search = params.get("query");
    if (search) {
      setKeywords(search);
    }
  }, [params]);

  const value = {
    searchResults,
    artistResults,
    loading,
    artistPagerLoading,
    keywords,
    page,
    quality,
    actions: {
      performSearch,
      setPage,
      setQuality,
      queryTidal,
      queryArtist,
      fetchArtistPage,
    },
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export const useSearchProvider = () => {
  return useContext(SearchContext);
};
