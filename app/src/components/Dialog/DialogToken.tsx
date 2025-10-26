import { useEffect, useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import { CircularProgress, Link, Paper, Typography } from "@mui/material";
import { EventSourceController } from "event-source-plus";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

export const DialogToken = () => {
  const { tokenMissing } = useConfigProvider();
  const {
    actions: { get_token_sse },
  } = useApiFetcher();
  const [output, setOutput] = useState<string>();
  const [error, setError] = useState<boolean>(false);
  const [forceClose, setForceClose] = useState<boolean>(false);
  const [sseController, setSseController] = useState<AbortController>();

  useEffect(() => {
    function runTokenSSE(controller: EventSourceController) {
      setOutput("");
      setSseController(controller);
    }

    if (!tokenMissing || error) return;

    const { controller } = get_token_sse(setOutput);
    runTokenSSE(controller);
  }, [error, get_token_sse, tokenMissing]);

  useEffect(() => {
    function closeSSE(isError?: boolean, message?: string) {
      if (message) setOutput(message);
      if (isError) setError(true);
      return;
    }

    if (!tokenMissing) return;

    if (output?.includes("Authenticated!")) {
      closeSSE(false, "Authenticated !");
      window.location.reload();
    }
    if (output?.includes("AuthError")) {
      closeSSE(true);
    }
  }, [output, sseController, tokenMissing]);

  useEffect(() => {
    if ((tokenMissing || !!sseController) && !error) return;
    setTimeout(() => {
      console.log("Closing token SSE.");
      setSseController(undefined);
      sseController?.abort();
    });
  }, [sseController, tokenMissing, error]);

  return (
    <DialogHandler
      title={"Tidal token not found !"}
      icon={<WarningIcon color="error" />}
      onClose={() => {
        setForceClose(true);
        sseController?.abort();
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
        {sseController && <CircularProgress size={16} sx={{ mx: 2 }} />}
      </Paper>
      <Typography fontStyle="italic" fontSize={14} py={1}>
        This dialog will close after authentication.
      </Typography>
      <p>
        ... or create Tidal token using CLI :{" "}
        <Link
          href="https://github.com/cstaelen/tidarr?tab=readme-ov-file#tidal-authentication"
          target="_blank"
        >
          Github
        </Link>
      </p>
    </DialogHandler>
  );
};
