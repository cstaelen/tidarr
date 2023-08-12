"use client";

import { AppBar, Box, Button, Pagination, Skeleton, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { useTidalProvider } from "../provider/TidalProvider";
import { AlbumType, ArtistType, TrackType } from "../types";
import AlbumCard from "./Results/Album";
import ArtistCard from "./Results/Artist";
import TrackCard from "./Results/Track";
import Grid from "@mui/material/Unstable_Grid2";
import React, { ChangeEvent } from "react";
import SwipeableViews from "react-swipeable-views";

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
      {value === index && (
        <Box sx={{ py: 3, px: 1 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

const Pager = ({ page, itemPerPage, totalItems, setPage }: { page: number; itemPerPage: number; totalItems: number; setPage: Function }) => {
  if (page * itemPerPage > totalItems) return null;
  return (
    <Box sx={{ textAlign: "center", width: "100%", margin: "1rem" }}>
      <Button variant="contained" size="large" onClick={() => setPage(page + 1)}>
        LOAD MORE (page: {page})
      </Button>
    </Box>
  )
};

const Loader = () => {
  return (
    <Grid container spacing={2}>
      <Grid xs={12} md={6}>
        <Skeleton variant="rectangular" width={560} height={200} animation="wave" />
      </Grid>
      <Grid xs={12} md={6}>
        <Skeleton variant="rectangular" width={560} height={200} animation="wave" />
      </Grid>
    </Grid >)
};

export const Results = () => {
  const {
    actions,
    page,
    loading,
    itemPerPage,
    searchResults: { albums, artists, tracks },
  } = useTidalProvider();

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
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          aria-label="full width tabs example"
        >
          <Tab label={`Albums (${albums?.totalNumberOfItems || 0})`} {...a11yProps(0)} />
          <Tab label={`Artists (${artists?.totalNumberOfItems || 0})`} {...a11yProps(1)} />
          <Tab label={`Tracks (${tracks?.totalNumberOfItems || 0})`} {...a11yProps(2)} />
        </Tabs>
      </AppBar>
      <SwipeableViews
        axis={theme.direction === "rtl" ? "x-reverse" : "x"}
        index={value}
        onChangeIndex={handleChangeIndex}
      >
        <TabPanel value={value} index={0} dir={theme.direction}>
          <Grid container spacing={2}>
            {albums?.items?.length > 0
              ? albums?.items?.map((album: AlbumType, index: number) => (
                <Grid xs={12} md={6} key={`album-${index}`}>
                  <AlbumCard album={album} />
                </Grid>
              ))
              : loading ? 
                <Loader />
              : "No result."}
            <Pager page={page} itemPerPage={itemPerPage} totalItems={albums?.totalNumberOfItems} setPage={actions.setPage} />
          </Grid>
        </TabPanel>
        <TabPanel value={value} index={1} dir={theme.direction}>
          <Grid container spacing={2}>
            {artists?.items?.length > 0
              ? artists?.items?.map((artist: ArtistType, index: number) => (
                <Grid xs={12} md={6} key={`album-${index}`}>
                  <ArtistCard artist={artist} setTabIndex={handleChangeIndex} />
                </Grid>
              ))
              : "No result."}
            <Pager page={page} itemPerPage={itemPerPage} totalItems={artists?.totalNumberOfItems} setPage={actions.setPage} />
          </Grid>
        </TabPanel>
        <TabPanel value={value} index={2} dir={theme.direction}>
          <Grid container spacing={2}>
            {tracks?.items?.length > 0
              ? tracks?.items?.map((track: TrackType, index: number) => (
                <Grid xs={12} md={6} key={`album-${index}`}>
                  <TrackCard track={track} />
                </Grid>
              ))
              : "No result."}
            <Pager page={page} itemPerPage={itemPerPage} totalItems={tracks?.totalNumberOfItems} setPage={actions.setPage} />
          </Grid>
        </TabPanel>
      </SwipeableViews>
    </Box>
  );
};
