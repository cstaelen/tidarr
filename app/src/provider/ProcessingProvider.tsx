import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  actions: {
    setProcessingList: (list: ProcessingItemType[]) => void;
    setIsPaused: (isPaused: boolean) => void;
    addItem: (
      item: TidalItemType,
      type: ContentType,
    ) => Promise<void | undefined>;
    removeItem: (id: string) => Promise<void>;
    retryItem: (item: ProcessingItemType) => Promise<void | null>;
  };
};

const ProcessingContext = React.createContext<ProcessingContextType>(
  {} as ProcessingContextType,
);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingList, setProcessingList] = useState<ProcessingItemType[]>();
  const [isPaused, setIsPaused] = useState<boolean>();
  const [processingEventSource, setProcessingEventSource] =
    useState<EventSourceController>();

  const {
    actions: { list_sse, remove, save, get_queue_status },
  } = useApiFetcher();
  const {
    quality,
    actions: { setConfigErrors },
  } = useConfigProvider();
  const { formatItem } = useProcessingFormat();

  // Add item to processing list
  const addItem = async (
    item: TidalItemType,
    type: ContentType,
  ): Promise<void> => {
    if (!quality) {
      setConfigErrors(["Cannot read quality settings"]);
      return;
    }

    const itemToQueue = formatItem(item, type, quality);

    await save(JSON.stringify({ item: itemToQueue }));
  };

  // Retry failed processing item
  const retryItem = async (item: ProcessingItemType): Promise<void | null> => {
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
  const removeItem = async (id: string): Promise<void> => {
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

  // Get queue status (pause/resume)
  useEffect(() => {
    async function load() {
      try {
        const status = await get_queue_status();
        if (status) {
          setIsPaused(status.isPaused);
        }
      } catch (error) {
        console.error("Failed to load queue status:", error);
      }
    }
    load();
  }, [get_queue_status]);

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
    isPaused,
    actions: {
      setProcessingList,
      setIsPaused,
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
