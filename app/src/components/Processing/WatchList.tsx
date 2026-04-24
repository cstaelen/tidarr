import { useEffect, useMemo, useState } from "react";
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
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { DownloadButton } from "src/components/Buttons/DownloadButton";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useSync } from "src/provider/SyncProvider";

import BackButton from "../Buttons/BackButton";

const PAGE_SIZE = 50;

type SortKey = "title" | "artist" | "type" | "quality" | "lastUpdate";
type SortDir = "asc" | "desc";

export default function WatchList() {
  const {
    syncList,
    actions: { getSyncList, removeSyncItem, syncAllNow, removeAllSyncItem },
  } = useSync();
  const [extraPages, setExtraPages] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    getSyncList();
  }, [getSyncList]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setExtraPages(0);
  };

  const sortedList = useMemo(() => {
    if (!syncList) return [];
    return syncList.slice().sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [syncList, sortKey, sortDir]);

  const visibleCount = PAGE_SIZE + extraPages * PAGE_SIZE;
  const visibleList = sortedList.slice(0, visibleCount);
  const remaining = sortedList.length - visibleCount;

  return (
    <>
      <ModuleTitle
        title={`Watch list`}
        total={syncList?.length || 0}
        leftBlock={<BackButton />}
        rightBlock={
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => syncAllNow()}
              size="small"
              variant="outlined"
              color="primary"
              disabled={syncList?.length === 0}
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
              disabled={syncList?.length === 0}
              sx={{ minWidth: 0 }}
              endIcon={<SyncDisabled />}
            >
              Remove all
            </Button>
          </Box>
        }
      />
      {syncList?.length > 0 ? (
        <TableContainer component={Paper}>
          <Table
            sx={{ minWidth: 650 }}
            aria-label="synced playlist table"
            size="small"
          >
            <TableHead>
              <TableRow>
                {(
                  [
                    { key: "title", label: "Title" },
                    { key: "artist", label: "Artist" },
                    { key: "type", label: "Type" },
                    { key: "quality", label: "Quality" },
                    { key: "lastUpdate", label: "Last run" },
                  ] as { key: SortKey; label: string }[]
                ).map(({ key, label }) => (
                  <TableCell key={key}>
                    <TableSortLabel
                      active={sortKey === key}
                      direction={sortKey === key ? sortDir : "asc"}
                      onClick={() => handleSort(key)}
                    >
                      <strong>{label}</strong>
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleList.map((row) => (
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
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "end",
                      }}
                    >
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
        </TableContainer>
      ) : (
        <Typography sx={{ textAlign: "center", py: 4 }}>
          No item in watch list.
        </Typography>
      )}
    </>
  );
}
