import React, { ReactNode, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { TIDAL_API_LISTEN_URL, TIDAL_ITEMS_PER_PAGE } from "../contants";
import {
  PlaylistType,
  TidalArtistResponseType,
  TidalResponseType,
  TrackType,
} from "../types";
import { fetchTidal } from "../utils/fetch";

type QualityType = "lossless" | "high" | "all";
type DisplayType = "small" | "large";

type SearchContextType = {
  searchResults: TidalResponseType;
  keywords: string | undefined;
  loading: boolean;
  page: number;
  quality: QualityType;
  display: DisplayType;
  actions: {
    setPage: (page: number) => void;
    setQuality: (quality: QualityType) => void;
    setDisplay: (mode: DisplayType) => void;
    runSearch: (keywords: string) => void;
    queryTidal: (query: string, page: number) => void;
  };
};

const SearchContext = React.createContext<SearchContextType>(
  {} as SearchContextType,
);

export const LOCALSTORAGE_QUALITY_FILTER = "tidarr-quality-filter";
export const LOCALSTORAGE_DISPLAY_MODE = "tidarr-display-mode";

export function SearchProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [keywords, setKeywords] = useState<string>();
  const [display, setDisplay] = useState<DisplayType>(
    (localStorage.getItem(LOCALSTORAGE_DISPLAY_MODE) as DisplayType) || "small",
  );
  const [quality, setQuality] = useState<QualityType>(
    (window._env_.REACT_APP_TIDARR_DEFAULT_QUALITY_FILTER as QualityType) ||
      (localStorage.getItem(LOCALSTORAGE_QUALITY_FILTER) as QualityType) ||
      "all",
  );

  const [searchResults, setSearchResults] = useState<TidalResponseType>(
    {} as TidalResponseType,
  );

  const [params] = useSearchParams();
  const navigate = useNavigate();

  async function runSearch(searchString: string) {
    setLoading(true);
    if (searchString.substring(0, 4) === "http") {
      await directDownload(searchString);
    } else {
      await queryTidal(searchString);
    }
    setLoading(false);
  }

  async function queryTidal(query: string) {
    const results = await fetchTidal<TidalResponseType>(
      `${TIDAL_API_LISTEN_URL}/search/top-hits?query=${query}&type=lossless&limit=${TIDAL_ITEMS_PER_PAGE}&offset=${
        (page - 1) * TIDAL_ITEMS_PER_PAGE
      }`,
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
    };

    setSearchResults(data);
  }

  async function directDownload(url: string) {
    const id = url
      .substring(url.lastIndexOf("/") + 1, url.length)
      .split("?")?.[0];
    const splittedUrl = url.split("/");
    const type = splittedUrl[splittedUrl?.length - 2].split("?")?.[0];

    setSearchResults({} as TidalResponseType);

    const data: TidalResponseType = {
      albums: { items: [], totalNumberOfItems: 0 },
      artists: { items: [], totalNumberOfItems: 0 },
      tracks: { items: [], totalNumberOfItems: 0 },
      playlists: { items: [], totalNumberOfItems: 0 },
    };

    // Artist url
    if (type === "artist") {
      navigate(`/artist/${id}`);

      return;
    }

    // Mix url
    if (type === "mix") {
      navigate(`/mix/${id}`);

      return;
    }

    // Album url
    if (type === "album") {
      const data_album = await fetchTidal<TidalArtistResponseType>(
        `${TIDAL_API_LISTEN_URL}/pages/album?albumId=${id}`,
      );

      data.albums = {
        items: [data_album.rows[0].modules[0].album],
        totalNumberOfItems: 1,
      };
    }

    // Track url
    if (type === "track") {
      const data_track = await fetchTidal<TrackType>(
        `${TIDAL_API_LISTEN_URL}/tracks/${id}`,
      );

      data.tracks = {
        items: [data_track],
        totalNumberOfItems: 1,
      };
    }

    // Playlist url
    if (type === "playlist") {
      const data_playlist = await fetchTidal<PlaylistType>(
        `${TIDAL_API_LISTEN_URL}/playlists/${id}`,
      );

      data.playlists = { items: [data_playlist], totalNumberOfItems: 1 };
    }

    setSearchResults(data);
  }

  // Fetch on page change
  useEffect(() => {
    if (keywords) runSearch(keywords);
  }, [page]);

  useEffect(() => {
    if (keywords) {
      window.scrollTo(0, 0);
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
    const search = params.get("query");
    if (search) {
      setKeywords(search);
      return;
    }
    setKeywords(undefined);
  }, [params]);

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_DISPLAY_MODE, display);
  }, [display]);

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_QUALITY_FILTER, quality);
  }, [quality]);

  const value = {
    searchResults,
    loading,
    keywords,
    page,
    quality,
    display,
    actions: {
      setPage,
      setQuality,
      setDisplay,
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
