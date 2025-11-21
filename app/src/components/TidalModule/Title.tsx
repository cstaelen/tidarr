import { ReactElement } from "react";
import { Box, Stack, Typography } from "@mui/material";

export function ModuleTitle({
  title,
  total,
  rightBlock,
}: {
  title: string;
  total?: number;
  rightBlock?: ReactElement;
}) {
  if (!title) return <br />;
  return (
    <div className="module-title">
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        py={2}
        gap={2}
        sx={{ borderBottom: "1px solid white" }}
      >
        <Typography variant="h2" sx={{ flex: "1 1 0" }}>
          {title.toLowerCase() === "featured albums" ? "Albums" : title}{" "}
          {total ? `(${total})` : ""}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {rightBlock}
        </Box>
      </Stack>
      <br />
    </div>
  );
}
