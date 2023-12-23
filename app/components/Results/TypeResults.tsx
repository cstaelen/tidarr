import { useSearchProvider } from "@/app/provider/SearchProvider";
import { AlbumType, ArtistType, TrackType } from "@/app/types";
import { Box, Grid } from "@mui/material";
import AlbumCard from "../Cards/Album";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";
import Artist from "../Cards/Artist";
import Track from "../Cards/Track";
import Pager from "./Pager";

type TidalContentType = "albums" | "artists" | "tracks";

interface TabContentProps {
  children?: React.ReactNode;
  setTabIndex?: Function;
  limit?: number;
  type: TidalContentType;
}

export default function TypeResults(props: TabContentProps) {
  const { actions, page, loading, searchResults } = useSearchProvider();

  const data = searchResults?.[props.type];

  return (
    <Grid container spacing={2}>
      {data?.items?.length > 0
        ? data?.items
            ?.slice(0, props.limit || data?.items?.length)
            .map((item: AlbumType | ArtistType | TrackType, index: number) => (
              <Grid item xs={12} md={6} lg={4} key={`album-${index}`}>
                {props.type === "albums" ? (
                  <AlbumCard album={item as AlbumType} />
                ) : props.type === "artists" ? (
                  <Artist
                    artist={item as ArtistType}
                    setTabIndex={props.setTabIndex as Function}
                  />
                ) : props.type === "tracks" ? (
                  <Track track={item as TrackType} />
                ) : null}
              </Grid>
            ))
        : !loading ? "No result." : null}
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
