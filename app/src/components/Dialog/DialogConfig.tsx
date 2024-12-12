import React from "react";
import { InfoRounded } from "@mui/icons-material";
import {
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
    config,
    reactAppEnvVars,
    isUpdateAvailable,
    releaseData,
    isConfigModalOpen,
    actions,
  } = useConfigProvider();

  const [currentTab, setCurrentTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (!isConfigModalOpen) return null;

  return (
    <DialogHandler
      onClose={() => actions.toggleModal(false)}
      title={
        <>
          <InfoRounded />
          &nbsp;
          {"Settings"}
        </>
      }
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
    </DialogHandler>
  );
};
