import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Button, Container, Grid, Link } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";
import { ArtistProvider, useArtist } from "src/provider/ArtistProvider";

import AlbumCard from "../components/Cards/Album";
import { AlbumsLoader } from "../components/Skeletons/AlbumsLoader";
import { useSearchProvider } from "../provider/SearchProvider";
import { AlbumType, TidalArtistModuleType } from "../types";

function Pager({
  data,
  index,
}: {
  data: TidalArtistModuleType;
  index: number;
}) {
  const {
    artistPagerLoading,
    actions: { queryArtistPage },
  } = useArtist();
  const [page, setPage] = useState(1);

  const url = data.pagedList.dataApiPath;
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

  if (page === nbPages || isNaN(nbPages)) return null;

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

  const { id } = useParams();

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
      <Container maxWidth="lg">
        <h1>
          <Link href={`https://tidal.com/browse/artist/${id}`} target="_blank">
            Artist: {artistResults?.title}
            <OpenInNewIcon
              style={{
                verticalAlign: "middle",
                marginLeft: "0.5rem",
                fontSize: 32,
              }}
            />
          </Link>
        </h1>
      </Container>
      {artistResults?.blocks?.map((block, index1) => (
        <Container maxWidth="lg" key={`card-${index1}`} component="section">
          <Box marginBottom={5}>
            <h2>
              {block.title} ({block.pagedList.totalNumberOfItems})
            </h2>
            <hr />
            <br />
            <Grid container spacing={2}>
              {block.pagedList.items.map((album, index2) => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  lg={4}
                  key={`card-${index1}-${index2}`}
                  sx={{
                    display:
                      quality === "all" ||
                      (album as AlbumType)?.audioQuality?.toLowerCase() ===
                        quality
                        ? "block"
                        : "none",
                  }}
                >
                  <AlbumCard album={album} />
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

export default function ArtistPage() {
  return (
    <ArtistProvider>
      <ArtistContent />
    </ArtistProvider>
  );
}
