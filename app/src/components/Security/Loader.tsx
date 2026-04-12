import { Box, CircularProgress } from "@mui/material";

export function Loader() {
  return (
    <Box
      translate="yes"
      sx={{
        position: "fixed",
        left: "50%",
        top: "50%",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
