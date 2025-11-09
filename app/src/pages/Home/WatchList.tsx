import { useEffect } from "react";
import { Sync, SyncDisabled } from "@mui/icons-material";
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
import { DownloadButton } from "src/components/Buttons/DownloadButton";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useSync } from "src/provider/SyncProvider";

export default function WatchList() {
  const {
    syncList,
    actions: { getSyncList, removeSyncItem, syncAllNow, removeAllSyncItem },
  } = useSync();

  useEffect(() => {
    getSyncList();
  }, [getSyncList]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <ModuleTitle title={`Watch list`} total={syncList?.length || 0} />

      {syncList?.length > 0 ? (
        <>
          <Box justifyContent="right" display="flex" pb={2} gap={2}>
            <Button
              onClick={() => syncAllNow()}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ minWidth: 0 }}
              endIcon={<Sync />}
            >
              Sync all now
            </Button>
            <Button
              onClick={() => removeAllSyncItem()}
              size="small"
              variant="outlined"
              color="error"
              sx={{ minWidth: 0 }}
              endIcon={<SyncDisabled />}
            >
              Remove all
            </Button>
          </Box>

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
                    <strong>Artist</strong>
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
                  <TableCell align="right">Actions</TableCell>
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
                        <Link href={`/${row.type}/${row.id}`}>
                          {row?.title}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>{row.artist}</TableCell>
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
                      <Box display="flex" gap={1} justifyContent="end">
                        <DownloadButton
                          id={row.id}
                          type={row.type}
                          item={row}
                          label="Sync now"
                          force
                        />
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
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Typography sx={{ textAlign: "center", py: 4 }}>
          No item in watch list.
        </Typography>
      )}
    </Box>
  );
}
