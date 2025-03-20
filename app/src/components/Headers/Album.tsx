import { useNavigate } from "react-router-dom";
import { Avatar, Button, Chip, Stack, useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";

import { AlbumType } from "../../types";
import { DownloadButton } from "../Buttons/DownloadButton";

import PageHeader from "./Header";

export default function AlbumHeader({ album }: { album: AlbumType }) {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <PageHeader
      title={album.title}
      url={album.url}
      image={`https://resources.tidal.com/images/${album.cover?.replace(
        /-/g,
        "/",
      )}/750x750.jpg`}
      afterTitle={
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          spacing={1}
          style={{ marginBottom: "0.5rem" }}
        >
          <Chip
            label={album.audioQuality.toLowerCase()}
            size="small"
            style={{
              margin: "0.3rem 0.2rem",
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
            style={{ margin: "0.3rem 0.2rem" }}
          />
          <Chip
            label={`${Math.round(album.duration / 60)} min`}
            size="small"
            style={{ margin: "0.3rem 0.2rem" }}
            variant="outlined"
          />
          <Chip
            label={`${new Date(album.releaseDate).getFullYear()}`}
            size="small"
            variant="outlined"
            style={{ margin: "0.3rem 0.2rem" }}
          />
          <DownloadButton
            item={album}
            id={album.id}
            type="album"
            label="Get album"
          />
        </Stack>
      }
      beforeTitle={
        <Stack direction="row" flexWrap="wrap" spacing={1} alignItems="center">
          <Avatar
            alt={album.artists?.[0]?.name}
            sx={{ width: 42, height: 42 }}
            src={`https://resources.tidal.com/images/${album.artists?.[0]?.picture?.replace(
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
                navigate(`/artist/${album.artists[0].id}`);
              }}
            >
              <strong>{album.artists?.[0]?.name}</strong>
            </Button>
          </Typography>
        </Stack>
      }
      subtitle={album.type}
    />
  );
}
