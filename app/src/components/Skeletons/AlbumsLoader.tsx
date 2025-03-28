import React from "react";
import { Grid, Skeleton } from "@mui/material";

export const AlbumsLoader = () => {
  return (
    <Grid container rowGap={2} data-testid="loader">
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Skeleton
          variant="rectangular"
          width={360}
          height={180}
          animation="wave"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Skeleton
          variant="rectangular"
          width={360}
          height={180}
          animation="wave"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Skeleton
          variant="rectangular"
          width={360}
          height={180}
          animation="wave"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Skeleton
          variant="rectangular"
          width={360}
          height={180}
          animation="wave"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Skeleton
          variant="rectangular"
          width={360}
          height={180}
          animation="wave"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Skeleton
          variant="rectangular"
          width={360}
          height={180}
          animation="wave"
        />
      </Grid>
    </Grid>
  );
};
