import { Paper } from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import { DialogHandler } from ".";
import { useEffect } from "react";

export const DialogNoAPI = () => {
  if (!window?._env_?.NEXT_PUBLIC_TIDARR_API_URL) return;

  return (
    <DialogHandler 
      title={
        <>
          <WarningIcon color="error" />&nbsp;
          {"Tidarr API is not reachable"}
        </>
      }
    >
      <p>Connection tentative to Tidarr API ({window?._env_?.NEXT_PUBLIC_TIDARR_API_URL}) failed.<br />Please check your logs</p>
      <Paper elevation={0} sx={{ padding: '1rem' }}>
        <code>
          $ docker-compose tidarr logs
        </code>
      </Paper>
    </DialogHandler>
  )
};