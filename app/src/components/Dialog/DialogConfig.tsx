import React from "react";
import { InfoRounded, KeyOff, Warning } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
} from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

const TableParameters = ({
  rows,
}: {
  rows: [string, string | undefined][];
}) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table" size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Environment vars</strong>
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
              <TableCell>{row?.[1]}</TableCell>
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
    reactAppEnvVars,
    isUpdateAvailable,
    releaseData,
    isConfigModalOpen,
    actions,
  } = useConfigProvider();

  const [currentTab, setCurrentTab] = React.useState(0);
  const {
    actions: { deleteTidalToken, checkAPI },
  } = useConfigProvider();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <DialogHandler
      open={isConfigModalOpen}
      onClose={() => actions.toggleModal(false)}
      title={"Settings"}
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
        <Tab label="API" />
        <Tab label="Application" />
        <Tab label="Tidal Token" />
      </Tabs>

      {currentTab === 0 && (
        <>
          <p>Current version: {config?.TIDARR_VERSION}</p>
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
          {reactAppEnvVars ? (
            <TableParameters rows={Object.entries(reactAppEnvVars)} />
          ) : (
            "Not found."
          )}
        </>
      )}
      {currentTab === 3 && (
        <Box display="flex" justifyContent="center" my={4}>
          {!tokenMissing ? (
            <Button
              variant="contained"
              color="warning"
              startIcon={<KeyOff />}
              onClick={async () => {
                await deleteTidalToken();
                actions.toggleModal(false);
                await checkAPI();
              }}
            >
              Reset Tidal token
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
      )}
    </DialogHandler>
  );
};
