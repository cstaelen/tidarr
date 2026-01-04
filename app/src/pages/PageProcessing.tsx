import React from "react";
import { Queue, Sync } from "@mui/icons-material";
import { Box, Container, Portal, Tab, Tabs, useTheme } from "@mui/material";
import ProcessingList from "src/components/Processing/ProcessingList";
import { useProcessingProvider } from "src/provider/ProcessingProvider";
import { useSync } from "src/provider/SyncProvider";

import WatchList from "../components/Processing/WatchList";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function ProcessingTabs() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const { syncList } = useSync();
  const { processingList } = useProcessingProvider();

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Portal container={document.getElementById("app-bar")}>
        <Container maxWidth="md">
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant={window.innerWidth > 800 ? "fullWidth" : "scrollable"}
            aria-label="Tidal home tabs"
          >
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Queue />
                  {`Queue (${processingList?.length || 0})`}
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Sync />
                  {`Watch list (${syncList?.length || 0})`}
                </Box>
              }
            />
          </Tabs>
        </Container>
      </Portal>

      <Container maxWidth="md">
        <TabPanel value={value} index={0} dir={theme.direction}>
          <ProcessingList />
        </TabPanel>
        <TabPanel value={value} index={1} dir={theme.direction}>
          <WatchList />
        </TabPanel>
      </Container>
    </Box>
  );
}
