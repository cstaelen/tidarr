import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import AlbumHeader from "src/components/Headers/Album";
import NoResult from "src/components/Results/NoResults";
import TypeResults from "src/components/Results/TypeResults";
import { useAlbum } from "src/hooks/useAlbum";

import { AlbumsLoader } from "../components/Skeletons/AlbumsLoader";

export default function PageAlbum() {
  const { id } = useParams();
  const { loading, album, tracks } = useAlbum(id);

  if (!loading && !album) {
    return <NoResult />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {album ? (
        <>
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

      {loading && (
        <Box py={2}>
          <AlbumsLoader />
        </Box>
      )}
    </Container>
  );
}
