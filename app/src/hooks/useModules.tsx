import { useState } from "react";
import { useFetchTidal } from "src/hooks/useFetchTidal";

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
    queryModules: (endpoint: string) => void;
    queryModulePage: (
      url: string,
      page: number,
      limit: number,
    ) => Promise<PagedModuleResponseType | undefined>;
  };
};

export const useModules = (): ModuleContextType => {
  const [loading, setLoading] = useState<boolean>(false);
  const [pagedModuleLoading, setPagedModuleLoading] = useState<boolean>(false);
  const [data, setData] = useState<ModuleListResponseType>();

  const { fetchTidal } = useFetchTidal();

  async function queryModules(endpoint: string) {
    setLoading(true);

    const response = await fetchTidal<ModuleListResponseType>(endpoint);

    setData(response);
    setLoading(false);
  }

  async function queryModulePage(url: string, page: number, limit: number) {
    setPagedModuleLoading(true);
    const modulePageData = await fetchTidal<PagedModuleResponseType>(
      `${url}${url.includes("?") ? "&" : "?"}limit=${limit}&offset=${page * limit}`,
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
