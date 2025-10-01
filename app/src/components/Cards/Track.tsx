import { Link } from "react-router-dom";
import { Box, Chip, Stack, useMediaQuery, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { TrackType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";

import { ArtistAvatar } from "./common/ArtistAvatar";
import { ChipQuality } from "./common/ChipQuality";
import CoverLink from "./common/CoverLink";
import ImageLazy from "./common/ImageLazy";

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
  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={0.5}
      alignItems="flex-start"
      my={1}
    >
      <ChipQuality quality={track?.audioQuality?.toLowerCase()} />
      <Chip
        label={`${Math.round(track.duration / 60)} min.`}
        color="success"
        size="small"
      />
      {track?.explicit && (
        <Chip label="Explicit" variant="outlined" size="small" />
      )}
    </Box>
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

function ArtistPic({ track }: { track: TrackType }) {
  return (
    <ArtistAvatar
      alt={track.artists?.[0]?.name || ""}
      src={`https://resources.tidal.com/images/${track.artists?.[0]?.picture?.replace(
        /-/g,
        "/",
      )}/750x750.jpg`}
    />
  );
}

function TrackCoverLink({
  track,
  width,
  height,
}: {
  track: TrackType;
  width: string | number;
  height: string | number;
}) {
  return (
    <CoverLink
      url={`/track/${track.id}`}
      style={{
        display: "block",
        pointerEvents: track?.allowStreaming ? "inherit" : "none",
        opacity: track?.allowStreaming ? 1 : 0.2,
      }}
    >
      <ImageLazy
        height={width}
        width={height}
        src={`https://resources.tidal.com/images/${track.album.cover?.replace(
          /-/g,
          "/",
        )}/750x750.jpg`}
        alt="Live from space album cover"
      />
    </CoverLink>
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
      <Typography
        component="span"
        style={{ lineHeight: 1, fontSize: "0.875rem" }}
      >
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
        alignItems="flex-start"
        style={{
          minHeight: "72px",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
        }}
      >
        <TrackCoverLink track={track} height={72} width={72} />
        <div style={{ lineHeight: 1.4, flex: "1 1 0", padding: "5px 0" }}>
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
          &nbsp;
          <StackChips track={track} />
        </div>
      </Stack>
      <Stack direction={"row"}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 0",
            position: "relative",
          }}
        >
          <CardContent sx={{ p: "0.5rem !important", m: 0 }}>
            <Stack direction="row" gap={1}>
              <Box
                flex="1 1 0"
                lineHeight={1.2}
                fontSize={14}
                minHeight={30}
                alignContent="center"
              >
                <AlbumLink track={track} />
              </Box>
              <div>
                <StackDownloadButtons track={track} />
              </div>
            </Stack>
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
          gridTemplateColumns: "4.5rem 1.5fr 1fr 1.5fr 2fr auto",
        }}
      >
        <div>
          <TrackCoverLink track={track} height={64} width={64} />
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
            <ArtistPic track={track} />
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
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up("md"));

  if (isLarge) {
    return <TrackInline track={track} />;
  } else {
    return <TrackCard track={track} />;
  }
}
