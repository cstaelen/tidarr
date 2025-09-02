import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import AlbumHeader from "src/components/Headers/Album";
import TrackHeader from "src/components/Headers/Track";
import ModuleLoader from "src/components/Skeletons/ModuleLoader";
import Module from "src/components/TidalModule/Module";
import NoResult from "src/components/TidalModule/NoResults";
import { useAlbum } from "src/hooks/useAlbum";
import { useTrack } from "src/hooks/useTrack";

export default function PageTrack() {
  const { id } = useParams();
  const { loading: loadingTrack, track } = useTrack(id);
  const { loading: loadingAlbum, album, tracks } = useAlbum(track?.album.id);

  useEffect(() => window.scrollTo(0, 0), [id]);

  if (!loadingTrack && !track) {
    return <NoResult />;
  }

  return (
    <Container maxWidth="lg">
      <>
        {loadingTrack && <ModuleLoader />}
        <Box mb={2}>{track && <TrackHeader track={track} />}</Box>
        <Box mb={2}>{album && <AlbumHeader album={album} />}</Box>
        <Box>
          <Module type="TRACK_LIST" data={tracks} loading={loadingAlbum} />
        </Box>
      </>
    </Container>
  );
}
