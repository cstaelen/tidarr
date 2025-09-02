import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import PagerButton from "src/components/Buttons/PagerButton";
import PlaylistHeader from "src/components/Headers/Playlist";
import ModuleLoader from "src/components/Skeletons/ModuleLoader";
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
    <Container maxWidth="lg">
      {!playlist && loading && <ModuleLoader />}
      {playlist ? (
        <Box mb={2}>
          <PlaylistHeader playlist={playlist} />
        </Box>
      ) : null}

      <Box>
        <Module type="TRACK_LIST" data={tracks} />
        <PagerButton page={page} setPage={actions.setPage} totalItems={total} />
      </Box>
    </Container>
  );
}
