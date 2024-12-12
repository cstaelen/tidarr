import React, { ReactNode, useContext, useEffect, useState } from "react";

import {
  AlbumType,
  ArtistType,
  PlaylistType,
  ProcessingItemType,
  TrackType,
} from "../types";

import { useApiFetcher } from "./ApiFetcherProvider";

type ProcessingContextType = {
  processingList: ProcessingItemType[] | undefined;
  actions: {
    setProcessingList: (list: ProcessingItemType[]) => void;
    addItem: (
      item: AlbumType | TrackType | ArtistType | PlaylistType,
      type: "album" | "track" | "artist" | "playlist",
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
  const {
    actions: { list, remove, save },
  } = useApiFetcher();

  // Add item to processing list
  const addItem = async (
    item: AlbumType | TrackType | ArtistType | PlaylistType,
    type: "album" | "track" | "artist" | "playlist",
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
      url: item.url,
      output: "",
    };

    await save(JSON.stringify({ item: itemToQueue }));
    updateFrontList();
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
    await save(JSON.stringify({ item: itemToQueue }));

    updateFrontList();
  };

  // Remove item to processing list
  const removeItem = async (id: string) => {
    await remove(JSON.stringify({ id: id }));
    updateFrontList();
  };

  // Update front data
  const updateFrontList = async () => {
    const data = await list();

    if (!data) {
      setProcessingList(undefined);
      return;
    }

    const existingData = data as ProcessingItemType[];

    if (existingData) {
      const list = existingData || "";
      setProcessingList(list);
      if (
        existingData.filter(
          (item: ProcessingItemType) =>
            item.status === "queue" || item.status === "processing",
        ).length > 0
      ) {
        setTimeout(async () => await updateFrontList(), 5000);
      }
    } else {
      setProcessingList(undefined);
    }
  };

  useEffect(() => {
    updateFrontList();
  }, []);

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
