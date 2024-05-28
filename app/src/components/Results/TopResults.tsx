import React from "react";
import { ArrowRightAlt, SearchOff } from "@mui/icons-material";
import { Box, Button, Chip, Container, Typography } from "@mui/material";

import { useSearchProvider } from "src/provider/SearchProvider";

import { AlbumsLoader } from "../Skeletons/AlbumsLoader";

import TypeResults from "./TypeResults";

type TidalContentType = "albums" | "artists" | "tracks";

interface TabContentProps {
  children?: React.ReactNode;
  setTabIndex?: (index: number) => void;
  limit?: number;
  type: TidalContentType;
}

export default function TopResults(
  props: Omit<TabContentProps, "type"> & { changeTab: (index: number) => void },
) {
  const {
    loading,
    searchResults: { albums, artists, tracks, playlists },
  } = useSearchProvider();

  const data = [
    {
      type: "artists",
      label: "Artist(s)",
      items: artists?.items,
      total: artists?.totalNumberOfItems,
      limit: 3,
      tab: 2,
    },
    {
      type: "albums",
      label: "Album(s)",
      items: albums?.items,
      total: albums?.totalNumberOfItems,
      limit: 9,
      tab: 1,
    },
    {
      type: "tracks",
      label: "Track(s)",
      items: tracks?.items,
      total: tracks?.totalNumberOfItems,
      limit: 6,
      tab: 3,
    },
    {
      type: "playlists",
      label: "Playlist(s)",
      items: playlists?.items || [],
      total: playlists?.totalNumberOfItems,
      limit: 6,
      tab: 3,
    },
  ];

  if (loading) return <AlbumsLoader />;

  if (
    !loading &&
    data?.filter((item) => item?.total && item.total > 0).length === 0
  ) {
    return (
      <Container maxWidth="lg" sx={{ textAlign: "center", marginTop: 2 }}>
        <Chip
          icon={<SearchOff />}
          label="No result found :'("
          sx={{ fontWeight: "bold", padding: 1 }}
        />
      </Container>
    );
  }

  return (
    <>
      {data.map((block) => (
        <div key={`top-${block.type}`}>
          {block?.items?.length > 0 ? (
            <Box paddingBottom={3} key={`top-${block.type}`}>
              <Typography component="h2" variant="h4" paddingBottom={2}>
                {block.label}
              </Typography>
              <TypeResults
                type={block.type as TidalContentType}
                limit={block.limit}
              />
              {block?.limit && block?.items.length > block?.limit ? (
                <Box marginTop={3} justifyContent="flex-end" display="flex">
                  <Button
                    endIcon={<ArrowRightAlt />}
                    onClick={() => props.changeTab(block.tab)}
                    variant="contained"
                  >
                    See all {block?.type} ({block?.total})
                  </Button>
                </Box>
              ) : null}
            </Box>
          ) : null}
        </div>
      ))}
    </>
  );
}
