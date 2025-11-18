import { useNavigate } from "react-router-dom";
import { MusicNote } from "@mui/icons-material";
import { Alert, AlertTitle, Box, Button, Link } from "@mui/material";
import { ArtistType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import { PlexSearchButton } from "../Buttons/PlexSearchButton";
import SyncButton from "../Buttons/SyncButton";

import PageHeader from "./Header";

export default function ArtistHeader({
  artist,
  showVideos,
}: {
  artist: ArtistType;
  showVideos?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={artist.name}
        subtitle="Artist(s)"
        url={artist.url}
        image={`https://resources.tidal.com/images/${artist.picture?.replace(
          /-/g,
          "/",
        )}/750x750.jpg`}
        afterTitle={
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <SyncButton item={artist} type="artist" />
            <DownloadButton
              item={artist}
              id={artist.id}
              type="artist"
              label="Get all releases"
            />
            {showVideos && (
              <DownloadButton
                item={artist}
                id={artist.id}
                type="artist_videos"
                label="Get all videos"
              />
            )}
            {artist?.mixes?.ARTIST_MIX && (
              <Button
                variant="outlined"
                size="small"
                endIcon={<MusicNote />}
                onClick={() => navigate(`/mix/${artist?.mixes?.ARTIST_MIX}`)}
              >
                See artist mix
              </Button>
            )}
            <PlexSearchButton query={artist.name} pivot="artists" />
          </Box>
        }
      />
      <Alert color="info" sx={{ my: 2 }}>
        <AlertTitle>"Get all releases" button.</AlertTitle>
        By default, Singles and EP's are not concerned by the "Get all releases"
        button.
        <br />
        To include them, please update "singles_filter" parameter in your
        "tiddl.json" file.
        <br />
        <Link
          href="https://github.com/cstaelen/tidarr?tab=readme-ov-file#download-settings-optional"
          target="_blank"
        >
          More details on Github
        </Link>
        .
      </Alert>
    </>
  );
}
