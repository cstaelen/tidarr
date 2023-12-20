"use client";

import {
  AppBar,
  Box,
  Button,
  Container,
  Skeleton,
  Tab,
  Tabs,
  useTheme,
} from "@mui/material";

import { AlbumType, ArtistType, TrackType } from "../types";
import AlbumCard from "./Results/Album";
import ArtistCard from "./Results/Artist";
import TrackCard from "./Results/Track";
import Grid from "@mui/material/Unstable_Grid2";
import React from "react";
import SwipeableViews from "react-swipeable-views";
import { useSearchProvider } from "../provider/SearchProvider";
import { HeaderSearch } from "./HeaderSearch";
import ArtistPage from "./ArtistPage";

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

interface TabContentProps {
  children?: React.ReactNode;
  setTabIndex?: Function;
  type: "albums" | "artists" | "tracks";
}

function TabContent(props: TabContentProps) {
  const { actions, page, loading, itemPerPage, searchResults } =
    useSearchProvider();

  const data = searchResults?.[props.type];

  if (loading) return <Loader />;

  return (
    <Grid container spacing={2}>
      {data?.items?.length > 0
        ? data?.items?.map(
            (item: AlbumType | ArtistType | TrackType, index: number) => (
              <Grid xs={12} md={6} lg={4} key={`album-${index}`}>
                {props.type === "albums" ? (
                  <AlbumCard album={item as AlbumType} />
                ) : props.type === "artists" ? (
                  <ArtistCard
                    artist={item as ArtistType}
                    setTabIndex={props.setTabIndex as Function}
                  />
                ) : props.type === "tracks" ? (
                  <TrackCard track={item as TrackType} />
                ) : null}
              </Grid>
            )
          )
        : "No result."}
      <Pager
        page={page}
        itemPerPage={itemPerPage}
        totalItems={data?.totalNumberOfItems}
        setPage={actions.setPage}
      />
    </Grid>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

const Pager = ({
  page,
  itemPerPage,
  totalItems,
  setPage,
}: {
  page: number;
  itemPerPage: number;
  totalItems: number;
  setPage: Function;
}) => {
  if (page * itemPerPage > totalItems) return null;
  return (
    <Box sx={{ textAlign: "center", width: "100%", margin: "1rem" }}>
      <Button
        variant="contained"
        size="large"
        onClick={() => setPage(page + 1)}
      >
        LOAD MORE (page: {page}/{Math.floor(totalItems / itemPerPage)})
      </Button>
    </Box>
  );
};

const Loader = () => {
  return (
    <Grid container spacing={2}>
      <Grid xs={12} md={6}>
        <Skeleton
          variant="rectangular"
          width={560}
          height={200}
          animation="wave"
        />
      </Grid>
      <Grid xs={12} md={6}>
        <Skeleton
          variant="rectangular"
          width={560}
          height={200}
          animation="wave"
        />
      </Grid>
      <Grid xs={12} md={6}>
        <Skeleton
          variant="rectangular"
          width={560}
          height={200}
          animation="wave"
        />
      </Grid>
      <Grid xs={12} md={6}>
        <Skeleton
          variant="rectangular"
          width={560}
          height={200}
          animation="wave"
        />
      </Grid>
    </Grid>
  );
};

export const Results = () => {
  const {
    keywords,
    artistResults,
    searchResults: { albums, artists, tracks },
  } = useSearchProvider();

  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValue(index);
  };

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
              variant="fullWidth"
              aria-label="full width tabs example"
            >
              <Tab
                label={`Albums (${albums?.totalNumberOfItems || 0})`}
                {...a11yProps(0)}
              />
              <Tab
                label={`Artists (${artists?.totalNumberOfItems || 0})`}
                {...a11yProps(1)}
              />
              <Tab
                label={`Tracks (${tracks?.totalNumberOfItems || 0})`}
                {...a11yProps(2)}
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
          <SwipeableViews
            axis={theme.direction === "rtl" ? "x-reverse" : "x"}
            index={value}
            onChangeIndex={handleChangeIndex}
          >
            <TabPanel value={value} index={0} dir={theme.direction}>
              <TabContent type="albums" />
            </TabPanel>
            <TabPanel value={value} index={1} dir={theme.direction}>
              <TabContent type="artists" setTabIndex={handleChangeIndex} />
            </TabPanel>
            <TabPanel value={value} index={2} dir={theme.direction}>
              <TabContent type="tracks" />
            </TabPanel>
          </SwipeableViews>
        </Container>
      )}
    </Box>
  );
};
