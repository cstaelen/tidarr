import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Container, Grid, Portal, Tab, Tabs } from "@mui/material";
import VideoCard from "src/components/Cards/Video";
import ArtistHeader from "src/components/Headers/Artist";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";
import { ArtistProvider, useArtist } from "src/provider/ArtistProvider";

import AlbumCard from "../components/Cards/Album";
import { AlbumsLoader } from "../components/Skeletons/AlbumsLoader";
import { useSearchProvider } from "../provider/SearchProvider";
import { AlbumType, TidalModuleListType, VideoType } from "../types";

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function Pager({
  data,
  index,
}: {
  data: TidalModuleListType<AlbumType | VideoType>;
  index: number;
}) {
  const {
    artistPagerLoading,
    actions: { queryArtistPage },
  } = useArtist();
  const [page, setPage] = useState(1);

  const url = data.pagedList?.dataApiPath;
  const nbPages = Math.ceil(
    data.pagedList.totalNumberOfItems / TIDAL_ITEMS_PER_PAGE,
  );

  if (artistPagerLoading === index) {
    return (
      <Box marginTop={2}>
        <AlbumsLoader />
      </Box>
    );
  }

  if (page === nbPages || isNaN(nbPages) || !url) return null;

  return (
    <Box sx={{ textAlign: "center", width: "100%", margin: "1rem" }}>
      <Button
        variant="contained"
        size="large"
        onClick={async () => {
          await queryArtistPage(url, index, page);
          setPage(page + 1);
        }}
      >
        LOAD MORE (page: {page}/{nbPages})
      </Button>
    </Box>
  );
}

function ArtistContent() {
  const { quality } = useSearchProvider();
  const { artistResults, actions, loading } = useArtist();
  const [currentTab, setCurrentTab] = useState(0);

  const { id } = useParams();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    document.querySelectorAll("section h2")?.[newValue]?.scrollIntoView();
  };

  async function fetchData(id: string) {
    await actions.queryArtist(id);
  }

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  if (loading)
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <AlbumsLoader />
      </Container>
    );

  return (
    <Box sx={{ bgcolor: "background.paper", mb: 2 }}>
      <Portal container={document.getElementById("app-bar")}>
        <Container maxWidth="lg">
          <Tabs
            value={currentTab}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant={window.innerWidth > 800 ? "fullWidth" : "scrollable"}
          >
            {artistResults?.blocks?.map((block, index1) => (
              <Tab
                key={`tab-anchor-${index1}`}
                label={`${
                  block.title.toLowerCase() === "featured albums"
                    ? "Albums"
                    : block.title
                } (${block.pagedList.totalNumberOfItems})`}
                {...a11yProps(index1)}
                sx={{ alignItems: "center" }}
              />
            ))}
          </Tabs>
        </Container>
      </Portal>
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        {artistResults?.artist && (
          <ArtistHeader artist={artistResults.artist} />
        )}
      </Container>
      {artistResults?.blocks?.map((block, index1) => (
        <Container
          maxWidth="lg"
          sx={{ mt: 2 }}
          key={`card-${index1}`}
          component="section"
        >
          <Box marginBottom={5}>
            <hr />
            <h2>
              {block.title.toLowerCase() === "featured albums"
                ? "Albums"
                : block.title}{" "}
              ({block.pagedList.totalNumberOfItems})
            </h2>
            <hr />
            <br />
            <Grid container spacing={2}>
              {block.pagedList.items.map((content, index2) => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  lg={4}
                  key={`card-${index1}-${index2}`}
                  sx={{
                    display:
                      quality === "all" ||
                      block.type === "VIDEO_LIST" ||
                      (content as AlbumType)?.audioQuality?.toLowerCase() ===
                        quality
                        ? "block"
                        : "none",
                  }}
                >
                  {block.type === "ALBUM_LIST" && (
                    <AlbumCard album={content as AlbumType} />
                  )}
                  {block.type === "VIDEO_LIST" && (
                    <VideoCard video={content as VideoType} />
                  )}
                </Grid>
              ))}
            </Grid>
            <Pager data={block} index={index1} />
          </Box>
        </Container>
      ))}
    </Box>
  );
}

export default function PageArtist() {
  return (
    <ArtistProvider>
      <ArtistContent />
    </ArtistProvider>
  );
}
