import { Alert, Backdrop, CircularProgress, Paper, SpeedDial, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import { useTidalProvider } from "../provider/TidalProvider";
import { useState } from "react";
import Link from "next/link";
import styled from "@emotion/styled";

export const ProcessingList = () => {
  const { processingList } = useTidalProvider();
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (!processingList || processingList?.length === 0) return null;

  return (
    <SpeedDial
      ariaLabel="Show processing list"
      sx={{ position: 'fixed', bottom: 50, right: 16 }}
      color="success"
      icon={<strong>{processingList?.filter(item => item.loading).length || 0}/{processingList?.length || 0}</strong>}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      <Backdrop
        onClick={handleClose}
        open={open}
      />

      {open ? (
        <>
          <TableContainer
            component={Paper}
            sx={{
              width: {
                xs: "90vw",
                md: "700px"
              },
              position: "absolute",
              right: 0
            }}
          >
            <Table size="small" aria-label="Processing table">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Download in progress ...</strong></TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processingList?.map((item, index) => (
                  <TableRow
                    key={`processing-index-${index}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Link href={item.url} target="_blank" style={{ color: 'white' }}>{item.title}</Link>
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {item.artist}
                    </TableCell>
                    <TableCell component="th" scope="row">{item.type}</TableCell>
                    <TableCell align="right">{item.loading ? "Loading..." : item.error ? "Error" : "Finished"}</TableCell>
                    <TableCell align="right">{item.loading ? <CircularProgress size={20} /> : item.error ? <WarningIcon color="error" /> : <CheckIcon color="success" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Alert severity="warning">
            If you close this page, downloads should keep processing, but status informations will be lost.
              
            </Alert>
          </TableContainer>
        </>
      ) : null
      }
    </SpeedDial >
  );
};
