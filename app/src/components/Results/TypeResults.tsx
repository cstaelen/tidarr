import React from "react";
import { SearchOff } from "@mui/icons-material";
import { Box, Chip, Container, Grid } from "@mui/material";
import { useSearchProvider } from "src/provider/SearchProvider";
import {
  AlbumType,
  ArtistType,
  MixType,
  PlaylistType,
  TrackType,
} from "src/types";

import AlbumCard from "../Cards/Album";
import Artist from "../Cards/Artist";
import Playlist from "../Cards/Playlist";
import Track from "../Cards/Track";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";

import Pager from "./Pager";

type TidalContentType = "albums" | "artists" | "tracks" | "playlists" | "mix";

interface TabContentProps {
  children?: React.ReactNode;
  setTabIndex?: (index: number) => void;
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
              data: AlbumType | ArtistType | TrackType | PlaylistType | MixType,
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
                ) : props.type === "tracks" || props.type === "mix" ? (
                  <Track track={data as TrackType} />
                ) : props.type === "playlists" ? (
                  <Playlist playlist={data as PlaylistType} />
                ) : null}
              </Grid>
            ),
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
