import { TableRow, TableCell, Button, CircularProgress, Dialog, DialogActions, DialogTitle } from "@mui/material";
import Link from "next/link";
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import { useState } from "react";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TerminalIcon from '@mui/icons-material/Terminal';
import ClearIcon from '@mui/icons-material/Clear';
import styled from "@emotion/styled";
import { ProcessingItemType, useProcessingProvider } from "@/app/provider/ProcessingProvider";

export const ProcessingItem = ({
  item,
}: {
  item: ProcessingItemType;
}) => {
  const step = item?.status;
  const [openOutput, setOpenOutput] = useState(false);
  const { actions } = useProcessingProvider();

  if (!item?.status) return;

  function run() {
    actions.addItem(item, item.type);
  }

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell style={{ alignItems: "center", display: "flex", flex: '0 0 auto' }}>
        <TerminalButton onClick={() => actions.removeItem(item.id)}><ClearIcon /></TerminalButton>
        {step === 'finished' ? <CheckIcon color="success" /> : step === 'error' ? <WarningIcon color="error" /> : step === 'queue' ? <AccessTimeIcon /> : <CircularProgress size={20} />}

        {step === "error" ? <>
          &nbsp;&nbsp;
          <Button variant="outlined" size="small" onClick={() => run()}>
            Retry
          </Button>
        </> : null}
        &nbsp;&nbsp;

        {item.output && (
          <div>
            <TerminalButton onClick={() => setOpenOutput(true)}><TerminalIcon /></TerminalButton>
            <Dialog
              open={openOutput}
              onClose={() => setOpenOutput(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">Console output</DialogTitle>
              <Pre>{item.output}</Pre>
              <DialogActions>
                <Button onClick={() => setOpenOutput(false)}>
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        )}

        {step}

      </TableCell>
      <TableCell scope="row">
        <Link href={item.url} target="_blank" style={{ color: 'white' }}>{item.title}</Link>
      </TableCell>
      <TableCell scope="row">
        {item.artist}
      </TableCell>
      <TableCell scope="row">{item.type}</TableCell>
    </TableRow>
  )
};

const Pre = styled.pre`
  background-color: #000;
  font-size: 0.68rem;
  margin: 0;
  padding: 0.5rem;
  overflow: auto;
`;

const TerminalButton = styled(Button)`
  margin: 0 0.5rem 0 0;
  min-width: 0;
  padding: 0;
`;