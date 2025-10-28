import { useEffect } from "react";
import { SyncDisabled } from "@mui/icons-material";
import {
  Box,
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
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useSync } from "src/provider/SyncProvider";

export default function WatchList() {
  const { isConfigModalOpen } = useConfigProvider();

  const {
    syncList,
    actions: { getSyncList, removeSyncItem },
  } = useSync();

  useEffect(() => {
    if (isConfigModalOpen) {
      getSyncList();
    }
  }, [getSyncList, isConfigModalOpen]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <ModuleTitle title={`Watch list`} total={syncList?.length || 0} />

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
                    {row.type.includes("favorite_") ? (
                      <>{row?.title}</>
                    ) : (
                      <Link href={`/${row.type}/${row.id}`}>{row?.title}</Link>
                    )}
                  </TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.quality}</TableCell>
                  <TableCell>
                    {row?.lastUpdate && (
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
                    <Tooltip title="Remove from watch list">
                      <Button
                        onClick={() => removeSyncItem(row.id)}
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ minWidth: 0 }}
                      >
                        <SyncDisabled />
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
          No item in watch list.
        </Typography>
      )}
    </Box>
  );
}
