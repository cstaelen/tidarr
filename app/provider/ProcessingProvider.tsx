import React, {
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { AlbumType, TrackType } from "../types";

type ProcessingContextType = {
  processingList: ProcessingItemType[] | undefined;
  currentProcessing: number | undefined;
  actions: {
    setProcessingList: Function;
    addItem: Function;
    removeItem: Function;
    updateItemStatus: Function;
  };
};

export type ProcessingItemType = {
  id: number;
  artist: string;
  title: string;
  type: "artist" | "album" | "track";
  status: "queue" | "finished" | "beet" | "processing" | "error";
  url: string;
  loading: boolean;
  error: boolean;
}

const ProcessingContext = React.createContext<ProcessingContextType>(
  {} as ProcessingContextType
);

const LSKEY_PROCESSING_LIST = "tidarr_processing";

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingList, setProcessingList] = useState<ProcessingItemType[]>();
  const [currentProcessing, setCurrentProcessing] = useState<number>();

  // Add item to processing list
  const addItem = (item: AlbumType | TrackType, type: 'album' | 'track') => {
    if (processingList && processingList?.filter(row => row.id === item.id)?.length > 0) return null;

    const itemToQueue: ProcessingItemType = {
      id: item.id,
      artist: item.artists?.[0].name,
      title: item?.title,
      type: type,
      status: 'queue',
      loading: true,
      error: false,
      url: item.url,
    }

    const existingData = localStorage.getItem(LSKEY_PROCESSING_LIST);
    const list = [...(existingData ? JSON.parse(existingData) : []), itemToQueue];
    localStorage.setItem(LSKEY_PROCESSING_LIST, JSON.stringify(list));
    updateFrontList();

    if (list.filter(item => item.status === 'queue')?.length > 0) {
      startProcessingQueue();
    }
  };

  // Remove item to processing list
  const removeItem = (id: number) => {
    const existingData = localStorage.getItem(LSKEY_PROCESSING_LIST);
    if (existingData) {
      const list = JSON.parse(existingData)?.filter((item: ProcessingItemType) => item.id !== id);
      localStorage.setItem(LSKEY_PROCESSING_LIST, JSON.stringify(list));
      updateFrontList();
    }
  }

  // Start processing list
  const startProcessingQueue = () => {
    const existingData = localStorage.getItem(LSKEY_PROCESSING_LIST);
    const index = JSON.parse(existingData || '')?.findIndex((item: ProcessingItemType) => item.status === 'queue');
    setCurrentProcessing(index !== undefined ? index : undefined);
  }

  // Update itm of the processing list
  const updateItemStatus = (id: number, status: ProcessingItemType["status"]) => {
    const existingData = localStorage.getItem(LSKEY_PROCESSING_LIST);
    const index = JSON.parse(existingData || '')?.findIndex((item: ProcessingItemType) => item.id === id);
    if (index !== undefined && processingList) {
      const list = [...JSON.parse(existingData || '')];
      list[index].status = status;
      localStorage.setItem(LSKEY_PROCESSING_LIST, JSON.stringify(list));
      if (status === 'finished') startProcessingQueue();
      updateFrontList();
    }
  }

  // Update front data
  const updateFrontList = () => {
    const existingData = localStorage.getItem(LSKEY_PROCESSING_LIST);
    if (existingData) {
      const list = JSON.parse(existingData || '');
      setProcessingList(list);
      preventTabClosing(true);
    } else {
      setProcessingList(undefined);
      preventTabClosing(false);
    }
  };

  // Show popup when user close the tab
  const preventTabClosing = (active: boolean) => {
    if (!active) {
      window.onbeforeunload = null;
      return;
    }

    window.onbeforeunload = function (event: BeforeUnloadEvent) {
      var message = 'If you confirm leaving, download progress informations will be lost. But downloads should continue.';

      event = event || window.event;
      event.preventDefault();
      event.cancelBubble = true;
      event.returnValue = message;
    }
  }

  // If localstorage data exists, run processing
  useEffect(() => {
    const lsData = localStorage?.getItem(LSKEY_PROCESSING_LIST);
    if (lsData && JSON.parse(lsData || '')?.length > 0) {
      startProcessingQueue();
    }
    updateFrontList();
  }, []);

  const value = {
    processingList,
    currentProcessing,
    actions: {
      setProcessingList,
      addItem,
      removeItem,
      updateItemStatus,
    },
  };

  return (
    <ProcessingContext.Provider value={value}>{children}</ProcessingContext.Provider>
  );
}

export const useProcessingProvider = () => {
  return useContext(ProcessingContext);
};
