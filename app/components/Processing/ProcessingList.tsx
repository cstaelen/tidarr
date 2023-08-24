import { Alert, Backdrop, Box, Paper, SpeedDial, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

import { useState } from "react";
import { ProcessingItem } from "./ProcessingItem";
import { useProcessingProvider } from "@/app/provider/ProcessingProvider";

export const ProcessingList = () => {
  const { processingList, currentProcessing } = useProcessingProvider();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (!processingList || processingList?.length === 0) return null;

  return (
    <SpeedDial
      ariaLabel="Show processing list"
      sx={{ position: 'fixed', bottom: 50, right: 16 }}
      color="success"
      icon={<strong>{processingList?.filter(item => item.status === 'finished')?.length}/{processingList?.length || 0}</strong>}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      <Backdrop
        onClick={handleClose}
        open={open}
      />

      <TableContainer
        component={Paper}
        sx={{
          width: {
            xs: "90vw",
            md: "700px"
          },
          opacity: open ? 1 : 0,
          position: "absolute",
          right: 0,
          visibility: open ? 'visible' : 'hidden'
        }}
      >
        <Box sx={{ width: "700px" }}>
          <Table size="small" aria-label="Processing table">
            <TableHead>
              <TableRow>
                <TableCell><strong>Processing list</strong></TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processingList?.map((item, index) =>
                <ProcessingItem
                  item={item}
                  key={`processing-index-${index}`}
                  processing={currentProcessing === index}
                />
              )}
            </TableBody>
          </Table>
          <Alert severity="warning">
            If you close this page, processing list will be paused.
          </Alert>
        </Box>
      </TableContainer>
    </SpeedDial >
  );
};
