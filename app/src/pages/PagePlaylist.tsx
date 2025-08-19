import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import PlaylistHeader from "src/components/Headers/Playlist";
import Pager from "src/components/Search/Pager";
import Module from "src/components/TidalModule/Module";
import NoResult from "src/components/TidalModule/NoResults";
import { usePlaylist } from "src/hooks/usePlaylist";

export default function PagePlaylist() {
  const { id } = useParams();
  const { loading, playlist, tracks, actions, page, total } = usePlaylist(id);

  if (!loading && !playlist) {
    return <NoResult />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {playlist ? (
        <Box mb={2}>
          <PlaylistHeader playlist={playlist} />
        </Box>
      ) : null}

      <Box>
        <Module type="TRACK_LIST" data={tracks} loading={loading} />
        <Pager page={page} setPage={actions.setPage} totalItems={total} />
      </Box>
    </Container>
  );
}
