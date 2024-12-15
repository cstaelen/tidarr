import { ReactNode } from "react";
import {
  Box,
  Breakpoint,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

export const DialogHandler = ({
  children,
  title,
  open,
  icon,
  maxWidth = "xl",
  onClose,
}: {
  children: ReactNode;
  title: ReactNode;
  icon: ReactNode;
  open: boolean;
  maxWidth?: Breakpoint;
  onClose?: () => void;
}) => {
  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth={maxWidth}
    >
      <DialogTitle
        id="alert-dialog-title"
        style={{ display: "flex", alignItems: "center", borderColor: "white" }}
      >
        {icon && <Box sx={{ mr: 1, lineHeight: 1 }}>{icon}</Box>}
        <Typography>{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" component="div">
          {children}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
