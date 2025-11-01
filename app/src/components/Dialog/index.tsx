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
} from "@mui/material";

export const DialogHandler = ({
  children,
  title,
  open,
  icon,
  maxWidth = "xl",
  buttons,
  onClose,
}: {
  children: ReactNode;
  title: ReactNode;
  icon: ReactNode;
  open: boolean;
  maxWidth?: Breakpoint;
  buttons?: ReactNode;
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
        style={{
          display: "flex",
          alignItems: "center",
          borderColor: "white",
        }}
      >
        {icon && (
          <Box display="flex" mr={1}>
            {icon}
          </Box>
        )}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" component="div">
          {children}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose}>
          Close
        </Button>
        {buttons}
      </DialogActions>
    </Dialog>
  );
};
