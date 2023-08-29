import { TableRow, TableCell, Button, CircularProgress, Dialog, DialogActions, DialogTitle } from "@mui/material";
import Link from "next/link";
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import { useEffect, useState } from "react";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TerminalIcon from '@mui/icons-material/Terminal';
import ClearIcon from '@mui/icons-material/Clear';
import styled from "@emotion/styled";
import { ProcessingItemType, useProcessingProvider } from "@/app/provider/ProcessingProvider";
import { beets } from "@/app/server/beets";
import { tidalDL, moveSingleton } from "@/app/server/tidal-dl";

export const ProcessingItem = ({
  item,
  processing = false,
}: {
  item: ProcessingItemType;
  processing: boolean;
}) => {
  const [step, setStep] = useState<string>(item.status);
  const [output, setOutput] = useState<string>();
  const [openOutput, setOpenOutput] = useState(false);
  const { actions } = useProcessingProvider();

  const run = async (urlToSave: string) => {
    setStep("processing");

    try {
      const response = await tidalDL(urlToSave);
      let stdout = response?.output?.output;
      setOutput(`${output}\n${stdout?.[1]}`)
      if ((stdout?.[1] as string).includes('[SUCCESS]')) {
        if (item.type !== "track") {
          const responsebeets = await beets();
          setStep("beet");
          setOutput(`${stdout}\r\n${responsebeets?.output?.output}`)
          if ((responsebeets?.output?.stderr as string)?.includes('error')) {
            setStep("error");    
          }
        } else {
          const responsetrack = await moveSingleton();
          setOutput(`${stdout}\r\n${responsetrack?.output} `)
        }
      } else {
        setStep("error");
      }
    } catch (err: any) {
      setStep("error");
      setOutput(`${output}\r\nError : ${err.toString()}`)
    } finally {
      setStep("finished");
      actions.updateItemStatus(item.id, 'finished');
    }
  }

  useEffect(() => {
    if (processing && step !== "finished" && item.status !== 'finished') {
      run(item.url);
    }
    if (processing && item.status === "finished") actions.updateItemStatus(item.id, 'finished');;
  }, [processing])

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell style={{ alignItems: "center", display: "flex", flex: '0 0 auto' }}>
        {step !== 'processing' && step !== 'beet' && <TerminalButton onClick={() => actions.removeItem(item.id)}><ClearIcon /></TerminalButton>}
        {step === 'finished' ? <CheckIcon color="success" /> : step === 'error' ? <WarningIcon color="error" /> : step === 'queue' ? <AccessTimeIcon /> : <CircularProgress size={20} />}

        {step === "error" ? <>
          &nbsp;&nbsp;
          <Button variant="outlined" size="small" onClick={() => run(item.url)}>
            Retry
          </Button>
        </> : null}
        &nbsp;&nbsp;

        {output && (
          <div>
            <TerminalButton onClick={() => setOpenOutput(true)}><TerminalIcon /></TerminalButton>
            <Dialog
              open={openOutput}
              onClose={() => setOpenOutput(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">Console output</DialogTitle>
              <Pre>{output}</Pre>
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