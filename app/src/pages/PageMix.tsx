import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import Module from "src/components/TidalModule/Module";
import NoResult from "src/components/TidalModule/NoResults";
import { useMix } from "src/hooks/useMix";
import { useSearchProvider } from "src/provider/SearchProvider";

import Mix from "../components/Headers/Mix";

export default function PageMix() {
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
      <Box>
        {mix?.info && <Mix mix={mix?.info} />}
        <Module type="TRACK_LIST" data={mix?.items} loading={loading} />
      </Box>
    </Container>
  );
}
