import { Grid, Skeleton } from "@mui/material";

export const AlbumsLoader = () => {
  return (
    <Grid container rowGap={2} data-testid="loader">
      {Array.from({ length: 6 }, (_, index) => index).map((index) => (
        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={`loader-${index}`}>
          <Skeleton
            variant="rectangular"
            width={360}
            height={180}
            animation="wave"
            sx={{ maxWidth: "100%" }}
          />
        </Grid>
      ))}
    </Grid>
  );
};
