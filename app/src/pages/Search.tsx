import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Container, Portal, Tab, Tabs, useTheme } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { a11yProps } from "src/utils/helpers";

import TopResults from "../components/Search/TopResults";
import TypeResults from "../components/Search/TypeResults";
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
      {value === index && children}
    </div>
  );
}

export default function Search() {
  const {
    keywords,
    searchResults: { albums, artists, tracks, playlists, videos },
  } = useSearchProvider();
  const { tiddlConfig } = useConfigProvider();

  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const params = useParams();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    setTimeout(() => setValue(0));
  }, [params]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [value]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      {keywords && (
        <Portal container={document.getElementById("app-bar")}>
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
              {tiddlConfig?.download?.video_quality && (
                <Tab
                  label={`Videos (${videos?.totalNumberOfItems || 0})`}
                  {...a11yProps(5)}
                />
              )}
            </Tabs>
          </Container>
        </Portal>
      )}

      {keywords && (
        <Container maxWidth="lg">
          <TabPanel value={value} index={0} dir={theme.direction}>
            <TopResults changeTab={setValue} />
          </TabPanel>
          <TabPanel value={value} index={1} dir={theme.direction}>
            <TypeResults title="Albums" type="ALBUM_LIST" data={albums} />
          </TabPanel>
          <TabPanel value={value} index={2} dir={theme.direction}>
            <TypeResults title="Artists" type="ARTIST_LIST" data={artists} />
          </TabPanel>
          <TabPanel value={value} index={3} dir={theme.direction}>
            <TypeResults title="Tracks" type="TRACK_LIST" data={tracks} />
          </TabPanel>
          <TabPanel value={value} index={4} dir={theme.direction}>
            <TypeResults
              title="Playlists"
              type="PLAYLIST_LIST"
              data={playlists}
            />
          </TabPanel>
          {tiddlConfig?.download?.video_quality && (
            <TabPanel value={value} index={5} dir={theme.direction}>
              <TypeResults title="Videos" type="VIDEO_LIST" data={videos} />
            </TabPanel>
          )}
        </Container>
      )}
    </Box>
  );
}
