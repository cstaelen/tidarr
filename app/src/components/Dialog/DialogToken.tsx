import { useEffect, useRef, useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import { CircularProgress, Link, Paper, Typography } from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

export const DialogToken = () => {
  const { tokenMissing, actions } = useConfigProvider();
  const {
    actions: { get_token_sse },
  } = useApiFetcher();
  const [output, setOutput] = useState<string>();
  const [running, setRunning] = useState<boolean>(false);
  const [forceClose, setForceClose] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource>(null);

  useEffect(() => {
    if (!tokenMissing) return;
    const eventSource = get_token_sse(setOutput);

    return () => {
      eventSource?.close();
    };
  }, [get_token_sse, running, tokenMissing]);

  useEffect(() => {
    if (!tokenMissing) return;
    if (output?.includes("Authenticated!")) {
      setRunning(false);
      actions.checkAPI();
    }
  }, [actions, output, tokenMissing]);

  return (
    <DialogHandler
      title={"Tidal token not found !"}
      icon={<WarningIcon color="error" />}
      onClose={() => {
        setForceClose(true);
        eventSourceRef.current?.close();
      }}
      open={!!tokenMissing && !forceClose}
    >
      <p>Click on the link below to authenticate:</p>
      <Paper
        elevation={0}
        sx={{
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          lineHeight: "1",
        }}
      >
        <Link href={output} target="_blank">
          {output}
        </Link>
        <CircularProgress size={16} sx={{ mx: 2 }} />
      </Paper>
      <Typography fontStyle="italic" fontSize={14} py={1}>
        This dialog will close after authentication.
      </Typography>
      <p>... or run this to create Tidal token :</p>
      <Paper elevation={0} sx={{ padding: "1rem" }}>
        <code>$ docker exec -it tidarr tiddl auth</code>
      </Paper>
    </DialogHandler>
  );
};
