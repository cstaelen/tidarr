import { ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Stack, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { AlbumArtistType } from "src/types";
import { formatDate } from "src/utils/helpers";

import { ArtistAvatar } from "./ArtistAvatar";
import { ChipQuality } from "./ChipQuality";
import CoverLink from "./CoverLink";
import ImageLazy from "./ImageLazy";

const CardArtistButton = ({ url, name }: { url: string; name?: string }) => {
  const navigate = useNavigate();

  if (!url || !name) return;

  return (
    <Button
      variant="text"
      size="small"
      color="inherit"
      style={{ padding: "0 0.15rem" }}
      onClick={() => {
        navigate(url);
      }}
    >
      <strong>{name}</strong>
    </Button>
  );
};

const CardArtistAvatar = ({
  url,
  picture,
  name,
}: {
  url?: string;
  picture?: string;
  name?: string;
}) => {
  const { display } = useConfigProvider();

  return (
    <>
      {url && picture && name && (
        <Link to={url} style={{ textDecoration: "none" }}>
          <ArtistAvatar
            alt={name}
            src={`https://resources.tidal.com/images/${picture?.replace(
              /-/g,
              "/",
            )}/750x750.jpg`}
            sx={display === "large" ? { width: 32, height: 32 } : undefined}
          />
        </Link>
      )}
    </>
  );
};

const CardTitle = ({ title, url }: { title: string; url: string }) => {
  const theme = useTheme();
  const { display } = useConfigProvider();

  return (
    <Link
      to={url}
      style={{
        textDecoration: "none",
      }}
    >
      <Typography
        component="span"
        sx={{
          lineHeight: 1,
          color: display === "small" ? theme.palette.primary.main : "white",
          fontSize: display === "small" ? "0.875rem" : "1.125rem",
          ":hover": { textDecoration: "underline" },
        }}
      >
        <strong>{title}</strong>
      </Typography>
    </Link>
  );
};

const CardHeader = ({
  title,
  url,
  artist,
  createdDate,
}: {
  title: string;
  url: string;
  artist?: AlbumArtistType;
  createdDate?: string;
}) => {
  const { display } = useConfigProvider();

  // Mode small

  if (display === "small")
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CardArtistAvatar
          picture={artist?.picture}
          url={url}
          name={artist?.name}
        />
        <div style={{ lineHeight: 1, flex: "1 1 0" }}>
          <CardTitle title={title} url={url} />

          {artist?.id && artist?.name && (
            <>
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
                <CardArtistButton
                  name={artist?.name}
                  url={`/artist/${artist?.id}`}
                />
              </Typography>
            </>
          )}
          {createdDate && (
            <Typography
              sx={{
                lineHeight: 1,
                fontSize: "0.875rem",
              }}
              color="textDisabled"
            >
              {formatDate(createdDate)}
            </Typography>
          )}
        </div>
      </Box>
    );

  // Mode large

  return (
    <Box m={1}>
      <CardTitle title={title} url={url} />
      {artist && (
        <Box display="flex" gap={1} alignItems="center" mt={1}>
          <CardArtistAvatar
            picture={artist?.picture}
            url={url}
            name={artist?.name}
          />
          <div>
            <CardArtistButton
              name={artist?.name}
              url={`/artist/${artist?.id}`}
            />
          </div>
        </Box>
      )}
    </Box>
  );
};

type CardSwitchDisplayProps = {
  // Required fields
  id: string;
  title: string;
  coverUrl: string;
  linkUrl: string;
  downloadType: "album" | "playlist" | "mix";
  downloadLabel: string;

  // Optional fields for all types
  subtitle?: string;

  // Artist specific (for albums)
  artist?: AlbumArtistType;

  // Metadata chips
  audioQuality?: string;
  numberOfTracks?: number;
  duration?: number;
  releaseDate?: string;
  explicit?: boolean;

  // Dates (for playlists)
  createdDate?: string;
  lastUpdatedDate?: string;
  buttons: ReactElement;
};

export default function CardSwitchDisplay({
  title,
  coverUrl,
  linkUrl,
  subtitle,
  artist,
  audioQuality,
  numberOfTracks,
  duration,
  releaseDate,
  explicit,
  createdDate,
  lastUpdatedDate,
  buttons,
}: CardSwitchDisplayProps) {
  const { display } = useConfigProvider();

  return (
    <Card
      sx={{
        position: "relative",
        ":after":
          display === "large"
            ? {
                background:
                  "linear-gradient(180deg,rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 1) 100%)",
                content: '""',
                height: "100%",
                width: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 5,
              }
            : null,
      }}
    >
      <Stack
        direction="row"
        flexWrap="wrap"
        spacing={1}
        alignItems="center"
        style={{
          minHeight: "60px",
          width: "100%",
          padding: "0.4rem 0.5rem 0.5rem",
          background:
            display === "small" ? "rgba(255, 255, 255, 0.04)" : "transparent",
          position: display === "small" ? "relative" : "absolute",
          zIndex: 10,
        }}
      >
        <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
          <CardHeader
            artist={artist}
            title={title}
            url={linkUrl}
            createdDate={createdDate}
          />
        </div>
      </Stack>
      <Stack direction={display === "large" ? "column" : "row"}>
        <CoverLink url={linkUrl}>
          <ImageLazy
            height={display === "small" ? 120 : "100%"}
            width={display === "small" ? 120 : "100%"}
            src={coverUrl}
            alt={`${title} cover`}
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
              padding: "0.5rem 1rem !important",
              display: "flex",
              flexDirection: "column",
              height: display === "small" ? "100%" : "auto",
              position: display === "large" ? "absolute" : "relative",
              bottom: display === "large" ? "0.5rem" : "inherit",
              width: "100%",
              zIndex: 10,
            }}
          >
            {/* Subtitle for mixes */}
            {subtitle && (
              <Typography
                variant="subtitle2"
                sx={{ lineHeight: 1.4, mb: 1, flex: "1 1 0" }}
              >
                {subtitle}
              </Typography>
            )}

            {/* Metadata chips */}
            {(audioQuality ||
              numberOfTracks ||
              duration ||
              releaseDate ||
              explicit) && (
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={0.5}
                style={{ marginBottom: "0.5rem" }}
                flex="1 1 0"
              >
                {audioQuality && (
                  <ChipQuality quality={audioQuality.toLowerCase()} />
                )}
                {numberOfTracks && (
                  <Chip label={`${numberOfTracks} tracks`} size="small" />
                )}
                {duration && (
                  <Chip
                    label={`${Math.round(duration / 60)} min`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {releaseDate && (
                  <Chip
                    label={`${new Date(releaseDate).getFullYear()}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {explicit && (
                  <Chip label="Explicit" size="small" variant="outlined" />
                )}
              </Stack>
            )}

            {/* Last updated date for playlists */}
            {lastUpdatedDate && (
              <Typography
                sx={{
                  lineHeight: 1,
                  fontSize: "0.875rem",
                  mb: 1,
                }}
                color="textDisabled"
              >
                Last update: {formatDate(lastUpdatedDate)}
              </Typography>
            )}

            {/* Action buttons */}
            <Stack direction="row" gap={1}>
              {buttons}
            </Stack>
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
