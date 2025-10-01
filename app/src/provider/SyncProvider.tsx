import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { SyncItemType } from "src/types";

import { useApiFetcher } from "./ApiFetcherProvider";

interface SyncContextType {
  syncList: SyncItemType[];
  actions: {
    removeSyncItem: (id: string) => void;
    addSyncItem: (item: SyncItemType) => void;
    getSyncList: () => void;
  };
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [syncList, setSyncList] = useState<SyncItemType[]>([]);
  const {
    actions: { add_sync_item, remove_sync_item, get_sync_list },
  } = useApiFetcher();

  const getSyncList = useCallback(async () => {
    const list = await get_sync_list();
    if (list) {
      setSyncList(list);
    }
  }, [get_sync_list, setSyncList]);

  const removeSyncItem = (id: string) => {
    setSyncList(syncList.filter((item: SyncItemType) => item.id !== id));
    remove_sync_item(JSON.stringify({ id: id }));
  };

  const addSyncItem = (item: SyncItemType) => {
    if (
      syncList.find((syncItem: SyncItemType) => syncItem.id === item.id) !==
      undefined
    )
      return;

    const newItem: SyncItemType = {
      id: item.id,
      url: item.url,
      title: item.title,
      quality: item.quality,
      type: item.type,
    };

    setSyncList([...syncList, newItem]);
    add_sync_item(JSON.stringify({ item: newItem }));
  };

  useEffect(() => {
    getSyncList();
  }, [getSyncList]);

  const value = {
    syncList,
    actions: {
      removeSyncItem,
      addSyncItem,
      getSyncList,
    },
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync doit être utilisé dans un SyncProvider");
  }
  return context;
};
