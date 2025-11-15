import { KeyOff, Warning } from "@mui/icons-material";
import { Alert, Box, Button, Paper } from "@mui/material";
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

  console.log(tiddlConfig);

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
        <h2>Tiddl configuration</h2>
        All parameters are defined with explanations in:
        <Paper sx={{ display: "inline-block", mx: 1, px: 1 }}>
          <pre style={{ margin: 0 }}>
            /path/to/tidarr/volume/config/.tiddl/config.toml
          </pre>
        </Paper>
        <h3>Template options</h3>
        {tiddlConfig?.templates ? (
          <TableParameters rows={Object.entries(tiddlConfig.templates)} />
        ) : (
          "Not found."
        )}
        <h3>Download options</h3>
        {tiddlConfig?.download ? (
          <TableParameters rows={Object.entries(tiddlConfig.download)} />
        ) : (
          "Not found."
        )}
        <h3>Cover options</h3>
        {tiddlConfig?.cover ? (
          <TableParameters rows={Object.entries(tiddlConfig.cover)} />
        ) : (
          "Not found."
        )}
        <h3>Metadata options</h3>
        {tiddlConfig?.metadata ? (
          <TableParameters rows={Object.entries(tiddlConfig.metadata)} />
        ) : (
          "Not found."
        )}
        <h3>M3U options</h3>
        {tiddlConfig?.m3u ? (
          <TableParameters rows={Object.entries(tiddlConfig.m3u)} />
        ) : (
          "Not found."
        )}
      </Box>
    </>
  );
}
