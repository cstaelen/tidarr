import { Container, Grid, Link } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { TidalArtistModuleType } from "../types";
import AlbumCard from "./Results/Album";

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
            {block.title} ({block.pagedList.items.length})
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
        </Container>
      ))}
    </>
  );
}
