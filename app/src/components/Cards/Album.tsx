import { Link, useNavigate } from "react-router-dom";
import { Avatar, Box, Button, Chip, Stack, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useSearchProvider } from "src/provider/SearchProvider";
import { customColors } from "src/utils/theme";

import { AlbumType } from "../../types";
import { DownloadButton } from "../Buttons/DownloadButton";

import ImageLazy from "./common/ImageLazy";

export default function AlbumCard({ album }: { album: AlbumType }) {
  const { display } = useSearchProvider();
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
            to={`/album/${album.id}`}
            style={{
              lineHeight: 1,
              color: theme.palette.primary.main,
              textDecoration: "none",
            }}
          >
            <Typography component="span" style={{ lineHeight: 1 }}>
              <strong>{album.title}</strong>
            </Typography>
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
        <Link to={`/album/${album.id}`} style={{ lineHeight: 0 }}>
          <ImageLazy
            height={display === "small" ? 120 : "100%"}
            width={display === "small" ? 120 : "100%"}
            src={`https://resources.tidal.com/images/${album.cover?.replace(
              /-/g,
              "/",
            )}/750x750.jpg`}
            alt="Live from space album cover"
          />
        </Link>
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
                      ? customColors.gold
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
