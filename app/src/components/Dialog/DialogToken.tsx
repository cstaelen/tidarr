import React from "react";
import WarningIcon from "@mui/icons-material/Warning";
import { Paper } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

export const DialogToken = () => {
  const { tokenMissing } = useConfigProvider();

  if (!tokenMissing) return null;

  return (
    <DialogHandler
      title={
        <>
          <WarningIcon color="error" />
          &nbsp;
          {"Tidal token not found !"}
        </>
      }
    >
      <p>Run this to create Tidal token :</p>
      <Paper elevation={0} sx={{ padding: "1rem" }}>
        <code>$ docker exec -it tidarr tiddl</code>
      </Paper>
    </DialogHandler>
  );
};
