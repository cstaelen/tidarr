import * as React from "react";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { AlbumType } from "@/app/types";
import { Avatar, Box, Chip, Link, Stack } from "@mui/material";
import { GetServerSidePropsContext } from "next";
import { DownloadButton } from "../DownloadButton";
import Image from "next/image";

export default function AlbumCard({ album }: { album: AlbumType }) {
  return (
    <Card sx={{ display: "flex" }}>
      <Image
        style={{ maxWidth: window.innerWidth < 640 ? '25%' : 'none' }}
        width={200}
        height={200}
        src={`https://resources.tidal.com/images/${album.cover?.replace(
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
              alt={album.artists?.[0]?.name}
              sx={{ width: 42, height: 42 }}
              src={`https://resources.tidal.com/images/${album.artists?.[0]?.picture?.replace(
                /-/g,
                "/"
              )}/750x750.jpg`}
            />
            <Link
              href={album.url}
              style={{ flex: "1 1 0" }}
              target="_blank"
              underline="none"
            >
              <Typography component="span">
                <strong>{album.title}</strong>
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                component="span"
              >
                &nbsp;- by {album.artists?.[0]?.name}
              </Typography>
            </Link>
          </Stack>
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
          <DownloadButton item={album} id={album.id} type="album" label="Get album"/>
        </CardContent>
      </Box>
    </Card>
  );
}