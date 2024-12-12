import { useEffect, useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
} from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { LogType } from "src/types";

export const DialogToken = () => {
  const { tokenMissing, actions } = useConfigProvider();
  const [output, setOutput] = useState<string>();

  let intervalLog: NodeJS.Timeout;

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
    }, 3000);

    return () => {
      clearInterval(intervalLog);
    };
  }, [tokenMissing]);

  return (
    <Dialog open={!!tokenMissing}>
      <DialogTitle>
        <WarningIcon color="error" />
        &nbsp;
        {"Tidal token not found !"}
      </DialogTitle>
      <DialogContent>
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
      </DialogContent>
    </Dialog>
  );
};
