import { Alert, Backdrop, Paper, SpeedDial, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

import { useState } from "react";
import { ProcessingItemType, useSearchProvider } from "../../provider/SearchProvider";
import { ProcessingItem } from "./ProcessingItem";

export const ProcessingList = () => {
  const { processingList, actions } = useSearchProvider();
  const [open, setOpen] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState(0);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (!processingList || processingList?.length === 0) return null;

  return (
    <SpeedDial
      ariaLabel="Show processing list"
      sx={{ position: 'fixed', bottom: 50, right: 16 }}
      color="success"
      icon={<strong>{currentProcessing}/{processingList?.length || 0}</strong>}
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
        <Table size="small" aria-label="Processing table">
          <TableHead>
            <TableRow>
              <TableCell><strong>Download in progress ...</strong></TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processingList?.map((item, index) =>
              <ProcessingItem
                item={item}
                key={`processing-index-${index}`}
                processing={currentProcessing === index}
                markAsFinished={() => setCurrentProcessing(currentProcessing + 1)}
              />
            )}
          </TableBody>
        </Table>
        <Alert severity="warning">
          If you close this page, downloads should keep processing, but status informations will be lost.
        </Alert>
      </TableContainer>
    </SpeedDial >
  );
};
