import { Button, CircularProgress } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import React from "react";
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AlbumType, ArtistType, TrackType } from "../types";
import { useProcessingProvider } from "../provider/ProcessingProvider";

export const DownloadButton = ({
  id,
  item,
  type,
  label
}: {
  item: TrackType | AlbumType | ArtistType,
  id: number,
  type: "album" | "artist" | "track",
  label: string
}) => {
  const [status, setStatus] = React.useState<string>();
  const { processingList, actions } = useProcessingProvider();

  React.useEffect(() => {
    const index = processingList?.findIndex(x => x?.id === id) || -1;
    if (index > -1) {
      setStatus(processingList?.[index].status);
    }
  }, [processingList, id]);

  const downloadItem = async () => {
    if (type === "album" && (item as TrackType)?.album?.id) {
      actions.addItem({
        ...(item as TrackType).album,
        artists: [...(item as TrackType).artists],
        url: `${process.env.NEXT_PUBLIC_TIDARR_SEARCH_URL}${(item as TrackType).album.id}`,
      } as AlbumType, type);
    }
    actions.addItem(item, type);
  };

  return (
    <Button
      variant="outlined"
      endIcon={
        status === 'queue' ? <AccessTimeIcon /> :
          status === "error" ? <WarningIcon color="error" /> :
            status === "finished" ? <CheckIcon color="success" /> :
              status === "processing" ? <CircularProgress size={20} /> :
                <DownloadIcon />
      }
      disabled={!!status}
      onClick={() => downloadItem()}
      size="small"
    >
      {label}
    </Button>
  );
}