import { ReactElement } from "react";
import { Stack, Typography } from "@mui/material";

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
        alignItems="center"
        sx={{ borderBottom: "1px solid white", mb: 1 }}
      >
        <Typography variant="h2" sx={{ flex: "1 1 0", my: 3 }}>
          {title.toLowerCase() === "featured albums" ? "Albums" : title}{" "}
          {total ? `(${total})` : ""}
        </Typography>
        {rightBlock}
      </Stack>
      <br />
    </div>
  );
}
