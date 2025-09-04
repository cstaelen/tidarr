import { Chip, useTheme } from "@mui/material";
import { customColors } from "src/utils/theme";

export function ChipQuality({ quality }: { quality: string }) {
  const theme = useTheme();

  if (quality === "lossless") return;

  return (
    <Chip
      label={quality}
      color="primary"
      size="small"
      sx={{
        color:
          quality === "lossless"
            ? theme.palette.common.white
            : theme.palette.common.black,
        backgroundColor:
          quality === "lossless"
            ? customColors.gold
            : theme.palette.primary.main,
      }}
    />
  );
}
