import { Paper } from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import { DialogHandler } from ".";
import { getApiUrl } from "@/app/server/queryApi";
import { useProcessingProvider } from "@/app/provider/ProcessingProvider";

export const DialogNoAPI = () => {
  const { apiError } = useProcessingProvider();

  if (!apiError?.error) return;

  return (
    <DialogHandler
      title={
        <>
          <WarningIcon color="error" />&nbsp;
          {"Tidarr API is not reachable"}
        </>
      }
    >
      <p>Connection tentative to Tidarr API, failed.<br />Please check your logs</p>
      <Paper elevation={0} sx={{ padding: '1rem' }}>
        <code>
          $ docker-compose tidarr logs
        </code>
      </Paper>
      {apiError.message && (
        <>
          <p>Error message:</p>
          <Paper elevation={0} sx={{ padding: '1rem' }}>
            <code>{apiError.message}</code>
          </Paper>
        </>
      )}
    </DialogHandler>
  )
};