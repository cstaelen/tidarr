import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { TrackType } from "@/app/types";
import { Avatar, Box, Chip, Link, Stack } from "@mui/material";
import { DownloadButton } from "../DownloadButton";
import Image from "next/image";

export default function Track({ track }: { track: TrackType }) {
  return (
    <Card sx={{ position: "relative" }}>
      <Stack
        direction="row"
        flexWrap="wrap"
        spacing={1}
        alignItems="center"
        style={{ padding: "0.4rem 0.5rem 0.5rem", backgroundColor: "rgba(255, 255, 255, 0.04)" }}
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
          style={{ flex: "1 1 0", lineHeight: 1.2 }}
          target="_blank"
          underline="none"
        >
          <Typography component="span" style={{ lineHeight: 1 }}>
            <strong>{track.title}</strong>
            <OpenInNewIcon style={{ verticalAlign: "middle", marginLeft: "0.5rem", fontSize: 16 }} />
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            component="span"
            style={{ lineHeight: 1 }}
          >
            &nbsp;- by {track.artists?.[0]?.name}
          </Typography>
        </Link>
      </Stack>
      <Stack direction="row">
        <Image
          width={120}
          height={120}
          src={`https://resources.tidal.com/images/${track.album.cover?.replace(
            /-/g,
            "/"
          )}/750x750.jpg`}
          alt="Live from space album cover"
        />
        <Box sx={{ display: "flex", flexDirection: "column", flex: "1 1 0", position: "relative" }}>
          <CardContent sx={{ flex: "0 0 auto", padding: "0.5rem 1rem !important" }}>
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
              <DownloadButton item={track} id={track.album.id} type="album" label="Album" />
              <DownloadButton item={track} id={track.id} type="track" label="Track" />
            </Stack>
            <small>Album : {track.album.title}</small>
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
