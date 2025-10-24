import { useEffect } from "react";
import { Clear } from "@mui/icons-material";
import {
  Button,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useSync } from "src/provider/SyncProvider";

export default function SyncPanel() {
  const { isConfigModalOpen } = useConfigProvider();

  const {
    syncList,
    actions: { removeSyncItem, getSyncList },
  } = useSync();

  useEffect(() => {
    if (isConfigModalOpen) {
      getSyncList();
    }
  }, [getSyncList, isConfigModalOpen]);

  return (
    <>
      {syncList?.length > 0 ? (
        <TableContainer component={Paper}>
          <Table
            sx={{ minWidth: 650 }}
            aria-label="synced playlist table"
            size="small"
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Title</strong>
                </TableCell>
                <TableCell>
                  <strong>Type</strong>
                </TableCell>
                <TableCell>
                  <strong>Quality</strong>
                </TableCell>
                <TableCell>
                  <strong>Last run</strong>
                </TableCell>
                <TableCell align="center">Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {syncList.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell>
                    <Link href={`/${row.type}/${row.id}`}>{row?.title}</Link>
                  </TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.quality}</TableCell>
                  <TableCell>
                    {row.lastUpdate && (
                      <>
                        {new Date(row.lastUpdate).toDateString()}
                        {` - `}
                        {new Date(row.lastUpdate)
                          .getHours()
                          .toString()
                          .padStart(2, "0")}
                        :
                        {new Date(row.lastUpdate)
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}
                      </>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Remove from sync list">
                      <Button
                        onClick={() => removeSyncItem(row.id)}
                        size="small"
                        variant="text"
                        sx={{ minWidth: 0 }}
                      >
                        <Clear />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{ textAlign: "center", py: 4 }}>
          No synced content
        </Typography>
      )}
    </>
  );
}
