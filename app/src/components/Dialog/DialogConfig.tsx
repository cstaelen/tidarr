import React from "react";
import styled from "@emotion/styled";
import { Clear, InfoRounded, KeyOff, Warning } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import Markdown from "markdown-to-jsx";
import { TIDARR_REPO_URL } from "src/contants";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useSync } from "src/provider/SyncProvider";

import { DialogHandler } from ".";

const TableParameters = ({
  rows,
}: {
  rows: [string, string | number | boolean | undefined][];
}) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table" size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Variable</strong>
            </TableCell>
            <TableCell>
              <strong>Value</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row[0]}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell>{row?.[0]}</TableCell>
              <TableCell>{row?.[1]?.toString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const DialogConfig = () => {
  const {
    tokenMissing,
    config,
    isUpdateAvailable,
    releaseData,
    tiddlConfig,
    isConfigModalOpen,
    actions,
  } = useConfigProvider();

  const [currentTab, setCurrentTab] = React.useState(0);
  const {
    actions: { checkAPI },
  } = useConfigProvider();
  const {
    actions: { delete_token },
  } = useApiFetcher();
  const {
    syncList,
    actions: { removeSyncItem },
  } = useSync();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <DialogHandler
      open={isConfigModalOpen}
      onClose={() => actions.toggleModal(false)}
      title={"Tidarr settings"}
      icon={<InfoRounded color="primary" />}
    >
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
      >
        <Tab label="Updates" />
        <Tab label="Environment vars" />
        <Tab label="Tidal Token" />
        <Tab label="Synced playlists" />
      </Tabs>

      {currentTab === 0 && (
        <>
          <p>Current version: Tidarr {config?.TIDARR_VERSION}</p>
          {isUpdateAvailable ? (
            <>
              <Paper sx={{ p: 2 }}>
                <strong>Update available: {releaseData?.name}</strong>
              </Paper>
              <p>To update image stop container and run :</p>
              <Paper sx={{ p: 2 }}>
                <code>docker compose pull tidarr</code>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 2 }}>
              <strong>
                {isUpdateAvailable
                  ? `Update available: ${releaseData?.name}`
                  : "Tidarr is up to date."}
              </strong>
            </Paper>
          )}
          {releaseData?.body && (
            <>
              <p>Changelog</p>
              <Paper
                sx={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  fontSize: "12px",
                  overflow: "auto",
                  px: 2,
                }}
              >
                <code>
                  <MarkdownStyled options={{ wrapper: "article" }}>
                    {releaseData?.body}
                  </MarkdownStyled>
                </code>
              </Paper>
              <br />
              <Link
                target="_BLANK"
                href={`https://github.com/${TIDARR_REPO_URL}/releases`}
              >
                See older releases
              </Link>
            </>
          )}
        </>
      )}
      {currentTab === 1 && (
        <>
          {config ? (
            <TableParameters rows={Object.entries(config)} />
          ) : (
            "Not found."
          )}
        </>
      )}
      {currentTab === 2 && (
        <>
          <Box display="flex" justifyContent="center" my={4}>
            {!tokenMissing ? (
              <Button
                variant="contained"
                color="warning"
                startIcon={<KeyOff />}
                onClick={async () => {
                  actions.toggleModal(false);
                  await delete_token();
                  checkAPI();
                }}
              >
                Revoke Tidal token
              </Button>
            ) : (
              <Alert
                color="warning"
                icon={<Warning sx={{ fontSize: 20 }} />}
                variant="outlined"
              >
                No Tidal token found !
              </Alert>
            )}
          </Box>
          <Box>
            <h3>Tiddl template options</h3>
            {tiddlConfig?.template ? (
              <TableParameters rows={Object.entries(tiddlConfig.template)} />
            ) : (
              "Not found."
            )}
            <h3>Tiddl download options</h3>
            {tiddlConfig?.download ? (
              <TableParameters rows={Object.entries(tiddlConfig.download)} />
            ) : (
              "Not found."
            )}
            <h3>Tiddl cover options</h3>
            {tiddlConfig?.cover ? (
              <TableParameters rows={Object.entries(tiddlConfig.cover)} />
            ) : (
              "Not found."
            )}
          </Box>
        </>
      )}
      {currentTab === 3 && (
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
                      <strong>Last run</strong>
                    </TableCell>
                    <TableCell>&nbsp;</TableCell>
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
                        <Link href={`/${row.type}/${row.id}`}>
                          {row?.title}
                        </Link>
                      </TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.lastUpdate}</TableCell>
                      <TableCell>
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
              No synced playlist
            </Typography>
          )}
        </>
      )}
    </DialogHandler>
  );
};

const MarkdownStyled = styled(Markdown)`
  a {
    color: rgb(144, 202, 249);
  }

  ul {
    padding-left: 1rem;
  }
`;
