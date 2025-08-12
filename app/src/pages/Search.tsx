import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Container, Tab, Tabs, useTheme } from "@mui/material";
import { a11yProps } from "src/utils/helpers";

import TopResults from "../components/Results/TopResults";
import TypeResults from "../components/Results/TypeResults";
import { useSearchProvider } from "../provider/SearchProvider";

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

export default function Search() {
  const {
    keywords,
    searchResults: { albums, artists, tracks, playlists, videos },
  } = useSearchProvider();

  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const params = useParams();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    setValue(0);
  }, [params]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [value]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      {keywords && (
        <Box sx={{ bgcolor: "#212121" }}>
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
                    playlists?.totalNumberOfItems +
                    tracks?.totalNumberOfItems +
                    videos?.totalNumberOfItems || 0
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
              <Tab
                label={`Videos (${videos?.totalNumberOfItems || 0})`}
                {...a11yProps(5)}
              />
            </Tabs>
          </Container>
        </Box>
      )}

      {keywords && (
        <Container maxWidth="lg">
          <TabPanel value={value} index={0} dir={theme.direction}>
            <TopResults changeTab={setValue} />
          </TabPanel>
          <TabPanel value={value} index={1} dir={theme.direction}>
            <TypeResults
              type="albums"
              data={albums?.items}
              total={albums?.totalNumberOfItems}
            />
          </TabPanel>
          <TabPanel value={value} index={2} dir={theme.direction}>
            <TypeResults
              type="artists"
              data={artists?.items}
              total={artists?.totalNumberOfItems}
            />
          </TabPanel>
          <TabPanel value={value} index={3} dir={theme.direction}>
            <TypeResults
              type="tracks"
              data={tracks?.items}
              total={tracks?.totalNumberOfItems}
            />
          </TabPanel>
          <TabPanel value={value} index={4} dir={theme.direction}>
            <TypeResults
              type="playlists"
              data={playlists?.items}
              total={playlists?.totalNumberOfItems}
            />
          </TabPanel>
          <TabPanel value={value} index={5} dir={theme.direction}>
            <TypeResults
              type="videos"
              data={videos?.items}
              total={videos?.totalNumberOfItems}
            />
          </TabPanel>
        </Container>
      )}
    </Box>
  );
}
