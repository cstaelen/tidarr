import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { EventSourceController } from "event-source-plus";
import { useProcessingFormat } from "src/hooks/useProcessingFormat";

import { ContentType, ProcessingItemType, TidalItemType } from "../types";

import { useApiFetcher } from "./ApiFetcherProvider";
import { useConfigProvider } from "./ConfigProvider";

type ProcessingContextType = {
  processingList: ProcessingItemType[] | undefined;
  isPaused: boolean | undefined;
  batchCount: number;
  batchResumeAt: number | null;
  actions: {
    setProcessingList: (list: ProcessingItemType[]) => void;
    setIsPaused: (isPaused: boolean) => void;
    addItem: (item: TidalItemType, type: ContentType) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    retryItem: (item: ProcessingItemType) => Promise<void | null>;
    downloadNow: (id: string) => Promise<void>;
  };
};

const ProcessingContext = React.createContext<ProcessingContextType>(
  {} as ProcessingContextType,
);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingList, setProcessingList] = useState<ProcessingItemType[]>();
  const [isPaused, setIsPaused] = useState<boolean>();
  const [batchCount, setBatchCount] = useState<number>(0);
  const [batchResumeAt, setBatchResumeAt] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSourceController | null>(null);

  const {
    actions: { list_sse, remove, save, single_download },
  } = useApiFetcher();
  const {
    actions: { setConfigErrors },
  } = useConfigProvider();
  const { formatItem } = useProcessingFormat();

  const addItem = async (
    item: TidalItemType,
    type: ContentType,
  ): Promise<void> => {
    const itemToQueue = formatItem(item, type);
    if (!itemToQueue) {
      setConfigErrors(["Cannot read quality settings"]);
      return;
    }
    await save(JSON.stringify({ item: itemToQueue }));
  };

  const retryItem = async (item: ProcessingItemType): Promise<void | null> => {
    if (
      processingList?.some(
        (row) => row.id === item.id && row.status !== "error",
      )
    )
      return null;

    await removeItem(item.id);
    await save(
      JSON.stringify({
        item: {
          ...item,
          status: "queue_download",
          loading: true,
          error: false,
        },
      }),
    );
  };

  const downloadNow = async (id: string): Promise<void> => {
    await single_download(id);
  };

  const removeItem = async (id: string): Promise<void> => {
    await remove(JSON.stringify({ id }));
  };

  const closeStreamProcessing = useCallback(() => {
    eventSourceRef.current?.abort();
    eventSourceRef.current = null;
  }, []);

  useEffect(() => {
    if (eventSourceRef.current) return;

    const { controller } = list_sse(
      setProcessingList,
      setIsPaused,
      setBatchCount,
      setBatchResumeAt,
    );
    eventSourceRef.current = controller;
    window.addEventListener("beforeunload", closeStreamProcessing);
    return () => {
      window.removeEventListener("beforeunload", closeStreamProcessing);
    };
  }, [closeStreamProcessing, list_sse]);

  return (
    <ProcessingContext.Provider
      value={{
        processingList,
        isPaused,
        batchCount,
        batchResumeAt,
        actions: {
          setProcessingList,
          setIsPaused,
          addItem,
          removeItem,
          retryItem,
          downloadNow,
        },
      }}
    >
      {children}
    </ProcessingContext.Provider>
  );
}

export const useProcessingProvider = () => {
  return useContext(ProcessingContext);
};
