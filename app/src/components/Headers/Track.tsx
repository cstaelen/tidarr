import { useNavigate } from "react-router-dom";
import { Button, Chip, Stack, Typography } from "@mui/material";
import { TrackType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import { JellyfinSearchButton } from "../Buttons/JellyfinSearchButton";
import { NavidromeSearchButton } from "../Buttons/NavidromeSearchButton";
import { PlexSearchButton } from "../Buttons/PlexSearchButton";
import { ArtistAvatar } from "../Cards/common/ArtistAvatar";
import { ChipQuality } from "../Cards/common/ChipQuality";

import PageHeader from "./Header";

export default function TrackHeader({ track }: { track: TrackType }) {
  const navigate = useNavigate();

  return (
    <PageHeader
      title={track.title}
      url={track.url}
      isDisabled={track?.allowStreaming === false}
      image={`https://resources.tidal.com/images/${track.album.cover?.replace(
        /-/g,
        "/",
      )}/750x750.jpg`}
      subtitle="Track"
      beforeTitle={
        <Stack direction="row" flexWrap="wrap" spacing={1} alignItems="center">
          <ArtistAvatar
            alt={track.artists?.[0]?.name}
            src={`https://resources.tidal.com/images/${track.artists?.[0]?.picture?.replace(
              /-/g,
              "/",
            )}/750x750.jpg`}
          />
          <Typography
            variant="subtitle2"
            color="text.secondary"
            component="span"
            style={{ lineHeight: 1 }}
          >
            {` `}by{` `}
            <Button
              variant="text"
              size="small"
              color="inherit"
              style={{ padding: "0 0.15rem" }}
              onClick={() => {
                navigate(`/artist/${track.artists[0].id}`);
              }}
            >
              <strong>{track.artists?.[0]?.name}</strong>
            </Button>
          </Typography>
        </Stack>
      }
      afterTitle={
        <>
          <Stack
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            mb={2}
            gap={0.5}
          >
            <ChipQuality quality={track.audioQuality.toLowerCase()} />
            <Chip
              label={`${Math.round(track.duration / 60)} min.`}
              color="success"
              size="small"
            />
            {track.explicit && (
              <Chip label="Explicit" size="small" variant="outlined" />
            )}
          </Stack>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
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
            <PlexSearchButton query={track.title} pivot="tracks" />
            <NavidromeSearchButton query={track.title} pivot="tracks" />
            <JellyfinSearchButton query={track.title} pivot="tracks" />
          </Stack>
        </>
      }
    />
  );
}
