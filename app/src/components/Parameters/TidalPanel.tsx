import { KeyOff, Warning } from "@mui/icons-material";
import { Alert, Box, Button } from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";

import TableParameters from "./TableParameters";

export default function TidalPanel() {
  const { tokenMissing, tiddlConfig, actions } = useConfigProvider();

  const {
    actions: { checkAPI },
  } = useConfigProvider();
  const {
    actions: { delete_token },
  } = useApiFetcher();

  return (
    <>
      <Box display="flex" justifyContent="center" my={4}>
        {!tokenMissing ? (
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
        ) : (
          <Alert
            color="warning"
            icon={<Warning sx={{ fontSize: 20 }} />}
            variant="outlined"
          >
            No Tidal token found !
          </Alert>
        )}
      </Box>
      <Box>
        <h3>Tiddl template options</h3>
        {tiddlConfig?.template ? (
          <TableParameters rows={Object.entries(tiddlConfig.template)} />
        ) : (
          "Not found."
        )}
        <h3>Tiddl download options</h3>
        {tiddlConfig?.download ? (
          <TableParameters rows={Object.entries(tiddlConfig.download)} />
        ) : (
          "Not found."
        )}
        <h3>Tiddl cover options</h3>
        {tiddlConfig?.cover ? (
          <TableParameters rows={Object.entries(tiddlConfig.cover)} />
        ) : (
          "Not found."
        )}
      </Box>
    </>
  );
}
