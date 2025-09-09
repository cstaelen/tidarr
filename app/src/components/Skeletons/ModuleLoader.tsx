import { Box, Skeleton } from "@mui/material";

import { AlbumsLoader } from "./AlbumsLoader";

export default function ModuleLoader() {
  return (
    <Box>
      <Skeleton
        variant="rectangular"
        width={460}
        height={40}
        animation="wave"
        sx={{ my: 5, maxWidth: "100%" }}
      />
      <AlbumsLoader />
    </Box>
  );
}
