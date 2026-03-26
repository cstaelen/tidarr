import {
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

type Props = {
  items: ProcessingItemType[];
  ariaLabel: string;
  emptyMessage?: string;
};

export function ProcessingTable({ items, ariaLabel, emptyMessage }: Props) {
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
                  <Typography variant="body2" color="text.secondary" py={2}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <ProcessingItem item={item} key={`${ariaLabel}-${index}`} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
