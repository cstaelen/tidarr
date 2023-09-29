import React, {
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { AlbumType, ArtistType, ProcessingItemType, TrackType } from "../types";

type ProcessingContextType = {
  processingList: ProcessingItemType[] | undefined;
  currentProcessing: number | undefined;
  actions: {
    setProcessingList: Function;
    addItem: Function;
    removeItem: Function;
  };
};

const ProcessingContext = React.createContext<ProcessingContextType>(
  {} as ProcessingContextType
);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingList, setProcessingList] = useState<ProcessingItemType[]>();
  const [currentProcessing, setCurrentProcessing] = useState<number>();

  // Add item to processing list
  const addItem = async (item: AlbumType | TrackType | ArtistType, type: 'album' | 'track' | 'artist') => {
    if (processingList && processingList?.filter(row => row.id === item.id)?.length > 0) return null;

    const itemToQueue: ProcessingItemType = {
      id: item.id,
      artist: type === 'artist' ? (item as ArtistType)?.name : (item as TrackType | AlbumType) .artists?.[0].name,
      title: type === 'artist' ?  'All albums' : (item as TrackType | AlbumType)?.title,
      type: type,
      status: 'queue',
      loading: true,
      error: false,
      url: item.url,
      output: "",
    }

    await fetch(`${process.env.NEXT_PUBLIC_TIDARR_API_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({item: itemToQueue})
    })

    updateFrontList();
  };

  // Remove item to processing list
  const removeItem = async (id: number) => {
    await fetch(`${process.env.NEXT_PUBLIC_TIDARR_API_URL}/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({id: id})
    });

    updateFrontList();
  }

  // Update front data
  const updateFrontList = async () => {
    const existingData: any = await fetch(`${process.env.NEXT_PUBLIC_TIDARR_API_URL}/list`)
      .then(function(response) {
        return response.json();
      }).then(function(data) {
        return data;
      });

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

  useEffect(() => {
    updateFrontList();
  }, []);

  const value = {
    processingList,
    currentProcessing,
    actions: {
      setProcessingList,
      addItem,
      removeItem,
    },
  };

  return (
    <ProcessingContext.Provider value={value}>{children}</ProcessingContext.Provider>
  );
}

export const useProcessingProvider = () => {
  return useContext(ProcessingContext);
};
