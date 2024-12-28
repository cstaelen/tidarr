import React from "react";
import { Box, Grid } from "@mui/material";
import { useSearchProvider } from "src/provider/SearchProvider";
import { AlbumType, ArtistType, PlaylistType, TrackType } from "src/types";

import AlbumCard from "../Cards/Album";
import Artist from "../Cards/Artist";
import Playlist from "../Cards/Playlist";
import Track from "../Cards/Track";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";

import NoResult from "./NoResults";
import Pager from "./Pager";

type TidalContentType = "albums" | "artists" | "tracks" | "playlists";

interface TabContentProps {
  setTabIndex?: (index: number) => void;
  limit?: number;
  total?: number;
  type: TidalContentType;
  data: AlbumType[] | TrackType[] | PlaylistType[] | ArtistType[];
}

export default function TypeResults(props: TabContentProps) {
  const { quality, actions, page, loading } = useSearchProvider();

  return (
    <Grid container spacing={2}>
      {props.data?.length > 0 ? (
        props.data
          ?.slice(0, props.limit || props.data?.length)
          .map(
            (
              data: AlbumType | ArtistType | TrackType | PlaylistType,
              index: number,
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
