import { ProcessingItemType, useSearchProvider } from "@/app/provider/SearchProvider";
import { TableRow, TableCell, Button, CircularProgress } from "@mui/material";
import Link from "next/link";
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import { useEffect, useState } from "react";
import { tidalDL, beets, moveSingleton } from "@/app/provider/server";
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export const ProcessingItem = ({ item, processing = false, markAsFinished }: { item: ProcessingItemType; processing: boolean; markAsFinished: Function }) => {
  const [step, setStep] = useState<string>('queue');

  const run = async (urlToSave: string) => {
    setStep("downloading");

    try {
      const response = await tidalDL(urlToSave);
      if (item.type !== "track") {
        const responsebeets = await beets();
        console.log(`Beets response :\r\n ${responsebeets}`)
        setStep("beet");
      } else {
        const responsetrack = await moveSingleton();
        console.log(`Beets response :\r\n ${responsetrack}`)
      }
      setStep("downloading");
    } catch (err: any) {
      setStep("error");
    } finally {
      setStep("finished");
      markAsFinished();
    }
  }

  useEffect(() => {
    if (processing && step !== "finished" && item.status !== 'finished') {
      run(item.url);
    }
  }, [processing])

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell component="th" scope="row">
        <Link href={item.url} target="_blank" style={{ color: 'white' }}>{item.title}</Link>
      </TableCell>
      <TableCell component="th" scope="row">
        {item.artist}
      </TableCell>
      <TableCell component="th" scope="row">{item.type}</TableCell>
      <TableCell style={{ alignItems: "center", display: "flex", justifyContent: "flex-end" }}>
        {step}
        {step === "error" ? <>
          &nbsp;&nbsp;
          <Button variant="outlined" size="small" onClick={() => run(item.url)}>
            Retry
          </Button>
        </> : null}
        &nbsp;&nbsp;
        {step === 'finished' ? <CheckIcon color="success" /> : step === 'error' ? <WarningIcon color="error" /> : step === 'queue' ? <AccessTimeIcon /> : <CircularProgress size={20} />}
      </TableCell>
    </TableRow>
  )
};