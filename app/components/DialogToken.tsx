import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Paper } from "@mui/material";
import { useState } from "react";
import WarningIcon from '@mui/icons-material/Warning';

export const DialogToken = () => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title" style={{ display: "flex", alignItems: "center" }}>
        <WarningIcon color="error" />&nbsp;
        {"Tidal token not found !"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <p>Run this to create Tidal token :</p>
          <Paper elevation={0} sx={{ padding: '1rem' }}>
            <code>
              $ docker exec -i tidarr tidal-dl
            </code>
          </Paper>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
};