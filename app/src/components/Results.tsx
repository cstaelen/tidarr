import React, { useEffect } from "react";
import { AppBar, Box, Container, Tab, Tabs, useTheme } from "@mui/material";

import { useSearchProvider } from "../provider/SearchProvider";

import ArtistPage from "./Results/ArtistPage";
import TopResults from "./Results/TopResults";
import TypeResults from "./Results/TypeResults";
import { HeaderSearch } from "./Search/HeaderSearch";

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
      {value === index && <Box sx={{ py: 3, px: 1 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export const Results = () => {
  const {
    keywords,
    artistResults,
    searchResults: { albums, artists, tracks, playlists },
  } = useSearchProvider();

  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    window.scrollTo(0, 0);
    setValue(newValue);
  };

  useEffect(() => setValue(0), [keywords]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <AppBar position="sticky" style={!keywords ? { boxShadow: "none" } : {}}>
        <HeaderSearch />
        {keywords && artistResults?.length === 0 && (
          <Container maxWidth="lg">
            <Tabs
              value={value}
              onChange={handleChange}
              indicatorColor="secondary"
              textColor="inherit"
              variant={window.innerWidth > 800 ? "fullWidth" : "scrollable"}
              aria-label="Tidal result tabs"
            >
              <Tab
                label={`Top results (${
                  albums?.totalNumberOfItems +
                    artists?.totalNumberOfItems +
                    tracks?.totalNumberOfItems || 0
                })`}
                {...a11yProps(0)}
              />
              <Tab
                label={`Albums (${albums?.totalNumberOfItems || 0})`}
                {...a11yProps(1)}
              />
              <Tab
                label={`Artists (${artists?.totalNumberOfItems || 0})`}
                {...a11yProps(2)}
              />
              <Tab
                label={`Tracks (${tracks?.totalNumberOfItems || 0})`}
                {...a11yProps(3)}
              />
              <Tab
                label={`Playlists (${playlists?.totalNumberOfItems || 0})`}
                {...a11yProps(4)}
              />
            </Tabs>
          </Container>
        )}
      </AppBar>
      {artistResults?.length > 0 && (
        <ArtistPage data={artistResults} name={keywords || ""} />
      )}
      {artistResults?.length === 0 && keywords && (
        <Container maxWidth="lg">
          <TabPanel value={value} index={0} dir={theme.direction}>
            <TopResults changeTab={setValue} />
          </TabPanel>
          <TabPanel value={value} index={1} dir={theme.direction}>
            <TypeResults type="albums" />
          </TabPanel>
          <TabPanel value={value} index={2} dir={theme.direction}>
            <TypeResults type="artists" />
          </TabPanel>
          <TabPanel value={value} index={3} dir={theme.direction}>
            <TypeResults type="tracks" />
          </TabPanel>
          <TabPanel value={value} index={4} dir={theme.direction}>
            <TypeResults type="playlists" />
          </TabPanel>
        </Container>
      )}
    </Box>
  );
};
