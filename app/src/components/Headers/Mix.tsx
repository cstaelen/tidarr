import { Alert, AlertTitle, Box, Chip, Paper } from "@mui/material";
import Typography from "@mui/material/Typography";
import { MixType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import SyncButton from "../Buttons/SyncButton";

import PageHeader from "./Header";

export default function Mix({ mix, total }: { mix: MixType; total: number }) {
  const isVideoMix = mix.mixType === "VIDEO_DAILY_MIX";
  return (
    <>
      <PageHeader
        title={mix.title}
        url={mix.url || ""}
        image={mix.images.SMALL.url}
        subtitle="Mix"
        beforeTitle={isVideoMix ? <>Video Mix</> : <>Mix/Radio</>}
        afterTitle={
          <>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              component="span"
              style={{ lineHeight: 1 }}
            >
              {` `}by{` `}
              <strong>{mix.subTitle}</strong>
            </Typography>
            <Box mt={2} gap={1} display="flex">
              <Chip label={`${total} ${!isVideoMix ? "tracks" : "videos"}`} />
              {!isVideoMix && (
                <>
                  <SyncButton item={mix} type="mix" />
                  <DownloadButton
                    item={mix}
                    id={mix.id}
                    type="mix"
                    label="Get mix"
                  />
                </>
              )}
            </Box>
          </>
        }
      />
      <Box sx={{ my: 2 }}>
        {!isVideoMix && (
          <Alert color="info">
            <AlertTitle>Mix download process</AlertTitle>
            <p>
              The mix will be imported in a newly created playlist before being
              processed.
              <br />
              Use playlist metadatas for "mix" path template in config.toml:
              <Paper
                variant="outlined"
                sx={{ fontFamily: "monospace", my: 2, p: 1 }}
              >
                {`mix = "mixes/{playlist.title}/{playlist.index:02d}. {item.artist} - {item.title_version}"`}
              </Paper>
              At the end, the playlist will be removed.
            </p>
          </Alert>
        )}
      </Box>
    </>
  );
}
