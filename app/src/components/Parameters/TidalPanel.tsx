import { useState } from "react";
import { KeyOff, Warning } from "@mui/icons-material";
import { Alert, Box, Button } from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";

import TiddlConfigEdit from "./tidal/TiddlConfigEdit";
import TiddlConfigList from "./tidal/TiddlConfigList";

export default function TidalPanel() {
  const { tokenMissing, actions } = useConfigProvider();
  const [showEditor, setShowEditor] = useState<boolean>();

  const {
    actions: { checkAPI },
  } = useConfigProvider();
  const {
    actions: { delete_token },
  } = useApiFetcher();

  return (
    <>
      {tokenMissing && (
        <Box display="flex" justifyContent="center" my={4}>
          <Alert
            color="warning"
            icon={<Warning sx={{ fontSize: 20 }} />}
            variant="outlined"
          >
            No Tidal token found !
          </Alert>
        </Box>
      )}

      <Box component="h2" display="flex" flexWrap="wrap">
        <Box flex="1 1 0" component="span">
          Tiddl configuration
        </Box>
        <Box flex="0 0 auto" component="span" display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowEditor(!showEditor)}
          >
            Toggle editor
          </Button>
          {!tokenMissing && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<KeyOff />}
              onClick={async () => {
                actions.toggleModal(false);
                await delete_token();
                checkAPI();
              }}
            >
              Revoke Tidal token
            </Button>
          )}
        </Box>
      </Box>
      {showEditor ? <TiddlConfigEdit /> : <TiddlConfigList />}
    </>
  );
}
