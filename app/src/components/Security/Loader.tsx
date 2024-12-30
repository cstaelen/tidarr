import { Box, CircularProgress } from "@mui/material";

export function Loader() {
  return (
    <Box position="fixed" left="50%" top="50%" translate="yes">
      <CircularProgress />
    </Box>
  );
}
