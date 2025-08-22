import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Container, Portal, Tab, Tabs, useTheme } from "@mui/material";

import MyFavorites from "./MyFavorites";
import MyMixes from "./MyMixes";
import MyPlaylists from "./MyPlaylists";
import Trends from "./Trends";

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function HomeTabs() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const [pageLoaded, setPageLoaded] = React.useState(false);
  const params = useParams();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    setValue(0);
  }, [params]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [value]);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  if (!pageLoaded) return;

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Portal container={document.getElementById("app-bar")}>
        <Container maxWidth="lg">
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant={window.innerWidth > 800 ? "fullWidth" : "scrollable"}
            aria-label="Tidal home tabs"
          >
            <Tab label="Tidal Trends" />
            <Tab label="My Mixes" />
            <Tab label="My Playlists" />
            <Tab label="My Favorites" />
          </Tabs>
        </Container>
      </Portal>

      <Container maxWidth="lg">
        <TabPanel value={value} index={0} dir={theme.direction}>
          <Trends />
        </TabPanel>
        <TabPanel value={value} index={1} dir={theme.direction}>
          <MyMixes />
        </TabPanel>
        <TabPanel value={value} index={2} dir={theme.direction}>
          <MyPlaylists />
        </TabPanel>
        <TabPanel value={value} index={3} dir={theme.direction}>
          <MyFavorites />
        </TabPanel>
      </Container>
    </Box>
  );
}
