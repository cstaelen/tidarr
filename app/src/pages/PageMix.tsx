import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import ModuleLoader from "src/components/Skeletons/ModuleLoader";
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
    <Container maxWidth="lg">
      {loading && <ModuleLoader />}
      <Box>
        {mix?.info && <Mix mix={mix?.info} total={mix?.totalNumberOfItems} />}
        <Module type="TRACK_LIST" data={mix?.items} />
      </Box>
    </Container>
  );
}
