"use client";

import React, { useContext, useState, ReactNode, useEffect } from "react";

import {
  AlbumType,
  ApiReturnType,
  ArtistType,
  PlaylistType,
  ProcessingItemType,
  TrackType,
} from "../types";
import { check, list, remove, save } from "../server/queryApi";

type ProcessingContextType = {
  processingList: ProcessingItemType[] | undefined;
  tokenMissing: boolean;
  apiError?: ApiReturnType;
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
  const [tokenMissing, setTokenMissing] = useState(false);
  const [apiError, setApiError] = useState<ApiReturnType>();

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

    try {
      await save(JSON.stringify({ item: itemToQueue }));
    } catch (e: unknown) {
      setApiError(e as ApiReturnType);
    } finally {
      updateFrontList();
    }
  };

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

    try {
      await save(JSON.stringify({ item: itemToQueue }));
    } catch (e: unknown) {
      setApiError(e as ApiReturnType);
    } finally {
      updateFrontList();
    }
  };

  // Remove item to processing list
  const removeItem = async (id: string) => {
    try {
      await remove(JSON.stringify({ id: id }));
    } catch (e: unknown) {
      setApiError(e as ApiReturnType);
    } finally {
      updateFrontList();
    }
  };

  // Update front data
  const updateFrontList = async () => {
    const data: ProcessingItemType[] | ApiReturnType = await list();

    if ((data as ApiReturnType)?.error) {
      setApiError(data as ApiReturnType);
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

  // Check API
  const checkAPI = async () => {
    if (process.env.CI) {
      setTokenMissing(false);
      return;
    }
    const output: ApiReturnType | { noToken: boolean; output: string } =
      await check();
    if ((output as ApiReturnType)?.error) {
      setApiError(output as ApiReturnType);
      return;
    }

    const data = output as { noToken: boolean; output: string };
    setTokenMissing(data?.noToken);
  };

  useEffect(() => {
    checkAPI();
    updateFrontList();
  }, []);

  const value = {
    processingList,
    tokenMissing,
    apiError,
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
