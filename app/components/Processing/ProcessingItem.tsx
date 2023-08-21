import { ProcessingItemType } from "@/app/provider/SearchProvider";
import { TableRow, TableCell, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import Link from "next/link";
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import { useEffect, useState } from "react";
import { tidalDL, beets, moveSingleton } from "@/app/provider/server";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TerminalIcon from '@mui/icons-material/Terminal';
import styled from "@emotion/styled";

export const ProcessingItem = ({ item, processing = false, markAsFinished }: { item: ProcessingItemType; processing: boolean; markAsFinished: Function }) => {
  const [step, setStep] = useState<string>('queue');
  const [output, setOutput] = useState<string>();
  const [openOutput, setOpenOutput] = useState(false);

  const run = async (urlToSave: string) => {
    setStep("processing");

    try {
      const response = await tidalDL(urlToSave);
      let stdout = response?.output?.output;
      setOutput(`${output}\n${response?.output?.output?.[1]}`)
      if (item.type !== "track") {
        const responsebeets = await beets();
        setStep("beet");
        setOutput(`${stdout}\r\n${responsebeets?.output?.output}`)
      } else {
        const responsetrack = await moveSingleton();
        setOutput(`${stdout}\r\n${responsetrack?.output} `)
      }
      setStep("downloading");
    } catch (err: any) {
      setStep("error");
      setOutput(`${output}\r\nError : ${err.toString()}`)
    } finally {
      setStep("finished");
      markAsFinished();
    }
  }

  useEffect(() => {
    window.onbeforeunload = function (event: BeforeUnloadEvent) {
      var message = 'If you confirm leaving, download progress informations will be lost. But downloads should continue.';

      event = event || window.event;
      event.preventDefault();
      event.cancelBubble = true;
      event.returnValue = message;
    }
  }, []);


  useEffect(() => {
    if (processing && step !== "finished" && item.status !== 'finished') {
      run(item.url);
    }
  }, [processing])

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell scope="row">
        <Link href={item.url} target="_blank" style={{ color: 'white' }}>{item.title}</Link>
      </TableCell>
      <TableCell scope="row">
        {item.artist}
      </TableCell>
      <TableCell scope="row">{item.type}</TableCell>
      <TableCell style={{ alignItems: "center", display: "flex", justifyContent: "flex-end" }}>
        {step}

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

        {step === 'finished' ? <CheckIcon color="success" /> : step === 'error' ? <WarningIcon color="error" /> : step === 'queue' ? <AccessTimeIcon /> : <CircularProgress size={20} />}
      </TableCell>
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
  margin: 0 0.5rem;
  min-width: 0;
  padding: 0;
`;