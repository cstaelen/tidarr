import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import NoResult from "src/components/Results/NoResults";
import { useMix } from "src/hooks/useMix";
import { useSearchProvider } from "src/provider/SearchProvider";

import Mix from "../components/Cards/Mix";
import TypeResults from "../components/Results/TypeResults";
import { AlbumsLoader } from "../components/Skeletons/AlbumsLoader";

export default function MixPage() {
  const { mix, actions } = useMix();
  const { loading } = useSearchProvider();

  const { id } = useParams();

  useEffect(() => {
    if (id) {
      actions.queryMix(id);
    }
  }, [id]);

  if (!loading && mix?.items.length === 0) {
    return <NoResult />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {mix?.items && mix?.items?.length > 0 ? (
        <Box>
          {mix?.info && <Mix mix={mix?.info} />}
          <TypeResults type="tracks" data={mix.items} />
        </Box>
      ) : loading ? (
        <AlbumsLoader />
      ) : null}
    </Container>
  );
}
