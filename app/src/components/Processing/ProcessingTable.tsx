import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ProcessingItem } from "src/components/Processing/ProcessingItem";
import { ProcessingItemType } from "src/types";

const PAGE_SIZE = 50;

type Props = {
  items: ProcessingItemType[];
  ariaLabel: string;
  emptyMessage?: string;
};

export function ProcessingTable({ items, ariaLabel, emptyMessage }: Props) {
  const [extraPages, setExtraPages] = useState(0);
  const [lastLength, setLastLength] = useState(items.length);

  if (items.length !== lastLength) {
    setLastLength(items.length);
    setExtraPages(0);
  }

  const visibleCount = PAGE_SIZE + extraPages * PAGE_SIZE;

  const visibleItems = items.slice(0, visibleCount);
  const remaining = items.length - visibleCount;

  return (
    <Paper>
      <TableContainer>
        <Table aria-label={ariaLabel} size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Quality</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && emptyMessage ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      py: 2,
                    }}
                  >
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibleItems.map((item, index) => (
                <ProcessingItem item={item} key={`${ariaLabel}-${index}`} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {remaining > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => setExtraPages((n) => n + 1)}
          >
            Show more ({remaining} remaining)
          </Button>
        </Box>
      )}
    </Paper>
  );
}
