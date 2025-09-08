import { useNavigate } from "react-router-dom";
import { Button, Chip, Stack } from "@mui/material";
import Typography from "@mui/material/Typography";

import { AlbumType } from "../../types";
import { DownloadButton } from "../Buttons/DownloadButton";
import { ArtistAvatar } from "../Cards/common/ArtistAvatar";
import { ChipQuality } from "../Cards/common/ChipQuality";

import PageHeader from "./Header";

export default function AlbumHeader({ album }: { album: AlbumType }) {
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
          gap={0.5}
          style={{ marginBottom: "0.5rem" }}
        >
          <ChipQuality quality={album.audioQuality.toLowerCase()} />
          <Chip label={`${album.numberOfTracks} tracks`} size="small" />
          <Chip
            label={`${Math.round(album.duration / 60)} min`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${new Date(album.releaseDate).getFullYear()}`}
            size="small"
            variant="outlined"
          />
          {album.explicit && (
            <Chip label="Explicit" size="small" variant="outlined" />
          )}
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
          <ArtistAvatar
            alt={album.artists?.[0]?.name}
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
