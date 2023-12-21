import { Box, Button, Container, Grid, Link } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { TidalArtistModuleType } from "../types";
import AlbumCard from "./Results/Album";
import page from "../page";
import { useSearchProvider } from "../provider/SearchProvider";
import { useState } from "react";
import { AlbumsLoader } from "./Skeletons/AlbumsLoader";

function Pager({ data, index }:{ data: TidalArtistModuleType, index: number }) {
  const { itemPerPage, artistPagerLoading, actions: { fetchArtistPage } } = useSearchProvider();
  const [page, setPage] = useState(1);
  
  const url = data.pagedList.dataApiPath;
  const nbPages = Math.ceil(data.pagedList.totalNumberOfItems / itemPerPage);
  
  if (artistPagerLoading === index) {
    return <AlbumsLoader />;
  }
  
  if (page === nbPages) return;

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
  return (
    <>
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
          <h2>
            {block.title} ({block.pagedList.totalNumberOfItems})
          </h2>
          <hr />
          <br />
          <Grid container spacing={1}>
            {block.pagedList.items.map((album, index2) => (
              <Grid
                item
                padding={1}
                xs={12}
                md={6}
                lg={4}
                key={`card-${index1}-${index2}`}
              >
                <AlbumCard album={album} />
              </Grid>
            ))}
          </Grid>
          <Pager data={block} index={index1} />
        </Container>
      ))}
    </>
  );
}
