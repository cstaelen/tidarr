import { Box, Button } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";

export default function PagerButton({
  page,
  totalItems,
  itemPerPage = TIDAL_ITEMS_PER_PAGE,
  setPage,
}: {
  page: number;
  totalItems: number;
  itemPerPage?: number;
  setPage: (page: number) => void;
}) {
  if (page * itemPerPage > totalItems) return null;
  return (
    <Box sx={{ textAlign: "center", width: "100%", margin: "1rem" }}>
      <Button
        variant="contained"
        size="large"
        onClick={() => setPage(page + 1)}
      >
        LOAD MORE (page: {page}/{Math.ceil(totalItems / itemPerPage)})
      </Button>
    </Box>
  );
}
