import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "@emotion/styled";
import { PlayArrow, VideoFile } from "@mui/icons-material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { TIDAL_VIDEO_URL } from "src/contants";
import { VideoType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import { DialogHandler } from "../Dialog";

import { ArtistAvatar } from "./common/ArtistAvatar";
import ImageLazy from "./common/ImageLazy";

export default function VideoCard({ video }: { video: VideoType }) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Card sx={{ position: "relative" }}>
        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={1}
          alignItems="center"
          style={{
            padding: "0.4rem 0.5rem 0.5rem",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <ArtistAvatar
            alt={video.artists?.[0]?.name}
            src={`https://resources.tidal.com/images/${video.artists?.[0]?.picture?.replace(
              /-/g,
              "/",
            )}/750x750.jpg`}
          />
          <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
            <Link
              href={`https://tidal.com/browse/video/${video.id}`}
              style={{ lineHeight: 1.4 }}
              target="_blank"
              underline="none"
            >
              <Typography
                component="span"
                style={{ lineHeight: 1, fontSize: "0.875rem" }}
              >
                <strong>{video.title}</strong>
              </Typography>
              <OpenInNewIcon
                style={{
                  verticalAlign: "middle",
                  marginLeft: "0.5rem",
                  fontSize: 16,
                }}
              />
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
                  navigate(`/artist/${video.artists[0].id}`);
                }}
              >
                <strong>{video.artists?.[0]?.name}</strong>
              </Button>
            </Typography>
          </div>
        </Stack>
        <Stack direction="column">
          <PlayButton onClick={() => setShowModal(true)}>
            <Box style={{}}>
              <ImageLazy
                height="100%"
                width="100%"
                src={`https://resources.tidal.com/images/${video.imageId?.replace(
                  /-/g,
                  "/",
                )}/750x750.jpg`}
                alt="Live from space album cover"
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "220px",
                }}
              />
              <PlayArrow
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "white",
                  opacity: 0.7,
                  fontSize: "3rem",
                }}
              />
            </Box>
          </PlayButton>
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
                gap={2}
                alignItems="center"
                padding={0.5}
              >
                <Box flex="1 1 0">
                  <Chip
                    label={`${Math.round(video.duration / 60)} min.`}
                    color="success"
                    size="small"
                  />
                </Box>
                <Box>
                  <DownloadButton
                    item={{
                      ...video,
                      url: `${TIDAL_VIDEO_URL}/${video.id}`,
                    }}
                    id={video.id}
                    type="video"
                    label="Get video"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Box>
        </Stack>
      </Card>
      <DialogHandler
        title={video.title}
        open={showModal}
        icon={<VideoFile />}
        onClose={() => setShowModal(false)}
      >
        <Paper sx={{ lineHeight: 0 }}>
          <iframe
            src={`https://embed.tidal.com/videos/${video.id}`}
            width={window.innerWidth * (isMobile ? 0.8 : 0.6)}
            height={window.innerWidth * (isMobile ? 0.8 : 0.6) * 0.56}
            allow="encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="TIDAL Embed Player"
          />
        </Paper>
      </DialogHandler>
    </>
  );
}

const PlayButton = styled.button`
  background-color: black;
  border: 0;
  cursor: pointer;
  display: block;
  padding: 0;
  position: relative;

  img {
    transition: opacity 300ms ease;
  }

  &:hover {
    img {
      opacity: 0.3;
    }
  }
`;
