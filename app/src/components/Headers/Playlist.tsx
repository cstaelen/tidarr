import { Chip, Stack } from "@mui/material";
import { PlaylistType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import SyncButton from "../Buttons/SyncButton";

import PageHeader from "./Header";

export default function PlaylistHeader({
  playlist,
}: {
  playlist: PlaylistType;
}) {
  return (
    <PageHeader
      title={playlist.title}
      url={playlist.url}
      image={`https://resources.tidal.com/images/${playlist.squareImage?.replace(
        /-/g,
        "/",
      )}/750x750.jpg`}
      subtitle="Playlist"
      afterTitle={
        <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={1}>
          <Chip
            label={`${Math.round(playlist.duration / 60)} min.`}
            color="success"
            size="small"
          />
          <Chip label={`${playlist.numberOfTracks} tracks`} size="small" />
          <SyncButton item={playlist} type="playlist" />
          <DownloadButton
            item={playlist}
            id={playlist.uuid}
            type="playlist"
            label="Get playlist"
          />
        </Stack>
      }
    />
  );
}
