import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

import { DialogAtmosToken } from "../Dialog/DialogAtmosToken";
import { ModuleTitle } from "../TidalModule/Title";

import TiddlConfigEdit from "./tidal/TiddlConfigEdit";
import TiddlConfigList from "./tidal/TiddlConfigList";

export default function TidalPanel() {
  const { noAtmosToken, requiresPkceAuth, tokenMissing } = useConfigProvider();
  const [showEditor, setShowEditor] = useState<boolean>();
  const [showAtmosLogin, setShowAtmosLogin] = useState(false);
  const [historyFlushed, setHistoryFlushed] = useState<boolean>();
  const navigate = useNavigate();

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
      <ModuleTitle title="Tiddl configuration" />
      {tokenMissing && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            my: 4,
          }}
        >
          <Alert
            color="warning"
            icon={<Warning sx={{ fontSize: 20 }} />}
            variant="outlined"
          >
            No Tidal token found !
          </Alert>
        </Box>
      )}
      {requiresPkceAuth && (
        <Alert color="warning" variant="outlined" sx={{ mb: 3 }}>
          This legacy TIDAL token cannot reliably request stereo or MAX streams.
          Re-authenticate from the home page using the Hi-Res login.
        </Alert>
      )}
      {!tokenMissing && !requiresPkceAuth && noAtmosToken && (
        <Alert
          color="warning"
          variant="outlined"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" onClick={() => setShowAtmosLogin(true)}>
              Authenticate Atmos
            </Button>
          }
        >
          MAX stereo is ready. Dolby Atmos needs one additional TIDAL device
          login before “Atmos only” or “Atmos allowed” can select Atmos streams.
        </Alert>
      )}
      <Box
        component="span"
        sx={{
          flex: "0 0 auto",
          display: "flex",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
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
              navigate("/");
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
              navigate("/");
              window.location.reload();
            }}
          >
            Empty history
          </Button>
        )}
      </Box>
      {showEditor ? <TiddlConfigEdit /> : <TiddlConfigList />}
      <DialogAtmosToken
        open={showAtmosLogin}
        onClose={() => setShowAtmosLogin(false)}
        onAuthenticated={checkAPI}
      />
    </>
  );
}
