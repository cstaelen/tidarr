import { useMemo } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";
import WarningIcon from "@mui/icons-material/Warning";
import { Button, CircularProgress } from "@mui/material";
import { TIDAL_ALBUM_URL, TIDAL_MIX_URL } from "src/contants";

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

  const status = useMemo(() => {
    if (!processingList || processingList?.length === 0 || !id) {
      return undefined;
    }

    const index = processingList.findIndex(
      (x) => x.id?.toString() === id?.toString() && x.type === type,
    );

    return index > -1 ? processingList?.[index]?.status : undefined;
  }, [processingList, id, type]);

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
      endIcon={
        status === "queue" ? (
          <AccessTimeIcon />
        ) : status === "error" ? (
          <WarningIcon color="error" />
        ) : status === "finished" ? (
          <CheckIcon color="success" />
        ) : status === "processing" ? (
          <CircularProgress size={20} />
        ) : (
          <DownloadIcon />
        )
      }
      disabled={!!status && !force}
      onClick={() => downloadItem()}
      size="small"
    >
      {label}
    </Button>
  );
};
