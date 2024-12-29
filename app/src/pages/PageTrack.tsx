import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import AlbumHeader from "src/components/Headers/Album";
import TrackHeader from "src/components/Headers/Track";
import NoResult from "src/components/Results/NoResults";
import TypeResults from "src/components/Results/TypeResults";
import { useAlbum } from "src/hooks/useAlbum";
import { useTrack } from "src/hooks/useTrack";

import { AlbumsLoader } from "../components/Skeletons/AlbumsLoader";

export default function PageTrack() {
  const { id } = useParams();
  const { loading: loadingTrack, track } = useTrack(id);
  const { loading: loadingAlbum, album, tracks } = useAlbum(track?.album.id);

  if (!loadingTrack && !track) {
    return <NoResult />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {track ? (
        <>
          <Box mb={2}>
            <TrackHeader track={track} />
          </Box>
          {album ? (
            <>
              <h2>Related album :</h2>
              <Box mb={2}>
                <AlbumHeader album={album} />
              </Box>
              {tracks && tracks?.length > 0 && (
                <Box>
                  <TypeResults type="tracks" data={tracks} />
                </Box>
              )}
            </>
          ) : null}
        </>
      ) : null}

      {(loadingTrack || loadingAlbum) && (
        <Box py={2}>
          <AlbumsLoader />
        </Box>
      )}
    </Container>
  );
}
