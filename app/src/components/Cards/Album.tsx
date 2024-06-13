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
import { useSearchProvider } from "src/provider/SearchProvider";

import { AlbumType } from "../../types";
import { DownloadButton } from "../DownloadButton";

export default function AlbumCard({ album }: { album: AlbumType }) {
  const { actions } = useSearchProvider();
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
          alt={album.artists?.[0]?.name}
          sx={{ width: 42, height: 42 }}
          src={`https://resources.tidal.com/images/${album.artists?.[0]?.picture?.replace(
            /-/g,
            "/",
          )}/750x750.jpg`}
        />
        <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
          <Link
            href={album.url}
            style={{ lineHeight: 1.4 }}
            target="_blank"
            underline="none"
          >
            <Typography component="span" style={{ lineHeight: 1 }}>
              <strong>{album.title}</strong>
            </Typography>
            <OpenInNewIcon
              style={{
                verticalAlign: "middle",
                marginLeft: "0.5rem",
                fontSize: 16,
              }}
            />
          </Link>
          {` `}
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
              onClick={() =>
                actions.queryArtist(
                  album.artists[0].id,
                  album.artists[0].name,
                  1,
                )
              }
            >
              <strong>{album.artists?.[0]?.name}</strong>
            </Button>
          </Typography>
        </div>
      </Stack>
      <Stack direction="row">
        <img
          width={120}
          height={120}
          src={`https://resources.tidal.com/images/${album.cover?.replace(
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
          <CardContent sx={{ flex: "0 0 auto", padding: "0.5rem !important" }}>
            <Stack
              direction="row"
              flexWrap="wrap"
              spacing={1}
              style={{ marginBottom: "0.5rem" }}
            >
              <Chip
                label={album.audioQuality.toLowerCase()}
                size="small"
                style={{
                  margin: "0.2rem",
                  color:
                    album?.audioQuality?.toLowerCase() === "lossless"
                      ? theme.palette.common.white
                      : theme.palette.common.black,
                  backgroundColor:
                    album?.audioQuality?.toLowerCase() === "lossless"
                      ? theme.palette.gold
                      : theme.palette.primary.main,
                }}
              />
              <Chip
                label={`${album.numberOfTracks} tracks`}
                size="small"
                style={{ margin: "0.2rem" }}
              />
              <Chip
                label={`${Math.round(album.duration / 60)} min`}
                size="small"
                style={{ margin: "0.2rem" }}
                variant="outlined"
              />
              <Chip
                label={`${new Date(album.releaseDate).getFullYear()}`}
                size="small"
                variant="outlined"
                style={{ margin: "0.2rem" }}
              />
              {/* album?.popularity ? (
                <Chip
                  label={`Popularity: ${album.popularity}%`}
                  size="small"
                  variant="outlined"
                  style={{ margin: "0.2rem" }}
                  color={
                    album.popularity > 75
                      ? "success"
                      : album.popularity > 33
                      ? "warning"
                      : "error"
                  }
                />
              ) : null*/}
            </Stack>
            <DownloadButton
              item={album}
              id={album.id}
              type="album"
              label="Get album"
            />
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
