import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import React from "react";
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
    actions.addItem(item, type);
  };

  return (
    <Button
      variant="outlined"
      endIcon={<DownloadIcon />}
      disabled={!!status}
      onClick={() => downloadItem()}
      size="small"
    >
      {
        status === 'queue' ? "In queue ..." : 
        status === "error" ? "Error !" : 
        status === "finished" ? "Downloaded !" : 
        status === "processing" ? "Processing ..." : 
        label
      }
    </Button>
  );
}