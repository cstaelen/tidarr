import { Box, Grid } from "@mui/material";
import { useSearchProvider } from "src/provider/SearchProvider";
import {
  AlbumType,
  ArtistType,
  MixType,
  ModuleItemLevelType,
  ModuleTypeKeys,
  PlaylistType,
  TrackType,
  VideoType,
} from "src/types";

import AlbumCard from "../Cards/Album";
import Artist from "../Cards/Artist";
import Mix from "../Cards/Mix";
import Playlist from "../Cards/Playlist";
import Track from "../Cards/Track";
import VideoCard from "../Cards/Video";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";
import NoResult from "../TidalModule/NoResults";

interface ModuleContentProps {
  type: ModuleTypeKeys;
  loading: boolean;
  data:
    | (AlbumType | TrackType | PlaylistType | ArtistType | VideoType)[]
    | undefined;
}

export default function Module(props: ModuleContentProps) {
  const { quality, display } = useSearchProvider();

  if (props.type)
    return (
      <Grid container spacing={2} className="module">
        {props.data && props.data?.length > 0 ? (
          props.data.map(
            (
              data:
                | AlbumType
                | ArtistType
                | TrackType
                | PlaylistType
                | MixType
                | VideoType
                | ModuleItemLevelType<PlaylistType>
                | ModuleItemLevelType<TrackType>
                | ModuleItemLevelType<AlbumType>
                | ModuleItemLevelType<ArtistType>,
              index: number,
            ) => (
              <Grid
                data-testid="item"
                size={{
                  xs: 12,
                  md:
                    display === "small" &&
                    ["TRACK_LIST", "ALBUM_ITEMS"].includes(props.type)
                      ? 12
                      : 6,
                  lg:
                    display === "small" &&
                    ["TRACK_LIST", "ALBUM_ITEMS"].includes(props.type)
                      ? 12
                      : 4,
                }}
                key={`album-${index}`}
                sx={{
                  display:
                    props.type === "VIDEO_LIST" ||
                    props.type === "MIX_LIST" ||
                    props.type === "ARTIST_LIST" ||
                    props.type === "USER_ARTIST_LIST" ||
                    (data as PlaylistType).type === "EDITORIAL" ||
                    quality === "all" ||
                    (
                      data as AlbumType | TrackType
                    )?.audioQuality?.toLowerCase() === quality
                      ? "block"
                      : "none",
                }}
              >
                {props.type === "ALBUM_LIST" ? (
                  <AlbumCard album={data as AlbumType} />
                ) : props.type === "ARTIST_LIST" ? (
                  <Artist artist={data as ArtistType} />
                ) : props.type === "TRACK_LIST" ? (
                  <Track track={data as TrackType} />
                ) : props.type === "ALBUM_ITEMS" ? (
                  <Track
                    track={(data as ModuleItemLevelType<TrackType>)?.item}
                  />
                ) : props.type === "PLAYLIST_LIST" ? (
                  <Playlist playlist={data as PlaylistType} />
                ) : props.type === "MIXED_TYPES_LIST" ? (
                  <Playlist
                    playlist={(data as ModuleItemLevelType<PlaylistType>)?.item}
                  />
                ) : props.type === "MIX_LIST" ? (
                  <Mix mix={data as MixType} />
                ) : props.type === "USER_ALBUM_LIST" ? (
                  <AlbumCard
                    album={(data as ModuleItemLevelType<AlbumType>)?.item}
                  />
                ) : props.type === "USER_ARTIST_LIST" ? (
                  <Artist
                    artist={(data as ModuleItemLevelType<ArtistType>)?.item}
                  />
                ) : props.type === "USER_PLAYLIST_LIST" ? (
                  <Playlist
                    playlist={
                      (data as ModuleItemLevelType<PlaylistType>)?.playlist
                    }
                  />
                ) : props.type === "VIDEO_LIST" ? (
                  <VideoCard video={data as VideoType} />
                ) : null}
              </Grid>
            ),
          )
        ) : props.data && !props.loading ? (
          <NoResult />
        ) : null}
        {props.loading && (
          <Box marginTop={2}>
            <AlbumsLoader />
          </Box>
        )}
      </Grid>
    );
}
