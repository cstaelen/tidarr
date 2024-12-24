import { useState } from "react";
import { VideoFile } from "@mui/icons-material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Avatar, Box, Button, Chip, Link, Paper, Stack } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useSearchProvider } from "src/provider/SearchProvider";
import { VideoType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import { DialogHandler } from "../Dialog";

export default function VideoCard({ video }: { video: VideoType }) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const { display, actions } = useSearchProvider();

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
          <Avatar
            alt={video.artists?.[0]?.name}
            sx={{ width: 42, height: 42 }}
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
              <Typography component="span" style={{ lineHeight: 1 }}>
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
                onClick={() =>
                  actions.queryArtist(
                    video.artists[0].id,
                    video.artists[0].name,
                    1,
                  )
                }
              >
                <strong>{video.artists?.[0]?.name}</strong>
              </Button>
            </Typography>
          </div>
        </Stack>
        <Stack direction={display === "large" ? "column" : "row"}>
          <Box
            style={{
              height: 0,
              paddingBottom: display === "small" ? 120 : "56%",
              width: display === "small" ? 120 : "100%",
            }}
          >
            <img
              height={display === "small" ? 120 : "56%"}
              width={display === "small" ? 120 : "100%"}
              src={`https://resources.tidal.com/images/${video.imageId?.replace(
                /-/g,
                "/",
              )}/750x750.jpg`}
              alt="Live from space album cover"
              style={{ position: "absolute", objectFit: "cover" }}
            />
          </Box>
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
                style={{ marginBottom: "1rem" }}
              >
                <Chip
                  label={`${Math.round(video.duration / 60)} min.`}
                  color="success"
                  size="small"
                />
              </Stack>
              <Button onClick={() => setShowModal(true)}>Play</Button>
              <DownloadButton
                item={video}
                id={video.id}
                type="playlist"
                label="Get video"
              />
            </CardContent>
          </Box>
        </Stack>
      </Card>
      <DialogHandler title={video.title} open={showModal} icon={<VideoFile />}>
        <Paper sx={{ lineHeight: 0 }}>
          <iframe
            src={`https://embed.tidal.com/videos/${video.id}`}
            width={window.innerWidth * 0.8}
            height={window.innerWidth * 0.8 * 0.56}
            allow="encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="TIDAL Embed Player"
          />
        </Paper>
      </DialogHandler>
    </>
  );
}
