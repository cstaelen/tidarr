import React, { useMemo } from "react";
import { SyncDisabled } from "@mui/icons-material";
import SyncIcon from "@mui/icons-material/Sync";
import { Button, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useProcessingProvider } from "src/provider/ProcessingProvider";
import { useSync } from "src/provider/SyncProvider";
import {
  ArtistType,
  ContentType,
  FavoritesType,
  MixType,
  PlaylistType,
  SyncItemType,
} from "src/types";

const SyncButton: React.FC<{
  item: PlaylistType | MixType | ArtistType | FavoritesType;
  type: ContentType;
}> = ({ item, type }) => {
  const { syncList, actions } = useSync();
  const { actions: processingActions } = useProcessingProvider();
  const { quality } = useConfigProvider();

  const syncObj = useMemo<SyncItemType>(() => {
    const itemId = "uuid" in item ? item.uuid : item.id;
    const itemUrl = ["mix", "playlist"].includes(type)
      ? `/${type}/${itemId}`
      : item.url || "";

    return {
      id: itemId,
      url: itemUrl,
      title: type === "artist" ? "All albums" : (item as PlaylistType).title,
      quality: quality || "high",
      artist: type === "artist" ? (item as ArtistType)?.name : "",
      type: type,
    };
  }, [item, quality, type]);

  const isSynced = useMemo(() => {
    return (
      syncList.find((item: SyncItemType) => item?.id === syncObj?.id) !==
      undefined
    );
  }, [syncList, syncObj?.id]);

  const handleClick = () => {
    if (isSynced) {
      actions.removeSyncItem(syncObj.id);
    } else {
      actions.addSyncItem(syncObj);
      processingActions.addItem(syncObj, type);
    }
  };

  return (
    <Tooltip title={isSynced ? "Remove from watch list" : "Add to watch list"}>
      <Button
        onClick={() => handleClick()}
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
