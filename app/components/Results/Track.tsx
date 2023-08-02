import * as React from "react";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import DownloadIcon from "@mui/icons-material/Download";
import { TrackType } from "@/app/types";
import { Avatar, Box, Button, Chip, Link, Stack } from "@mui/material";
import { useTidalProvider } from "@/app/provider/TidalProvider";
import { GetServerSidePropsContext } from "next";
import { useTransition } from "react";

export default function Track({ track }: { track: TrackType }) {
  const { actions } = useTidalProvider();
  const [processed, setProcessed] = React.useState<boolean>();
  const [error, setError] = React.useState<boolean>();

  const downloadItem = async (url: string) => {
    const {save} = await actions.save(url);

    if (save) {
      setProcessed(true);
      setError(false);
    } else {
      setProcessed(false);
      setError(true);
    }
  }  
  
  return (
    <Card sx={{ display: "flex" }}>
      <CardMedia
        component="img"
        style={{ width: 200, height: 200, maxWidth: window.innerWidth < 640 ? '25%' : 'none' }}
        image={`https://resources.tidal.com/images/${track.album.cover?.replace(
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
            <Button
              variant="outlined"
              endIcon={<DownloadIcon />}
              onClick={() => downloadItem(track.album.url)}
              disabled={processed}
              size="small"
            >
              {processed ? "Downloading ..." : error ? "Error !"  : "Get album"}
            </Button>
            <Button
              variant="outlined"
              endIcon={<DownloadIcon />}
              disabled={processed}
              onClick={() => downloadItem(track.url)}
              size="small"
            >
              {processed ? "Downloading ..." : error ? "Error !"  : "Get track"}
            </Button>
          </Stack>
          <small>Album title : {track.album.title}</small>
        </CardContent>
      </Box>
    </Card>
  );
}

export const getServerSideProps = (context: GetServerSidePropsContext) => {
  console.log("client", context);
  return { save: true };
};
