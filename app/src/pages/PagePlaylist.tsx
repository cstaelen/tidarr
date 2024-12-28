import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import PlaylistHeader from "src/components/Headers/Playlist";
import NoResult from "src/components/Results/NoResults";
import Pager from "src/components/Results/Pager";
import TypeResults from "src/components/Results/TypeResults";
import { usePlaylist } from "src/hooks/usePlaylist";

import { AlbumsLoader } from "../components/Skeletons/AlbumsLoader";

export default function PagePlaylist() {
  const { id } = useParams();
  const { loading, playlist, tracks, actions, page, total } = usePlaylist(id);

  if (!loading && !playlist) {
    return <NoResult />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {playlist ? (
        <>
          <Box mb={2}>
            <PlaylistHeader playlist={playlist} />
          </Box>
          {tracks && tracks?.length > 0 && (
            <Box>
              <TypeResults type="tracks" data={tracks} />
              <Pager page={page} setPage={actions.setPage} totalItems={total} />
            </Box>
          )}
        </>
      ) : null}

      {loading && (
        <Box py={2}>
          <AlbumsLoader />
        </Box>
      )}
    </Container>
  );
}
