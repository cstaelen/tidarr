import React, { useEffect, useMemo, useState } from "react";
import { SyncDisabled } from "@mui/icons-material";
import SyncIcon from "@mui/icons-material/Sync";
import { Button, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useSync } from "src/provider/SyncProvider";
import { ContentType, MixType, PlaylistType, SyncItemType } from "src/types";

const SyncButton: React.FC<{
  item: PlaylistType | MixType;
  type: ContentType;
}> = ({ item, type }) => {
  const { syncList, actions } = useSync();
  const [isSynced, setIsSynced] = useState(false);
  const { quality } = useConfigProvider();

  const syncObj = useMemo<SyncItemType>(
    () => ({
      id: "uuid" in item ? item.uuid : item.id,
      url: item.url || "",
      title: item.title,
      quality: quality || "high",
      type: type,
    }),
    [item, quality, type],
  );

  useEffect(() => {
    setIsSynced(
      syncList.find((item: SyncItemType) => item?.id === syncObj?.id) !==
        undefined,
    );
  }, [syncList, syncObj]);

  const handleClick = (syncItem: SyncItemType) => {
    if (isSynced) {
      actions.removeSyncItem(syncObj.id);
    } else {
      actions.addSyncItem(syncItem);
    }
    setIsSynced(!isSynced);
  };

  return (
    <Tooltip title={isSynced ? "Remove from sync list" : "Add to sync list"}>
      <Button
        onClick={() => handleClick(syncObj)}
        size="small"
        variant="outlined"
        color={!isSynced ? "primary" : "error"}
        sx={{ minWidth: 0 }}
      >
        {!isSynced ? <SyncIcon /> : <SyncDisabled />}
      </Button>
    </Tooltip>
  );
};

export default SyncButton;
