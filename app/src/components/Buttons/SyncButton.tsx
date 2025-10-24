import React, { useMemo } from "react";
import { SyncDisabled } from "@mui/icons-material";
import SyncIcon from "@mui/icons-material/Sync";
import { Button, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useSync } from "src/provider/SyncProvider";
import {
  ArtistType,
  ContentType,
  MixType,
  PlaylistType,
  SyncItemType,
} from "src/types";

const SyncButton: React.FC<{
  item: PlaylistType | MixType | ArtistType;
  type: ContentType;
}> = ({ item, type }) => {
  const { syncList, actions } = useSync();

  const { quality } = useConfigProvider();

  const syncObj = useMemo<SyncItemType>(
    () => ({
      id: "uuid" in item ? item.uuid : item.id,
      url: item.url || "",
      title: (item as PlaylistType).title || (item as ArtistType).name,
      quality: quality || "high",
      type: type,
    }),
    [item, quality, type],
  );

  const isSynced = useMemo(() => {
    return (
      syncList.find((item: SyncItemType) => item?.id === syncObj?.id) !==
      undefined
    );
  }, [syncList, syncObj?.id]);

  const handleClick = (syncItem: SyncItemType) => {
    if (isSynced) {
      actions.removeSyncItem(syncObj.id);
    } else {
      actions.addSyncItem(syncItem);
    }
  };

  return (
    <Tooltip title={isSynced ? "Remove from sync list" : "Add to sync list"}>
      <Button
        onClick={() => handleClick(syncObj)}
        size="small"
        variant="outlined"
        color={!isSynced ? "primary" : "error"}
        sx={{ minWidth: 0 }}
        data-testid={!isSynced ? "btn-sync" : "btn-disable-sync"}
      >
        {!isSynced ? <SyncIcon /> : <SyncDisabled />}
      </Button>
    </Tooltip>
  );
};

export default SyncButton;
