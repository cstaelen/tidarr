import { useEffect, useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import { CircularProgress, Link, Paper } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { LogType } from "src/types";

import { DialogHandler } from ".";

export const DialogToken = () => {
  const { tokenMissing, actions } = useConfigProvider();
  const [output, setOutput] = useState<string>();
  const [forceClose, setForceClose] = useState<boolean>(false);

  let intervalLog: NodeJS.Timeout;

  useEffect(() => {
    setForceClose(false);

    async function queryLogs() {
      const response = await actions.getTidalTokenLogs();
      if (response?.link) setOutput((response as LogType)?.link);
      if ((response as LogType)?.output?.includes("authenticated!")) {
        actions.checkAPI();
      }
    }

    if (!tokenMissing) {
      clearInterval(intervalLog);
      return;
    }

    actions.getTidalToken();

    intervalLog = setInterval(() => {
      queryLogs();
    }, 3000);

    return () => {
      clearInterval(intervalLog);
    };
  }, [tokenMissing]);

  return (
    <DialogHandler
      title={"Tidal token not found !"}
      icon={<WarningIcon color="error" />}
      onClose={() => setForceClose(true)}
      open={!!tokenMissing && !forceClose}
    >
      <p>Click on the link below to authenticate :</p>
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
      <p>... or run this to create Tidal token :</p>
      <Paper elevation={0} sx={{ padding: "1rem" }}>
        <code>$ docker exec -it tidarr tiddl</code>
      </Paper>
    </DialogHandler>
  );
};
