import { useEffect, useRef, useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import { CircularProgress, Link, Paper } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { LogType } from "src/types";

import { DialogHandler } from ".";

export const DialogToken = () => {
  const { tokenMissing, actions } = useConfigProvider();
  const [output, setOutput] = useState<string>();
  const refOutput = useRef<null | HTMLPreElement>(null);
  let timeoutLog: NodeJS.Timeout;
  let intervalLog: NodeJS.Timeout;

  useEffect(() => {
    timeoutLog = setTimeout(() => {
      if (refOutput.current) {
        refOutput.current.scrollTop = refOutput.current?.scrollHeight;
      }
    }, 100);

    return () => {
      clearTimeout(timeoutLog);
    };
  }, [output]);

  useEffect(() => {
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
    }, 5000);

    return () => {
      clearInterval(intervalLog);
    };
  }, [tokenMissing]);

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
      <>
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
      </>
      <p>... or run this to create Tidal token :</p>
      <Paper elevation={0} sx={{ padding: "1rem" }}>
        <code>$ docker exec -it tidarr tiddl</code>
      </Paper>
    </DialogHandler>
  );
};
