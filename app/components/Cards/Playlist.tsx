import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { PlaylistType } from "@/app/types";
import { Box, Chip, Link, Stack } from "@mui/material";
import { DownloadButton } from "../DownloadButton";
import Image from "next/image";

export default function Playlist({ playlist }: { playlist: PlaylistType }) {
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
        <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
          <Link
            href={playlist.url}
            style={{ lineHeight: 1.2 }}
            target="_blank"
            underline="none"
          >
            <Typography component="span" style={{ lineHeight: 1 }}>
              <strong>{playlist.title}</strong>
              <OpenInNewIcon
                style={{
                  verticalAlign: "middle",
                  marginLeft: "0.5rem",
                  fontSize: 16,
                }}
              />
            </Typography>
          </Link>
        </div>
      </Stack>
      <Stack direction="row">
        <Image
          width={120}
          height={120}
          src={`https://resources.tidal.com/images/${playlist.squareImage?.replace(
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
            <Stack
              direction="row"
              flexWrap="wrap"
              spacing={1}
              style={{ marginBottom: "1rem" }}
            >
              <Chip
                label={`${Math.round(playlist.duration / 60)} min.`}
                color="success"
                size="small"
              />
              <Chip label={`${playlist.numberOfTracks} tracks`} size="small" />
            </Stack>
            <DownloadButton
              item={playlist}
              id={playlist.uuid}
              type="playlist"
              label="Get playlist"
            />
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
