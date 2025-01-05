import { Link } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useSearchProvider } from "src/provider/SearchProvider";
import { TrackType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";

function StackDownloadButtons({ track }: { track: TrackType }) {
  return (
    <Stack direction="row" flexWrap="wrap" spacing={1}>
      <DownloadButton
        item={track}
        id={track.album.id}
        type="album"
        label="Album"
      />
      <DownloadButton item={track} id={track.id} type="track" label="Track" />
    </Stack>
  );
}

function StackChips({ track }: { track: TrackType }) {
  const theme = useTheme();

  return (
    <>
      <Chip
        label={track.audioQuality.toLowerCase()}
        color="primary"
        size="small"
        sx={{
          margin: "0.2rem",
          color:
            track?.audioQuality?.toLowerCase() === "lossless"
              ? theme.palette.common.white
              : theme.palette.common.black,
          backgroundColor:
            track?.audioQuality?.toLowerCase() === "lossless"
              ? theme.palette.gold
              : theme.palette.primary.main,
        }}
      />
      <Chip
        label={`${Math.round(track.duration / 60)} min.`}
        color="success"
        size="small"
      />
    </>
  );
}

function AlbumLink({ track }: { track: TrackType }) {
  const theme = useTheme();

  return (
    <>
      Album :{" "}
      <Link
        to={`/album/${track.album.id}`}
        style={{
          color: theme.palette.primary.main,
        }}
      >
        {track.album.title}
      </Link>
    </>
  );
}

function ArtistAvatar({ track }: { track: TrackType }) {
  return (
    <Avatar
      alt={track.artists?.[0]?.name}
      sx={{ width: 42, height: 42 }}
      src={`https://resources.tidal.com/images/${track.artists?.[0]?.picture?.replace(
        /-/g,
        "/",
      )}/750x750.jpg`}
    />
  );
}

function CoverLink({
  track,
  width,
  height,
}: {
  track: TrackType;
  width: string | number;
  height: string | number;
}) {
  return (
    <Link
      to={`/track/${track.id}`}
      style={{
        lineHeight: 0,
        display: "block",
        pointerEvents: track?.allowStreaming ? "inherit" : "none",
        opacity: track?.allowStreaming ? 1 : 0.2,
      }}
    >
      <img
        height={width}
        width={height}
        src={`https://resources.tidal.com/images/${track.album.cover?.replace(
          /-/g,
          "/",
        )}/750x750.jpg`}
        alt="Live from space album cover"
      />
    </Link>
  );
}

function TitleLink({ track }: { track: TrackType }) {
  const theme = useTheme();

  return (
    <Link
      to={`/track/${track.id}`}
      style={{
        lineHeight: 1.2,
        color: theme.palette.primary.main,
        textDecoration: "none",
      }}
    >
      <Typography component="span" style={{ lineHeight: 1 }}>
        <strong>{track.title}</strong>
      </Typography>
    </Link>
  );
}

function ArtistLink({ track }: { track: TrackType }) {
  const theme = useTheme();

  return (
    <Link
      to={`/artist/${track.artists[0].id}`}
      style={{ color: theme.palette.primary.main }}
    >
      {track.artists?.[0]?.name}
    </Link>
  );
}

function TrackCard({ track }: { track: TrackType }) {
  return (
    <Card
      sx={{
        position: "relative",
        pointerEvents: track?.allowStreaming ? "inherit" : "none",
        opacity: track?.allowStreaming ? 1 : 0.2,
      }}
    >
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
        <ArtistAvatar track={track} />
        <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
          <TitleLink track={track} />
          {` `}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            component="span"
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            {` `}by{` `}
            <ArtistLink track={track} />
          </Typography>
        </div>
      </Stack>
      <Stack direction={"row"}>
        <CoverLink track={track} height={120} width={120} />
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
            <Stack direction="row" flexWrap="wrap" spacing={1} marginBottom={1}>
              <StackChips track={track} />
            </Stack>

            <Box
              lineHeight={1.2}
              marginBottom={1}
              fontSize={14}
              minHeight={30}
              alignContent="center"
            >
              <AlbumLink track={track} />
            </Box>
            <StackDownloadButtons track={track} />
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}

function TrackInline({ track }: { track: TrackType }) {
  const cellStyle: React.CSSProperties = {
    lineHeight: "1.25",
    padding: "0.25rem",
    pointerEvents: track?.allowStreaming ? "inherit" : "none",
    opacity: track?.allowStreaming ? 1 : 0.2,
  };

  return (
    <Card sx={{ p: 1 }}>
      <Box
        width="100%"
        sx={{
          alignItems: "center",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "5rem 1.5fr 1fr 1.5fr 2fr auto",
        }}
      >
        <div>
          <CoverLink track={track} height={64} width={64} />
        </div>
        <div style={cellStyle}>
          <TitleLink track={track} />
        </div>
        <div style={cellStyle}>
          <StackChips track={track} />
        </div>
        <div style={cellStyle}>
          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={1}
            alignItems="center"
          >
            <ArtistAvatar track={track} />
            <ArtistLink track={track} />
          </Stack>
        </div>
        <div style={cellStyle}>
          <AlbumLink track={track} />
        </div>
        <div style={cellStyle}>
          <StackDownloadButtons track={track} />
        </div>
      </Box>
    </Card>
  );
}

export default function Track({ track }: { track: TrackType }) {
  const { display } = useSearchProvider();
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up("md"));

  if (display === "small" && isLarge) {
    return <TrackInline track={track} />;
  } else {
    return <TrackCard track={track} />;
  }
}
