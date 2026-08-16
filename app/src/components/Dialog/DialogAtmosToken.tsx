import { useEffect, useRef, useState } from "react";
import SpatialAudioIcon from "@mui/icons-material/SpatialAudio";
import {
  Alert,
  CircularProgress,
  Link,
  Paper,
  Typography,
} from "@mui/material";
import { EventSourceController } from "event-source-plus";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";

import { DialogHandler } from ".";

export function DialogAtmosToken({
  open,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const {
    actions: { get_atmos_token_sse },
  } = useApiFetcher();
  const [loginUrl, setLoginUrl] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState(false);
  const started = useRef(false);
  const controller = useRef<EventSourceController>();

  useEffect(() => {
    if (!open || started.current) return;
    started.current = true;

    const stream = get_atmos_token_sse((output) => {
      const url = output.match(/https?:\/\/[^\s']+/)?.[0];
      if (url) setLoginUrl(url);

      if (output.includes("Authenticated!")) {
        setMessage("Atmos authentication complete.");
        onAuthenticated();
      } else if (output.includes("AuthError") || output.includes("closing")) {
        setError(true);
        setMessage("Atmos authentication failed. Close this dialog and retry.");
      }
    });
    controller.current = stream.controller;

    return () => stream.controller.abort();
  }, [get_atmos_token_sse, onAuthenticated, open]);

  const close = () => {
    controller.current?.abort();
    started.current = false;
    setLoginUrl(undefined);
    setMessage(undefined);
    setError(false);
    onClose();
  };

  return (
    <DialogHandler
      title="Authenticate Dolby Atmos"
      icon={<SpatialAudioIcon color="primary" />}
      open={open}
      onClose={close}
    >
      <Typography sx={{ mb: 2 }}>
        Atmos uses a separate TIDAL device profile. Open the link below and
        approve access with the same account used for Hi-Res authentication.
      </Typography>
      <Paper
        elevation={0}
        sx={{
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {loginUrl ? (
          <Link href={loginUrl} target="_blank" rel="noreferrer">
            {loginUrl}
          </Link>
        ) : (
          <>
            Preparing Atmos login…
            <CircularProgress size={16} sx={{ mx: 2 }} />
          </>
        )}
      </Paper>
      <Typography sx={{ fontStyle: "italic", fontSize: 14, py: 1 }}>
        This dialog updates automatically after TIDAL confirms the login.
      </Typography>
      {message && (
        <Alert severity={error ? "error" : "success"}>{message}</Alert>
      )}
    </DialogHandler>
  );
}
