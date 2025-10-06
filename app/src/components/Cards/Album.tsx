import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Stack, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { AlbumType } from "../../types";
import { DownloadButton } from "../Buttons/DownloadButton";

import { ArtistAvatar } from "./common/ArtistAvatar";
import { ChipQuality } from "./common/ChipQuality";
import CoverLink from "./common/CoverLink";
import ImageLazy from "./common/ImageLazy";

export default function AlbumCard({ album }: { album: AlbumType }) {
  const { display } = useConfigProvider();
  const theme = useTheme();
  const navigate = useNavigate();

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
        <Link to={`/album/${album.id}`} style={{ textDecoration: "none" }}>
          <ArtistAvatar
            alt={album.artists?.[0]?.name}
            src={`https://resources.tidal.com/images/${album.artists?.[0]?.picture?.replace(
              /-/g,
              "/",
            )}/750x750.jpg`}
          />
        </Link>
        <div style={{ lineHeight: 1, flex: "1 1 0" }}>
          <Link
            to={`/album/${album.id}`}
            style={{
              lineHeight: 1,
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
              <strong>{album.title}</strong>
            </Typography>
          </Link>
          {` `}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            component="span"
            style={{
              fontSize: "0.875rem",
              lineHeight: 1,
            }}
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
        </div>
      </Stack>
      <Stack direction={display === "large" ? "column" : "row"}>
        <CoverLink url={`/album/${album.id}`}>
          <ImageLazy
            height={display === "small" ? 120 : "100%"}
            width={display === "small" ? 120 : "100%"}
            src={`https://resources.tidal.com/images/${album.cover?.replace(
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
              padding: "0.5rem !important",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={0.5}
              style={{ marginBottom: "0.5rem" }}
              flex="1 1 0"
            >
              <ChipQuality quality={album?.audioQuality?.toLowerCase()} />
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
            </Stack>
            <Box>
              <DownloadButton
                item={album}
                id={album.id}
                type="album"
                label="Get album"
              />
            </Box>
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
