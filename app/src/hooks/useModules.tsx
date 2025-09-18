import { useState } from "react";
import { FetchTidalSearchProps, useFetchTidal } from "src/hooks/useFetchTidal";

import {
  AlbumType,
  ArtistType,
  PlaylistType,
  TidalModuleListType,
  TidalModuleResponseType,
  TidalPagedListType,
  TrackType,
  VideoType,
} from "../types";

export type ModuleListResponseType = TidalModuleResponseType<
  AlbumType | TrackType | PlaylistType | VideoType | ArtistType
>;

export type ModuleResponseType = TidalModuleListType<
  AlbumType | TrackType | PlaylistType | VideoType | ArtistType
>;

export type PagedModuleResponseType = TidalPagedListType<
  AlbumType | TrackType | PlaylistType | VideoType | ArtistType
>;

type ModuleContextType = {
  loading: boolean;
  pagedModuleLoading: boolean;
  data: ModuleListResponseType | undefined;
  actions: {
    queryModules: (endpoint: string, search?: FetchTidalSearchProps) => void;
    queryModulePage: (
      url: string,
      page: number,
      limit: number,
      search?: FetchTidalSearchProps,
    ) => Promise<PagedModuleResponseType | undefined>;
  };
};

export const useModules = (): ModuleContextType => {
  const [loading, setLoading] = useState<boolean>(false);
  const [pagedModuleLoading, setPagedModuleLoading] = useState<boolean>(false);
  const [data, setData] = useState<ModuleListResponseType>();

  const { fetchTidal } = useFetchTidal();

  async function queryModules(
    endpoint: string,
    search?: FetchTidalSearchProps,
  ) {
    setLoading(true);

    const response = await fetchTidal<ModuleListResponseType>(
      endpoint,
      {},
      search,
    );

    setData(response);
    setLoading(false);
  }

  async function queryModulePage(
    url: string,
    page: number,
    limit: number,
    search?: FetchTidalSearchProps,
  ) {
    setPagedModuleLoading(true);
    const modulePageData = await fetchTidal<PagedModuleResponseType>(
      url,
      {},
      {
        limit: limit,
        offset: page * limit,
        ...search,
      },
    );
    setPagedModuleLoading(false);

    return modulePageData;
  }

  return {
    data,
    loading,
    pagedModuleLoading,
    actions: {
      queryModules,
      queryModulePage,
    },
  };
};
