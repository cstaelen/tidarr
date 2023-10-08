import React, {
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { AlbumType, ArtistType, ProcessingItemType, TrackType } from "../types";
import { check, list, remove, save } from "../server/queryApi";

type ProcessingContextType = {
  processingList: ProcessingItemType[] | undefined;
  tokenMissing: boolean,
  noAPI: boolean,
  actions: {
    setProcessingList: Function;
    addItem: (item: AlbumType | TrackType | ArtistType, type: 'album' | 'track' | 'artist') => void;
    removeItem: (id: number) => void;
    retryItem: (item: ProcessingItemType) => void;
  };
};

const ProcessingContext = React.createContext<ProcessingContextType>(
  {} as ProcessingContextType
);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingList, setProcessingList] = useState<ProcessingItemType[]>();
  const [tokenMissing, setTokenMissing] = useState(false);
  const [noAPI, setNoAPI] = useState(false);

  // Add item to processing list
  const addItem = async (item: AlbumType | TrackType | ArtistType, type: 'album' | 'track' | 'artist') => {
    if (processingList && processingList?.filter(row => row.id === item.id && row.status !== 'error')?.length > 0) return null;

    const itemToQueue: ProcessingItemType = {
      id: item.id,
      artist: type === 'artist' ? (item as ArtistType)?.name : (item as TrackType | AlbumType).artists?.[0].name,
      title: type === 'artist' ? 'All albums' : (item as TrackType | AlbumType)?.title,
      type: type,
      status: 'queue',
      loading: true,
      error: false,
      url: item.url,
      output: "",
    };

    await save(itemToQueue);

    updateFrontList();
  };

  const retryItem = async (item: ProcessingItemType) => {
    if (processingList && processingList?.filter(row => row.id === item.id && row.status !== 'error')?.length > 0) return null;

    const itemToQueue: ProcessingItemType = {
      ...item,
      status: 'queue',
      loading: true,
      error: false,
      output: "",
    }

    await removeItem(item.id);
    await save(itemToQueue);

    updateFrontList();
  };

  // Remove item to processing list
  const removeItem = async (id: number) => {
    await remove(id);

    updateFrontList();
  }

  // Update front data
  const updateFrontList = async () => {
    const existingData: any = await list();

    if (existingData) {
      const list = existingData || '';
      setProcessingList(list);
      if (existingData.filter((item: ProcessingItemType) => item.status === "queue" || item.status === "processing").length > 0) {
        setTimeout(async () => await updateFrontList(), 5000);
      }
    } else {
      setProcessingList(undefined);
    }
  };

  // Check API
  const checkAPI = async () => {
    try {
      const output: any = await check();

      setTokenMissing(output?.noToken);
    } catch (e) {
      setNoAPI(true);
    }
  }

  useEffect(() => {
    checkAPI();
    updateFrontList();
  }, []);

  const value = {
    processingList,
    tokenMissing,
    noAPI,
    actions: {
      setProcessingList,
      addItem,
      removeItem,
      retryItem,
    },
  };

  return (
    <ProcessingContext.Provider value={value}>{children}</ProcessingContext.Provider>
  );
}

export const useProcessingProvider = () => {
  return useContext(ProcessingContext);
};
