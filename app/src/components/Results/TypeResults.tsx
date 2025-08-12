import { Box, Grid } from "@mui/material";
import { useSearchProvider } from "src/provider/SearchProvider";
import {
  AlbumType,
  ArtistType,
  PlaylistType,
  TrackType,
  VideoType,
} from "src/types";

import AlbumCard from "../Cards/Album";
import Artist from "../Cards/Artist";
import Playlist from "../Cards/Playlist";
import Track from "../Cards/Track";
import VideoCard from "../Cards/Video";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";

import NoResult from "./NoResults";
import Pager from "./Pager";

export type TidalContentType =
  | "albums"
  | "artists"
  | "tracks"
  | "playlists"
  | "videos";

interface TabContentProps {
  setTabIndex?: (index: number) => void;
  limit?: number;
  total?: number;
  type: TidalContentType;
  data: (AlbumType | TrackType | PlaylistType | ArtistType | VideoType)[];
}

export default function TypeResults(props: TabContentProps) {
  const { quality, actions, page, loading, display } = useSearchProvider();

  return (
    <Grid container spacing={2}>
      {props.data?.length > 0 ? (
        props.data
          ?.slice(0, props.limit || props.data?.length)
          .map(
            (
              data:
                | AlbumType
                | ArtistType
                | TrackType
                | PlaylistType
                | VideoType,
              index: number,
            ) => (
              <Grid
                data-testid="item"
                size={{
                  xs: 12,
                  md: display === "small" && props.type === "tracks" ? 12 : 6,
                  lg: display === "small" && props.type === "tracks" ? 12 : 4,
                }}
                key={`album-${index}`}
                sx={{
                  display:
                    props.type === "videos" ||
                    props.type === "artists" ||
                    (data as PlaylistType).type === "EDITORIAL" ||
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
                ) : props.type === "videos" ? (
                  <VideoCard video={data as VideoType} />
                ) : null}
              </Grid>
            ),
          )
      ) : !loading ? (
        <NoResult />
      ) : null}
      {loading && (
        <Box marginTop={2}>
          <AlbumsLoader />
        </Box>
      )}
      {!props.limit && props?.total && (
        <Pager
          page={page}
          totalItems={props?.total}
          setPage={actions.setPage}
        />
      )}
    </Grid>
  );
}
