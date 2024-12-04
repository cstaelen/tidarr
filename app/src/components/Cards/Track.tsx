import * as React from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Link,
  Stack,
  useTheme,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { TIDAL_PUBLIC_BROWSE_URL } from "src/contants";
import { useSearchProvider } from "src/provider/SearchProvider";
import { TrackType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";

export default function Track({ track }: { track: TrackType }) {
  const { display, actions } = useSearchProvider();
  const theme = useTheme();

  return (
    <Card sx={{ position: "relative" }}>
      <Stack
        direction="row"
        flexWrap="wrap"
        spacing={1}
        alignItems="center"
        style={{
          padding: "0.4rem 0.5rem 0.5rem",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
        }}
      >
        <Avatar
          alt={track.artists?.[0]?.name}
          sx={{ width: 42, height: 42 }}
          src={`https://resources.tidal.com/images/${track.artists?.[0]?.picture?.replace(
            /-/g,
            "/",
          )}/750x750.jpg`}
        />
        <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
          <Link
            href={track.url}
            style={{ lineHeight: 1.2 }}
            target="_blank"
            underline="none"
          >
            <Typography component="span" style={{ lineHeight: 1 }}>
              <strong>{track.title}</strong>
              <OpenInNewIcon
                style={{
                  verticalAlign: "middle",
                  marginLeft: "0.5rem",
                  fontSize: 16,
                }}
              />
            </Typography>
          </Link>
          {` `}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            component="span"
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            {` `}by{` `}
            <Button
              variant="text"
              size="small"
              style={{ padding: 0 }}
              onClick={() =>
                actions.queryArtist(
                  track.artists[0].id,
                  track.artists[0].name,
                  1,
                )
              }
            >
              <strong>{track.artists?.[0]?.name}</strong>
            </Button>
          </Typography>
        </div>
      </Stack>
      <Stack direction={display === "large" ? "column" : "row"}>
        <img
          height={display === "small" ? 120 : "100%"}
          width={display === "small" ? 120 : "100%"}
          src={`https://resources.tidal.com/images/${track.album.cover?.replace(
            /-/g,
            "/",
          )}/750x750.jpg`}
          alt="Live from space album cover"
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 0",
            position: "relative",
          }}
        >
          <CardContent
            sx={{ flex: "0 0 auto", padding: "0.5rem 1rem !important" }}
          >
            <Stack direction="row" flexWrap="wrap" spacing={1} marginBottom={1}>
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
            <Box
              lineHeight={1.2}
              marginBottom={1}
              fontSize={14}
              minHeight={30}
              alignContent="center"
            >
              Album :{" "}
              <Link
                href={`/?query=${TIDAL_PUBLIC_BROWSE_URL}/album/${track.album.id}`}
              >
                {track.album.title}
              </Link>
            </Box>
            <Stack direction="row" flexWrap="wrap" spacing={1}>
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
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
