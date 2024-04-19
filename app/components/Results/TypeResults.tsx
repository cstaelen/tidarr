import { useSearchProvider } from "@/app/provider/SearchProvider";
import { AlbumType, ArtistType, PlaylistType, TrackType } from "@/app/types";
import { Box, Chip, Container, Grid } from "@mui/material";
import AlbumCard from "../Cards/Album";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";
import Artist from "../Cards/Artist";
import Track from "../Cards/Track";
import Pager from "./Pager";
import Playlist from "../Cards/Playlist";
import { SearchOff } from "@mui/icons-material";

type TidalContentType = "albums" | "artists" | "tracks";

interface TabContentProps {
  children?: React.ReactNode;
  setTabIndex?: Function;
  limit?: number;
  type: TidalContentType;
}

export default function TypeResults(props: TabContentProps) {
  const { quality, actions, page, loading, searchResults } =
    useSearchProvider();

  const data = searchResults?.[props.type];

  return (
    <Grid container spacing={2}>
      {data?.items?.length > 0 ? (
        data?.items
          ?.slice(0, props.limit || data?.items?.length)
          .map(
            (
              data: AlbumType | ArtistType | TrackType | PlaylistType,
              index: number
            ) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={`album-${index}`}
                sx={{
                  display:
                    props.type === "artists" ||
                    quality === "all" ||
                    (
                      data as AlbumType | TrackType
                    )?.audioQuality?.toLowerCase() === quality
                      ? "block"
                      : "none",
                }}
              >
                {props.type === "albums" ? (
                  <AlbumCard album={data as AlbumType} />
                ) : props.type === "artists" ? (
                  <Artist artist={data as ArtistType} />
                ) : props.type === "tracks" ? (
                  <Track track={data as TrackType} />
                ) : props.type === "playlists" ? (
                  <Playlist playlist={data as PlaylistType} />
                ) : null}
              </Grid>
            )
          )
      ) : !loading ? (
        <Container maxWidth="lg" sx={{ textAlign: "center", marginTop: 3 }}>
          <Chip
            icon={<SearchOff />}
            label="No result found :'("
            sx={{ fontWeight: "bold", padding: 1 }}
          />
        </Container>
      ) : null}
      {loading && (
        <Box marginTop={2}>
          <AlbumsLoader />
        </Box>
      )}
      {!props.limit && data?.totalNumberOfItems && (
        <Pager
          page={page}
          totalItems={data?.totalNumberOfItems}
          setPage={actions.setPage}
        />
      )}
    </Grid>
  );
}
