import React from "react";
import { Box, Button } from "@mui/material";

import { TIDAL_ITEMS_PER_PAGE } from "src/contants";

export default function Pager({
  page,
  totalItems,
  setPage,
}: {
  page: number;
  totalItems: number;
  setPage: (page: number) => void;
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
