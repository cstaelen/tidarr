import { Chip, Stack, useTheme } from "@mui/material";
import { TrackType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";

import PageHeader from "./Header";

export default function TrackHeader({ track }: { track: TrackType }) {
  const theme = useTheme();

  return (
    <PageHeader
      title={track.title}
      url={track.url}
      isDisabled={track?.allowStreaming === false}
      image={`https://resources.tidal.com/images/${track.album.cover?.replace(
        /-/g,
        "/",
      )}/750x750.jpg`}
      beforeTitle={<>Track</>}
      afterTitle={
        <>
          <Stack
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            mb={2}
            spacing={1}
          >
            <Chip
              label={track.audioQuality.toLowerCase()}
              color="primary"
              size="small"
              sx={{
                margin: "0.2rem",
                color:
                  track?.audioQuality?.toLowerCase() === "lossless"
                    ? theme.palette.common.white
                    : theme.palette.common.black,
                backgroundColor:
                  track?.audioQuality?.toLowerCase() === "lossless"
                    ? theme.palette.gold
                    : theme.palette.primary.main,
              }}
            />
            <Chip
              label={`${Math.round(track.duration / 60)} min.`}
              color="success"
              size="small"
            />
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            spacing={1}
          >
            <DownloadButton
              item={track}
              id={track.album.id}
              type="album"
              label="Album"
            />
            <DownloadButton
              item={track}
              id={track.id}
              type="track"
              label="Track"
            />
          </Stack>
        </>
      }
    />
  );
}
