import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { TrackType } from "src/types";
import { customColors } from "src/utils/theme";

import { DownloadButton } from "../Buttons/DownloadButton";

import PageHeader from "./Header";

export default function TrackHeader({ track }: { track: TrackType }) {
  const theme = useTheme();
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
          <Avatar
            alt={track.artists?.[0]?.name}
            sx={{ width: 42, height: 42 }}
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
                    ? customColors.gold
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
