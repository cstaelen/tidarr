import { useState } from "react";
import {
  Cached,
  Check,
  EditDocument,
  KeyOff,
  Warning,
} from "@mui/icons-material";
import { Alert, Box, Button } from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useHistoryProvider } from "src/provider/HistoryProvider";

import TiddlConfigEdit from "./tidal/TiddlConfigEdit";
import TiddlConfigList from "./tidal/TiddlConfigList";

export default function TidalPanel() {
  const { tokenMissing, actions } = useConfigProvider();
  const [showEditor, setShowEditor] = useState<boolean>();
  const [historyFlushed, setHistoryFlushed] = useState<boolean>();

  const {
    config,
    actions: { checkAPI },
  } = useConfigProvider();

  const {
    actions: { delete_token },
  } = useApiFetcher();

  const {
    actions: { emptyHistory },
  } = useHistoryProvider();

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

      <Box component="h2">Tiddl configuration</Box>
      <Box
        flex="0 0 auto"
        component="span"
        display="flex"
        gap={2}
        mb={3}
        flexWrap="wrap"
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<EditDocument />}
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
        {config?.ENABLE_HISTORY && (
          <Button
            variant="contained"
            color="error"
            disabled={!!historyFlushed}
            startIcon={historyFlushed ? <Check /> : <Cached />}
            onClick={async () => {
              setHistoryFlushed(true);
              await emptyHistory();
              window.location.reload();
            }}
          >
            Empty history
          </Button>
        )}
      </Box>
      {showEditor ? <TiddlConfigEdit /> : <TiddlConfigList />}
    </>
  );
}
