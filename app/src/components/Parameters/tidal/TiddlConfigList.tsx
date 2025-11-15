import { Box, Paper } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

import TableParameters from "../common/TableParameters";

export default function TiddlConfigList() {
  const { tiddlConfig } = useConfigProvider();

  return (
    <Box>
      All parameters are defined with explanations in:
      <br />
      <Paper sx={{ my: 1, p: 1, overflow: "auto" }}>
        <pre style={{ margin: 0, fontSize: 14 }}>
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
  );
}
