import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AlbumType } from "@/app/types";
import { Avatar, Box, Chip, Link, Stack } from "@mui/material";
import { DownloadButton } from "../DownloadButton";
import Image from "next/image";

export default function AlbumCard({ album }: { album: AlbumType }) {
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
          alt={album.artists?.[0]?.name}
          sx={{ width: 42, height: 42 }}
          src={`https://resources.tidal.com/images/${album.artists?.[0]?.picture?.replace(
            /-/g,
            "/"
          )}/750x750.jpg`}
        />
        <Link
          href={album.url}
          style={{ flex: "1 1 0", lineHeight: 1.2 }}
          target="_blank"
          underline="none"
        >
          <Typography component="span" style={{ lineHeight: 1 }}>
            <strong>{album.title}</strong>
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            component="span"
            style={{ lineHeight: 1 }}
          >
            &nbsp;- by <strong>{album.artists?.[0]?.name}</strong>
          </Typography>
          <OpenInNewIcon style={{ verticalAlign: "middle", marginLeft: "0.5rem", fontSize: 16 }} />
        </Link>
      </Stack>
      <Stack direction="row">
        <Image
          style={{
            width: window.innerWidth < 640 ? '100%' : 'none',
            height: window.innerWidth < 640 ? '100%' : 'none',
            position: window.innerWidth < 640 ? 'absolute' : 'relative',
            objectFit: window.innerWidth < 640 ? 'cover' : 'fill',
            opacity: window.innerWidth < 640 ? 0.2 : 1,
          }}
          width={120}
          height={120}
          src={`https://resources.tidal.com/images/${album.cover?.replace(
            /-/g,
            "/"
          )}/750x750.jpg`}
          alt="Live from space album cover"
        />
        <Box sx={{ display: "flex", flexDirection: "column", flex: "1 1 0", position: "relative" }}>
          <CardContent sx={{ flex: "0 0 auto", padding: "0.5rem !important" }}>
            <Stack direction="row" flexWrap="wrap" spacing={1} style={{ marginBottom: "0.5rem" }}>
              <Chip
                label={album.audioQuality.toLowerCase()}
                color="primary"
                size="small"
                style={{ margin: "0.2rem" }}
              />
              <Chip
                label={`${Math.round(album.duration / 60)} min`}
                color="success"
                size="small"
                style={{ margin: "0.2rem" }}
              />
              <Chip
                label={`${album.numberOfTracks} tracks`}
                color="success"
                size="small"
                variant="outlined"
                style={{ margin: "0.2rem" }}
              />
              <Chip
                label={`${new Date(album.releaseDate).getFullYear()}`}
                color="success"
                size="small"
                variant="outlined"
                style={{ margin: "0.2rem" }}
              />
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
            </Stack>
            <DownloadButton item={album} id={album.id} type="album" label="Get album" />
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}