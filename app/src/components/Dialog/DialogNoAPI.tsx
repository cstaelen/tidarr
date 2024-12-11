import WarningIcon from "@mui/icons-material/Warning";
import { Paper } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

export const DialogNoAPI = () => {
  const {
    apiError,
    actions: { setApiError },
  } = useConfigProvider();

  if (!apiError?.error) return null;

  return (
    <DialogHandler
      onClose={() => setApiError(undefined)}
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
