import { useMemo } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";
import WarningIcon from "@mui/icons-material/Warning";
import { Button, CircularProgress } from "@mui/material";
import { TIDAL_ALBUM_URL } from "src/contants";

import { useProcessingProvider } from "../../provider/ProcessingProvider";
import {
  AlbumType,
  ArtistType,
  ContentType,
  FavoritesType,
  MixType,
  PlaylistType,
  TrackType,
  VideoType,
} from "../../types";

export const DownloadButton = ({
  id,
  item,
  type,
  label,
}: {
  item:
    | TrackType
    | AlbumType
    | ArtistType
    | PlaylistType
    | MixType
    | VideoType
    | FavoritesType;
  id: string;
  type: ContentType;
  label: string;
}) => {
  const { processingList, actions } = useProcessingProvider();

  const status = useMemo(() => {
    if (!processingList || processingList?.length === 0 || !id) {
      return undefined;
    }

    const index = processingList.findIndex(
      (x) => x.id?.toString() === id?.toString(),
    );

    return index > -1 ? processingList?.[index]?.status : undefined;
  }, [processingList, id]);

  const downloadItem = async () => {
    if (type === "album" && (item as TrackType)?.album?.id) {
      actions.addItem(
        {
          ...(item as TrackType).album,
          artists: [...(item as TrackType).artists],
          url: `${TIDAL_ALBUM_URL}${(item as TrackType).album.id}`,
        } as AlbumType,
        type,
      );
    } else {
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
      disabled={!!status}
      onClick={() => downloadItem()}
      size="small"
    >
      {label}
    </Button>
  );
};
