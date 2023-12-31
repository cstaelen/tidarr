import { TIDAL_ITEMS_PER_PAGE } from "@/app/contants";
import { Box, Button } from "@mui/material";

export default function Pager({
  page,
  totalItems,
  setPage,
}: {
  page: number;
  totalItems: number;
  setPage: Function;
}) {
  if (page * TIDAL_ITEMS_PER_PAGE > totalItems) return null;
  return (
    <Box sx={{ textAlign: "center", width: "100%", margin: "1rem" }}>
      <Button
        variant="contained"
        size="large"
        onClick={() => setPage(page + 1)}
      >
        LOAD MORE (page: {page}/{Math.ceil(totalItems / TIDAL_ITEMS_PER_PAGE)})
      </Button>
    </Box>
  );
}
