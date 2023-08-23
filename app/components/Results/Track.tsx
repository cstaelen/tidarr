import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { TrackType } from "@/app/types";
import { Avatar, Box, Chip, Link, Stack } from "@mui/material";
import { DownloadButton } from "../DownloadButton";
import Image from "next/image";

export default function Track({ track }: { track: TrackType }) {
  return (
    <Card sx={{ display: "flex" }}>
      <Image
        style={{ maxWidth: window.innerWidth < 640 ? '25%' : 'none' }}
        width={200}
        height={200}
        src={`https://resources.tidal.com/images/${track.album.cover?.replace(
          /-/g,
          "/"
        )}/750x750.jpg`}
        alt="Live from space album cover"
      />
      <Box sx={{ display: "flex", flexDirection: "column", flex: "1 1 0" }}>
        <CardContent sx={{ flex: "0 0 auto", padding: "1rem" }}>
          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={1}
            alignItems="center"
            style={{ marginBottom: "0.5rem" }}
          >
            <Avatar
              alt={track.artists?.[0]?.name}
              sx={{ width: 42, height: 42 }}
              src={`https://resources.tidal.com/images/${track.artists?.[0]?.picture?.replace(
                /-/g,
                "/"
              )}/750x750.jpg`}
            />
            <Link
              href={track.url}
              style={{ flex: "1 1 0" }}
              target="_blank"
              underline="none"
            >
              <Typography component="span">
                <strong>{track.title}</strong>
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                component="span"
              >
                &nbsp;- by {track.artists?.[0]?.name}
              </Typography>
            </Link>
          </Stack>
          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={1}
            style={{ marginBottom: "1rem" }}
          >
            <Chip
              label={track.audioQuality.toLowerCase()}
              color="primary"
              size="small"
            />
            <Chip
              label={`${Math.round(track.duration / 60)} min.`}
              color="success"
              size="small"
            />
          </Stack>
          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={1}
          >
            <DownloadButton item={track} id={track.album.id} type="album" label="Get album"/>
            <DownloadButton item={track} id={track.id} type="track" label="Get track"/>
          </Stack>
          <small>Album title : {track.album.title}</small>
        </CardContent>
      </Box>
    </Card>
  );
}
