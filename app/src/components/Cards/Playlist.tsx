import { Link } from "react-router-dom";
import { Box, Chip, Stack, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { PlaylistType } from "src/types";
import { formatDate } from "src/utils/helpers";

import { DownloadButton } from "../Buttons/DownloadButton";
import SyncButton from "../Buttons/SyncButton";

import CoverLink from "./common/CoverLink";
import ImageLazy from "./common/ImageLazy";

export default function Playlist({ playlist }: { playlist: PlaylistType }) {
  const { display } = useConfigProvider();
  const theme = useTheme();

  return (
    <Card sx={{ position: "relative" }}>
      <Stack
        direction="row"
        flexWrap="wrap"
        spacing={1}
        alignItems="center"
        style={{
          minHeight: "60px",
          padding: "0.4rem 0.5rem 0.5rem",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
        }}
      >
        <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
          <Link
            to={`/playlist/${playlist.uuid}`}
            style={{
              lineHeight: 1.2,
              color: theme.palette.primary.main,
              textDecoration: "none",
            }}
          >
            <Typography
              component="span"
              sx={{
                lineHeight: 1,
                fontSize: "0.875rem",
                ":hover": { textDecoration: "underline" },
              }}
            >
              <strong>{playlist.title}</strong>
            </Typography>
          </Link>
          {playlist.created && (
            <Typography
              sx={{
                lineHeight: 1,
                fontSize: "0.875rem",
              }}
              color="textDisabled"
            >
              {formatDate(playlist.created)}
            </Typography>
          )}
        </div>
      </Stack>
      <Stack direction={display === "large" ? "column" : "row"}>
        <CoverLink url={`/playlist/${playlist.uuid}`}>
          <ImageLazy
            height={display === "small" ? 120 : "100%"}
            width={display === "small" ? 120 : "100%"}
            src={`https://resources.tidal.com/images/${playlist.squareImage?.replace(
              /-/g,
              "/",
            )}/750x750.jpg`}
            alt="Live from space album cover"
          />
        </CoverLink>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 0",
            position: "relative",
          }}
        >
          <CardContent
            sx={{
              flex: "0 0 auto",
              padding: "0.5rem 1rem !important",
              flexDirection: "column",
              height: "100%",
              display: "flex",
            }}
          >
            <Stack
              direction="column"
              style={{ marginBottom: "1rem", flex: "1 1 0" }}
            >
              <Stack direction="row" flexWrap="wrap" spacing={1}>
                <Chip
                  label={`${Math.round(playlist.duration / 60)} min.`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`${playlist.numberOfTracks} tracks`}
                  size="small"
                />
              </Stack>
              {playlist.created && (
                <Typography
                  sx={{
                    lineHeight: 1,
                    fontSize: "0.875rem",
                    mt: 2,
                  }}
                  color="textDisabled"
                >
                  Last update: {formatDate(playlist.lastUpdated)}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" gap={1}>
              <SyncButton item={playlist} type="playlist" />
              <DownloadButton
                item={playlist}
                id={playlist.uuid}
                type="playlist"
                label="Playlist"
              />
            </Stack>
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
