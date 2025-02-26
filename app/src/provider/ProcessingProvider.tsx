import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  AlbumType,
  ArtistType,
  MixType,
  PlaylistType,
  ProcessingItemType,
  TrackType,
  VideoType,
} from "../types";

import { useApiFetcher } from "./ApiFetcherProvider";

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
        | VideoType,
      type: "album" | "track" | "artist" | "playlist" | "video",
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
    useState<EventSource>();
  const {
    actions: { list_sse, remove, save },
  } = useApiFetcher();

  // Add item to processing list
  const addItem = async (
    item:
      | AlbumType
      | TrackType
      | ArtistType
      | PlaylistType
      | MixType
      | VideoType,
    type: "album" | "track" | "artist" | "playlist" | "video",
  ) => {
    const id =
      (item as AlbumType | TrackType | ArtistType).id ||
      (item as PlaylistType).uuid;
    if (
      processingList &&
      processingList?.filter((row) => row.id === id && row.status !== "error")
        ?.length > 0
    )
      return null;

    const itemToQueue: ProcessingItemType = {
      id: id,
      artist:
        type === "artist"
          ? (item as ArtistType)?.name
          : (item as TrackType | AlbumType).artists?.[0].name,
      title:
        type === "artist"
          ? "All albums"
          : (item as TrackType | AlbumType)?.title,
      type: type,
      status: "queue",
      loading: true,
      error: false,
      url: (item as AlbumType)?.url || (item as VideoType)?.id.toString(),
      output: "",
    };

    save(JSON.stringify({ item: itemToQueue })).then(() =>
      openStreamProcessing(),
    );
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
      output: "",
    };

    await removeItem(item.id);
    save(JSON.stringify({ item: itemToQueue })).then(() =>
      openStreamProcessing(),
    );
  };

  // Remove item to processing list
  const removeItem = async (id: string) => {
    remove(JSON.stringify({ id: id })).then(() => openStreamProcessing());
  };

  // Update front data
  const openStreamProcessing = useCallback(async () => {
    if (processingEventSource) return;
    console.log("open event source", processingEventSource);
    const eventSource = await list_sse(setProcessingList);
    setProcessingEventSource(eventSource);
  }, [list_sse, processingEventSource]);

  useEffect(() => {
    // First load
    if (!processingEventSource && processingList === undefined) {
      openStreamProcessing();
      return;
    }

    // If item list is processing
    if (
      !processingEventSource ||
      !processingList ||
      processingList?.filter(
        (item) => item?.status !== "finished" && item?.status !== "error",
      )?.length > 0
    ) {
      return;
    }

    // Closing event source
    console.log("close event source");
    processingEventSource?.close();
    setProcessingEventSource(undefined);
  }, [processingEventSource, processingList, openStreamProcessing]);

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
