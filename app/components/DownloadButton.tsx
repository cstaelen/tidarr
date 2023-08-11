import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import React from "react";
import { AlbumType, ArtistType, TrackType } from "../types";
import { useTidalProvider } from "../provider/TidalProvider";

export const DownloadButton = ({ id, item, type, label }: { item: TrackType | AlbumType | ArtistType, id: number, type: "album" | "artist" | "track", label: string }) => {
    const [status, setStatus] = React.useState<"loading" | "finished" | "error">();
    const { processingList, actions } = useTidalProvider();

    React.useEffect(() => {
        if (processingList && processingList?.length > 0) {
            console.log(processingList);
            const index = processingList?.findIndex(x => x.id === id);
            if (index > -1) {
                setStatus(processingList[index].loading ? "loading" : processingList[index].error ? "error" : "finished");
            }
        }
    }, [processingList, id]);

    const downloadItem = async () => {
        if (type === "artist") {
            await actions.save(item.url, item.id, (item as ArtistType)?.name, "Complete discography", type)
        } else {
            await actions.save(item.url, item.id, (item as AlbumType | TrackType)?.artists?.[0]?.name, (item as AlbumType | TrackType)?.title, type)
        }
    };

    return (
        <Button
            variant="outlined"
            endIcon={<DownloadIcon />}
            disabled={!!status}
            onClick={() => downloadItem()}
            size="small"
        >
            {status === 'loading' ? "Downloading ..." : status === "error" ? "Error !" : label}
        </Button>
    );
}