import { Link, useNavigate } from "react-router-dom";
import { List, MusicNote } from "@mui/icons-material";
import { Box, Button, Chip, Stack, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useSearchProvider } from "src/provider/SearchProvider";
import { PlaylistType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";

export default function Playlist({ playlist }: { playlist: PlaylistType }) {
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
        <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
          <Link
            to={`/playlist/${playlist.uuid}`}
            style={{
              lineHeight: 1.2,
              color: theme.palette.primary.main,
              textDecoration: "none",
            }}
          >
            <Typography component="span" style={{ lineHeight: 1 }}>
              <strong>{playlist.title}</strong>
            </Typography>
          </Link>
        </div>
      </Stack>
      <Stack direction={display === "large" ? "column" : "row"}>
        <Link to={`/playlist/${playlist.uuid}`} style={{ lineHeight: 0 }}>
          <img
            height={display === "small" ? 120 : "100%"}
            width={display === "small" ? 120 : "100%"}
            src={`https://resources.tidal.com/images/${playlist.squareImage?.replace(
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
          <CardContent
            sx={{ flex: "0 0 auto", padding: "0.5rem 1rem !important" }}
          >
            <Stack
              direction="row"
              flexWrap="wrap"
              spacing={1}
              style={{ marginBottom: "1rem", minHeight: "3rem" }}
            >
              <Chip
                label={`${Math.round(playlist.duration / 60)} min.`}
                color="success"
                size="small"
              />
              <Chip label={`${playlist.numberOfTracks} tracks`} size="small" />
            </Stack>
            <Stack direction="row" flexWrap="wrap" spacing={1}>
              <Button
                onClick={() => navigate(`/playlist/${playlist.uuid}`)}
                size="small"
                variant="outlined"
                sx={{ minWidth: 0, pl: 0 }}
              >
                <MusicNote />
                <List />
              </Button>
              <DownloadButton
                item={playlist}
                id={playlist.uuid}
                type="playlist"
                label="Playlist"
              />
            </Stack>
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
