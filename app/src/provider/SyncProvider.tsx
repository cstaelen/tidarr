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
    syncAllNow: () => Promise<void>;
    removeAllSyncItem: () => Promise<void>;
  };
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [syncList, setSyncList] = useState<SyncItemType[]>([]);
  const {
    actions: {
      add_sync_item,
      remove_sync_item,
      get_sync_list,
      sync_now,
      remove_sync_all_items,
    },
  } = useApiFetcher();

  const getSyncList = useCallback(async () => {
    const list = await get_sync_list();
    if (list) {
      setSyncList(list);
    }
  }, [get_sync_list, setSyncList]);

  const syncAllNow = async () => {
    await sync_now();
  };

  const removeSyncItem = async (id: string) => {
    setSyncList(syncList.filter((item: SyncItemType) => item.id !== id));
    await remove_sync_item(JSON.stringify({ id: id }));
  };

  const removeAllSyncItem = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all items from the watch list ?",
      )
    ) {
      return;
    }
    await remove_sync_all_items();
    getSyncList();
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
      artist: item.artist,
      type: item.type,
    };

    setSyncList([...syncList, newItem]);
    add_sync_item(JSON.stringify({ item: newItem }));
  };

  useEffect(() => {
    getSyncList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load sync list once on mount only

  const value = {
    syncList,
    actions: {
      removeSyncItem,
      addSyncItem,
      getSyncList,
      syncAllNow,
      removeAllSyncItem,
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
