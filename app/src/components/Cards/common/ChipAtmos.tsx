import { Chip, Tooltip } from "@mui/material";

export function ChipAtmos({ audioModes }: { audioModes?: string[] }) {
  if (!audioModes?.includes("DOLBY_ATMOS")) return null;

  return (
    <Tooltip title="Dolby Atmos available">
      <Chip label="Atmos" size="small" color="secondary" variant="outlined" />
    </Tooltip>
  );
}
