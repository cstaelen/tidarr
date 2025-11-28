import { useMemo } from "react";
import { Block } from "@mui/icons-material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";
import WarningIcon from "@mui/icons-material/Warning";
import { Button, CircularProgress } from "@mui/material";
import { TIDAL_ALBUM_URL, TIDAL_MIX_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useHistoryProvider } from "src/provider/HistoryProvider";

import { useProcessingProvider } from "../../provider/ProcessingProvider";
import {
  AlbumType,
  ContentType,
  MixType,
  TidalItemType,
  TrackType,
} from "../../types";

export const DownloadButton = ({
  id,
  item,
  type,
  label,
  force,
}: {
  item: TidalItemType;
  id: string;
  type: ContentType;
  label: string;
  force?: boolean;
}) => {
  const { processingList, actions } = useProcessingProvider();
  const { config } = useConfigProvider();
  const {
    history,
    actions: { addToHistory },
  } = useHistoryProvider();

  const status = useMemo(() => {
    // Check if item is currently in the processing queue
    const processingItem = processingList?.find(
      (x) => x.id?.toString() === id?.toString() && x.type === type,
    );

    if (processingItem) {
      const itemStatus = processingItem.status;

      // When item finishes and history is enabled, add to local history
      if (itemStatus === "finished" && config?.ENABLE_HISTORY === "true") {
        addToHistory(id.toString());
      }

      return itemStatus;
    }

    // If history is enabled, check local history
    if (config?.ENABLE_HISTORY === "true" && !force) {
      const isInHistory = history?.some(
        (x) => x?.toString() === id?.toString(),
      );
      return isInHistory ? "finished" : undefined;
    }

    return undefined;
  }, [
    processingList,
    force,
    config?.ENABLE_HISTORY,
    history,
    id,
    type,
    addToHistory,
  ]);

  const downloadItem = async () => {
    if (force) await actions.removeItem(id);

    switch (true) {
      case type === "album" && !!(item as TrackType)?.album?.id:
        actions.addItem(
          {
            ...(item as TrackType).album,
            artists: [...(item as TrackType).artists],
            url: `${TIDAL_ALBUM_URL}${(item as TrackType).album.id}`,
          } as AlbumType,
          type,
        );
        break;
      case type === "mix":
        actions.addItem(
          {
            ...item,
            url: `${TIDAL_MIX_URL}${(item as MixType).id}`,
          } as MixType,
          type,
        );
        break;
      default:
        actions.addItem(item, type);
    }
  };

  return (
    <Button
      variant="outlined"
      data-testid="btn-dl"
      color={status === "finished" ? "success" : "primary"}
      endIcon={
        status === "queue" ? (
          <AccessTimeIcon />
        ) : status === "error" ? (
          <WarningIcon color="error" />
        ) : status === "finished" ? (
          <CheckIcon color="success" />
        ) : status === "processing" ? (
          <CircularProgress size={20} />
        ) : status === "no_download" ? (
          <Block color="disabled" />
        ) : (
          <DownloadIcon />
        )
      }
      disabled={!!status && status !== "finished" && !force}
      onClick={() => downloadItem()}
      size="small"
    >
      {label}
    </Button>
  );
};
