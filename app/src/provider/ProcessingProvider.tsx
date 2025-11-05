import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { EventSourceController } from "event-source-plus";

import {
  AlbumType,
  ArtistType,
  ContentType,
  FavoritesType,
  MixType,
  PlaylistType,
  ProcessingItemType,
  SyncItemType,
  TrackType,
  VideoType,
} from "../types";

import { useApiFetcher } from "./ApiFetcherProvider";
import { useConfigProvider } from "./ConfigProvider";

type ProcessingContextType = {
  processingList: ProcessingItemType[] | undefined;
  actions: {
    setProcessingList: (list: ProcessingItemType[]) => void;
    addItem: (
      item:
        | AlbumType
        | TrackType
        | ArtistType
        | PlaylistType
        | MixType
        | VideoType
        | FavoritesType,
      type: ContentType,
    ) => void;
    removeItem: (id: string) => void;
    retryItem: (item: ProcessingItemType) => void;
  };
};

const ProcessingContext = React.createContext<ProcessingContextType>(
  {} as ProcessingContextType,
);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingList, setProcessingList] = useState<ProcessingItemType[]>();
  const [processingEventSource, setProcessingEventSource] =
    useState<EventSourceController>();
  const {
    actions: { list_sse, remove, save },
  } = useApiFetcher();
  const { quality } = useConfigProvider();

  // Add item to processing list
  const addItem = async (
    item:
      | AlbumType
      | TrackType
      | ArtistType
      | PlaylistType
      | MixType
      | VideoType
      | FavoritesType,
    type: ContentType,
  ) => {
    if (!quality) return;

    const id =
      (item as AlbumType | TrackType | ArtistType).id ||
      (item as PlaylistType).uuid;

    if (
      processingList &&
      processingList?.filter((row) => row.id === id && row.status !== "error")
        ?.length > 0
    )
      return null;

    let title = "";
    switch (type) {
      case "artist":
        title = "All albums";
        break;
      case "artist_videos":
        title = "All artist videos";
        break;
      default:
        title = (item as TrackType | AlbumType)?.title;
    }

    let artist = "";
    switch (type) {
      case "artist":
      case "artist_videos":
        artist =
          (item as ArtistType)?.name || (item as SyncItemType)?.artist || "";
        break;
      default:
        artist = (item as TrackType | AlbumType).artists?.[0].name;
    }

    const itemToQueue: ProcessingItemType = {
      id: id,
      artist: artist,
      title: title,
      type: type,
      quality: quality,
      status: "queue",
      loading: true,
      error: false,
      url: (item as AlbumType)?.url || (item as VideoType)?.id.toString(),
    };

    await save(JSON.stringify({ item: itemToQueue }));
  };

  // Retry failed processing item
  const retryItem = async (item: ProcessingItemType) => {
    if (
      processingList &&
      processingList?.filter(
        (row) => row.id === item.id && row.status !== "error",
      )?.length > 0
    )
      return null;

    const itemToQueue: ProcessingItemType = {
      ...item,
      status: "queue",
      loading: true,
      error: false,
    };

    await removeItem(item.id);
    await save(JSON.stringify({ item: itemToQueue }));
  };

  // Remove item to processing list
  const removeItem = async (id: string) => {
    await remove(JSON.stringify({ id: id }));
  };

  // Update front data
  const openStreamProcessing = useCallback(async () => {
    if (processingEventSource) return;
    const { controller } = await list_sse(setProcessingList);
    setProcessingEventSource(controller);
  }, [list_sse, processingEventSource]);

  const closeStreamProcessing = useCallback(async () => {
    if (processingEventSource) {
      processingEventSource.abort();
      setProcessingEventSource(undefined);
    }
  }, [processingEventSource]);

  // First load
  useEffect(() => {
    function run() {
      openStreamProcessing();
    }

    if (processingEventSource) return;

    run();

    window.addEventListener("beforeunload", closeStreamProcessing);

    return () => {
      window.removeEventListener("beforeunload", closeStreamProcessing);
    };
  }, [processingEventSource, closeStreamProcessing, openStreamProcessing]);

  const value = {
    processingList,
    actions: {
      setProcessingList,
      addItem,
      removeItem,
      retryItem,
    },
  };

  return (
    <ProcessingContext.Provider value={value}>
      {children}
    </ProcessingContext.Provider>
  );
}

export const useProcessingProvider = () => {
  return useContext(ProcessingContext);
};
