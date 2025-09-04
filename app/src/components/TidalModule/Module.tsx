import { Box, Grid } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
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
  type?: ModuleTypeKeys;
  loading?: boolean;
  data:
    | (AlbumType | TrackType | PlaylistType | ArtistType | VideoType)[]
    | undefined;
}

export default function Module(props: ModuleContentProps) {
  const { display } = useConfigProvider();

  function getCols(breakpoint: string) {
    if (!props.type) return;
    const isTrack = ["TRACK_LIST", "ALBUM_ITEMS"].includes(props.type);
    const isDisplaySmall = display === "small";
    const isVideo = ["VIDEO_LIST"].includes(props.type);
    switch (breakpoint) {
      case "xs":
        return 12;
      case "md":
        return isDisplaySmall && isTrack ? 12 : 6;
      case "lg":
        switch (true) {
          case isDisplaySmall && isTrack:
            return 12;
          case isDisplaySmall && !isTrack:
            return 4;
          case !isDisplaySmall && !isTrack && !isVideo:
            return 3;
          case !isDisplaySmall && isTrack:
            return 6;
          case !isDisplaySmall && isVideo:
            return 4;
        }
    }
  }

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
                md: getCols("md"),
                lg: getCols("lg"),
              }}
              key={`album-${index}`}
            >
              {props.type === "ALBUM_LIST" ? (
                <AlbumCard album={data as AlbumType} />
              ) : props.type === "ARTIST_LIST" ? (
                <Artist artist={data as ArtistType} />
              ) : props.type === "TRACK_LIST" ? (
                <Track track={data as TrackType} />
              ) : props.type === "ALBUM_ITEMS" ? (
                <Track track={(data as ModuleItemLevelType<TrackType>)?.item} />
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
