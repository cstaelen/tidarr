import { Paper } from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import { DialogHandler } from ".";
import { getApiUrl } from "@/app/server/queryApi";

export const DialogNoAPI = () => {

  const API_URL = async () => await getApiUrl();
  
  return (
    <DialogHandler 
      title={
        <>
          <WarningIcon color="error" />&nbsp;
          {"Tidarr API is not reachable"}
        </>
      }
    >
      <p>Connection tentative to Tidarr API ({API_URL()}) failed.<br />Please check your logs</p>
      <Paper elevation={0} sx={{ padding: '1rem' }}>
        <code>
          $ docker-compose tidarr logs
        </code>
      </Paper>
    </DialogHandler>
  )
};