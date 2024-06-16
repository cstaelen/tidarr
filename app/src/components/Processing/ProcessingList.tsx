import React, { useState } from "react";
import {
  Backdrop,
  Box,
  CircularProgress,
  Paper,
  SpeedDial,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { blue } from "@mui/material/colors";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

import { ProcessingItem } from "./ProcessingItem";

export const ProcessingList = () => {
  const { processingList } = useProcessingProvider();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (!processingList || processingList?.length === 0) return null;

  const isLoading =
    processingList?.filter((item) => item?.loading === true)?.length > 0;
  const hasError =
    processingList?.filter((item) => item?.error === true)?.length > 0;

  const buttonColor = hasError ? "error" : !isLoading ? "success" : "primary";

  const ProcessingButton = () => (
    <>
      {isLoading && (
        <CircularProgress
          size={68}
          sx={{
            color: blue[500],
            position: "absolute",
            top: -6,
            left: -6,
            zIndex: 1,
          }}
        />
      )}
      <strong>
        {processingList?.filter((item) => item?.status === "finished")?.length}/
        {processingList?.length || 0}
      </strong>
    </>
  );

  return (
    <SpeedDial
      ariaLabel="Show processing list"
      sx={{ position: "fixed", bottom: 50, right: 16, zIndex: "2000" }}
      icon={<ProcessingButton />}
      FabProps={{
        color: buttonColor,
      }}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      <Backdrop onClick={handleClose} open={open} />

      <TableContainer
        component={Paper}
        sx={{
          width: {
            xs: "90vw",
            md: "700px",
          },
          opacity: open ? 1 : 0,
          position: "absolute",
          right: 0,
          visibility: open ? "visible" : "hidden",
        }}
      >
        <Box sx={{ width: "700px" }}>
          <Table size="small" aria-label="Processing table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Processing list</strong>
                </TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processingList?.map((item, index) => (
                <ProcessingItem item={item} key={`processing-index-${index}`} />
              ))}
            </TableBody>
          </Table>
        </Box>
      </TableContainer>
    </SpeedDial>
  );
};
