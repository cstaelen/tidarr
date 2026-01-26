import { useMemo, useState } from "react";
import { Block } from "@mui/icons-material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
import CoffeeMakerIcon from "@mui/icons-material/CoffeeMaker";
import DownloadIcon from "@mui/icons-material/Download";
import WarningIcon from "@mui/icons-material/Warning";
import { Button, CircularProgress, Tooltip } from "@mui/material";
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

// Statuses that can be cancelled (Set for O(1) lookup)
const CANCELLABLE_STATUSES = new Set([
  "queue_download",
  "queue_processing",
  "processing",
  "download",
]);

// Status to icon mapping
const STATUS_ICONS: Record<string, React.ReactNode> = {
  queue_download: <AccessTimeIcon />,
  queue_processing: <AccessTimeIcon />,
  error: <WarningIcon color="error" />,
  finished: <CheckIcon color="success" />,
  download: <CircularProgress size={18} />,
  processing: <CoffeeMakerIcon />,
  no_download: <Block color="disabled" />,
};

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
  const [isHovered, setIsHovered] = useState(false);

  const status = useMemo(() => {
    const processingItem = processingList?.find(
      (x) => x.id?.toString() === id?.toString() && x.type === type,
    );

    if (processingItem) {
      const itemStatus = processingItem.status;

      if (itemStatus === "finished" && config?.ENABLE_HISTORY === "true") {
        addToHistory(id.toString());
      }

      return itemStatus;
    }

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

  const isCancellable = !!status && CANCELLABLE_STATUSES.has(status);
  const showCancelMode = isCancellable && isHovered;

  const handleClick = () => {
    if (showCancelMode) {
      actions.removeItem(id);
      return;
    }

    if (force) actions.removeItem(id);

    if (type === "album" && (item as TrackType)?.album?.id) {
      actions.addItem(
        {
          ...(item as TrackType).album,
          artists: [...(item as TrackType).artists],
          url: `${TIDAL_ALBUM_URL}${(item as TrackType).album.id}`,
        } as AlbumType,
        type,
      );
    } else if (type === "mix") {
      actions.addItem(
        { ...item, url: `${TIDAL_MIX_URL}${(item as MixType).id}` } as MixType,
        type,
      );
    } else {
      actions.addItem(item, type);
    }
  };

  const buttonColor = showCancelMode
    ? "error"
    : status === "finished"
      ? "success"
      : status === "error"
        ? "warning"
        : isCancellable
          ? "inherit"
          : "primary";

  const buttonIcon = showCancelMode ? (
    <CancelIcon />
  ) : (
    (status && STATUS_ICONS[status]) || <DownloadIcon />
  );

  return (
    <Tooltip title={showCancelMode ? "Click to cancel download" : ""}>
      <Button
        variant="outlined"
        data-testid="btn-dl"
        color={buttonColor}
        endIcon={buttonIcon}
        onClick={handleClick}
        disabled={status === "no_download"}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        size="small"
      >
        {label}
      </Button>
    </Tooltip>
  );
};
