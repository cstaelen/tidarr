import { Paper } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { DialogHandler } from ".";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

export const DialogToken = () => {
  const { tokenMissing } = useProcessingProvider();

  if (!tokenMissing) return null;

  return (
    <DialogHandler
      title={
        <>
          <WarningIcon color="error" />
          &nbsp;
          {"Tidal token not found !"}
        </>
      }
    >
      <p>Run this to create Tidal token :</p>
      <Paper elevation={0} sx={{ padding: "1rem" }}>
        <code>$ docker exec -it tidarr tidal-dl</code>
      </Paper>
    </DialogHandler>
  );
};
