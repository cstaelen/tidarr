import WarningIcon from "@mui/icons-material/Warning";
import { Paper } from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";

import { DialogHandler } from ".";

export const DialogNoAPI = () => {
  const {
    error: { apiError, setApiError },
  } = useApiFetcher();

  return (
    <DialogHandler
      open={!!apiError?.statusText}
      onClose={() => setApiError(undefined)}
      title={"Tidarr API is not reachable"}
      icon={<WarningIcon color="error" />}
    >
      <p>
        Connection tentative to Tidarr API, failed.
        <br />
        Please check your logs
      </p>
      <Paper elevation={0} sx={{ padding: "1rem" }}>
        <code>$ docker-compose tidarr logs</code>
      </Paper>
      {apiError?.statusText && (
        <>
          <p>Error message:</p>
          <Paper elevation={0} sx={{ padding: "1rem" }}>
            <code>{apiError.statusText}</code>
          </Paper>
        </>
      )}
    </DialogHandler>
  );
};
