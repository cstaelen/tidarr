import React from "react";
import WarningIcon from "@mui/icons-material/Warning";
import { Paper } from "@mui/material";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

import { DialogHandler } from ".";

export const DialogNoAPI = () => {
  const { apiError } = useProcessingProvider();

  if (!apiError?.error) return null;

  return (
    <DialogHandler
      title={
        <>
          <WarningIcon color="error" />
          &nbsp;
          {"Tidarr API is not reachable"}
        </>
      }
    >
      <p>
        Connection tentative to Tidarr API, failed.
        <br />
        Please check your logs
      </p>
      <Paper elevation={0} sx={{ padding: "1rem" }}>
        <code>$ docker-compose tidarr logs</code>
      </Paper>
      {apiError.message && (
        <>
          <p>Error message:</p>
          <Paper elevation={0} sx={{ padding: "1rem" }}>
            <code>{apiError.message}</code>
          </Paper>
        </>
      )}
    </DialogHandler>
  );
};
