import { AutoAwesome } from "@mui/icons-material";
import { Chip, Tooltip } from "@mui/material";

export function ChipAI({ isAI }: { isAI: boolean | undefined }) {
  if (!isAI) return;

  return (
    <Tooltip title="AI Generated content">
      <Chip
        label={
          <>
            AI
            <AutoAwesome scale="1" sx={{ fontSize: "16px" }} />
          </>
        }
        color="default"
        size="small"
        sx={{ "& > span": { alignItems: "center", display: "flex", gap: 0.5 } }}
      />
    </Tooltip>
  );
}
