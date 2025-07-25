import { ReactNode, useContext, useState } from "react";
import React from "react";
import { useFetchTidal } from "src/utils/useFetchTidal";

import { TIDAL_ITEMS_PER_PAGE } from "../contants";
import {
  AlbumType,
  ArtistType,
  TidalModuleListType,
  TidalModuleResponseType,
  TidalPagedListType,
  VideoType,
} from "../types";

type ArtistResultsType = {
  title: string;
  artist: ArtistType | undefined;
  blocks: TidalModuleListType<AlbumType | VideoType>[];
};

type ArtistContextType = {
  loading: boolean;
  artistResults: ArtistResultsType;
  artistPagerLoading: number | undefined;
  actions: {
    queryArtist: (id: string) => void;
    queryArtistPage: (url: string, index: number, offset: number) => void;
  };
};

const ArtistContext = React.createContext<ArtistContextType>(
  {} as ArtistContextType,
);

export function ArtistProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [artistPagerLoading, setArtistPagerLoading] = useState<number>();
  const [artistResults, setArtistResults] = useState<ArtistResultsType>(
    {} as ArtistResultsType,
  );
  const { fetchTidal } = useFetchTidal();

  async function queryArtist(id: string) {
    setLoading(true);

    const data_artist = await fetchTidal<
      TidalModuleResponseType<AlbumType | VideoType>
    >(`/pages/artist?artistId=${id}`);

    if (data_artist && data_artist?.rows?.length > 0) {
      const blocks = data_artist?.rows
        .filter(
          (row) =>
            row.modules.filter(
              (module) =>
                module.type === "ALBUM_LIST" || module.type === "VIDEO_LIST",
            ).length > 0,
        )
        .map((row) => row.modules[0])
        .map((block) => ({
          ...block,
          pagedList: {
            ...block.pagedList,
            items: block.pagedList.items.slice(0, TIDAL_ITEMS_PER_PAGE),
          },
        }));
      setArtistResults({
        title: data_artist.title,
        blocks: blocks,
        artist: data_artist.rows[0].modules[0]?.artist,
      });
    }

    setLoading(false);
  }

  async function queryArtistPage(url: string, index: number, page: number) {
    setArtistPagerLoading(index);
    const data_artist_page = await fetchTidal<TidalPagedListType<AlbumType>>(
      `/${url}&limit=${TIDAL_ITEMS_PER_PAGE}&offset=${
        page * TIDAL_ITEMS_PER_PAGE
      }`,
    );

    if (data_artist_page && data_artist_page?.items?.length > 0) {
      const clone: TidalModuleListType<AlbumType | VideoType>[] = [
        ...(artistResults?.blocks || []),
      ];
      const updatedData = {
        ...artistResults?.blocks?.[index],
        pagedList: {
          ...clone[index].pagedList,
          items: [
            ...(artistResults?.blocks?.[index].pagedList.items || []),
            ...(data_artist_page?.items || []),
          ],
        },
      };
      clone[index] = updatedData;

      setArtistResults({ ...artistResults, blocks: clone });
      setArtistPagerLoading(undefined);
    }
  }

  const value = {
    artistResults,
    loading,
    artistPagerLoading,
    actions: {
      queryArtist,
      queryArtistPage,
    },
  };

  return (
    <ArtistContext.Provider value={value}>{children}</ArtistContext.Provider>
  );
}

export const useArtist = () => {
  return useContext(ArtistContext);
};
