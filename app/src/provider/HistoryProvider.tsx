import React, { ReactNode, useContext, useEffect, useState } from "react";

import { useApiFetcher } from "./ApiFetcherProvider";
import { useConfigProvider } from "./ConfigProvider";

type HistoryContextType = {
  history: string[];
  actions: {
    addToHistory: (id: string) => void;
    emptyHistory: () => void;
  };
};

const HistoryContext = React.createContext<HistoryContextType>(
  {} as HistoryContextType,
);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<string[]>([]);
  const { config } = useConfigProvider();

  const {
    actions: { get_list_history, flush_history },
  } = useApiFetcher();

  const addToHistory = (id: string) => {
    const formatId = id.toString();
    if (history.includes(formatId)) return;
    setHistory([...history, formatId]);
  };

  const emptyHistory = async () => {
    await flush_history();
    setHistory([]);
  };

  useEffect(() => {
    if (config?.ENABLE_HISTORY !== "true") return;
    async function get_list() {
      const data = await get_list_history();
      setHistory(data || []);
    }

    get_list();
  }, [config, get_list_history]);

  const value = {
    history,
    actions: {
      addToHistory,
      emptyHistory,
    },
  };

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

export const useHistoryProvider = () => {
  return useContext(HistoryContext);
};
