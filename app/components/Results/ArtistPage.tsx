import { Box, Button, Container, Grid, Link } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { AlbumType, TidalArtistModuleType } from "../../types";
import AlbumCard from "../Cards/Album";
import { useSearchProvider } from "../../provider/SearchProvider";
import { useState } from "react";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";
import { TIDAL_ITEMS_PER_PAGE } from "@/app/contants";

function Pager({
  data,
  index,
}: {
  data: TidalArtistModuleType;
  index: number;
}) {
  const {
    artistPagerLoading,
    actions: { fetchArtistPage },
  } = useSearchProvider();
  const [page, setPage] = useState(1);

  const url = data.pagedList.dataApiPath;
  const nbPages = Math.ceil(
    data.pagedList.totalNumberOfItems / TIDAL_ITEMS_PER_PAGE
  );

  if (artistPagerLoading === index) {
    return (
      <Box marginTop={2}>
        <AlbumsLoader />
      </Box>
    );
  }

  if (page === nbPages || isNaN(nbPages)) return;

  return (
    <Box sx={{ textAlign: "center", width: "100%", margin: "1rem" }}>
      <Button
        variant="contained"
        size="large"
        onClick={() => {
          fetchArtistPage(url, index, page);
          setPage(page + 1);
        }}
      >
        LOAD MORE (page: {page}/{nbPages})
      </Button>
    </Box>
  );
}

export default function ArtistPage({
  name,
  data,
}: {
  name: string;
  data: TidalArtistModuleType[];
}) {
  const { quality } = useSearchProvider();

  return (
    <Box marginBottom={15}>
      <Container maxWidth="lg">
        <h1>
          <Link
            href={`https://tidal.com/browse/artist/${name.split(":")[1]}`}
            target="_blank"
          >
            Artist: {name.split(":")[2]}
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
      {data.map((block, index1) => (
        <Container maxWidth="lg" key={`card-${index1}`}>
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
                      (
                        album as AlbumType
                      )?.audioQuality?.toLowerCase() === quality
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
