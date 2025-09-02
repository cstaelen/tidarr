import React from "react";
import { ArrowRightAlt } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { useSearchProvider } from "src/provider/SearchProvider";
import { ModuleTypeKeys } from "src/types";

import ModuleLoader from "../Skeletons/ModuleLoader";
import Module from "../TidalModule/Module";
import NoResult from "../TidalModule/NoResults";
import { ModuleTitle } from "../TidalModule/Title";

type TidalContentType =
  | "albums"
  | "artists"
  | "tracks"
  | "playlists"
  | "videos";

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
    searchResults: { albums, artists, tracks, playlists, videos },
  } = useSearchProvider();

  const data = [
    {
      type: "ARTIST_LIST",
      label: "Artists",
      items: artists?.items,
      total: artists?.totalNumberOfItems,
      limit: 3,
      tab: 2,
    },
    {
      type: "ALBUM_LIST",
      label: "Albums",
      items: albums?.items,
      total: albums?.totalNumberOfItems,
      limit: 9,
      tab: 1,
    },
    {
      type: "TRACK_LIST",
      label: "Tracks",
      items: tracks?.items,
      total: tracks?.totalNumberOfItems,
      limit: 6,
      tab: 3,
    },
    {
      type: "PLAYLIST_LIST",
      label: "Playlists",
      items: playlists?.items || [],
      total: playlists?.totalNumberOfItems,
      limit: 6,
      tab: 4,
    },
    {
      type: "VIDEO_LIST",
      label: "Videos",
      items: videos?.items || [],
      total: videos?.totalNumberOfItems,
      limit: 6,
      tab: 5,
    },
  ];

  if (loading) return <ModuleLoader />;

  if (
    !loading &&
    data?.filter((item) => item?.total && item.total > 0).length === 0
  ) {
    return <NoResult />;
  }

  return (
    <>
      {data.map((block) => (
        <div key={`top-${block.type}`}>
          {block?.items?.length > 0 ? (
            <Box paddingBottom={3} key={`top-${block.type}`}>
              <ModuleTitle title={block.label} total={block.total} />
              <Module
                type={block.type as ModuleTypeKeys}
                data={block.items.slice(0, block.limit)}
                loading={loading}
              />
              {block?.limit && block?.items.length > block?.limit ? (
                <Box marginTop={3} justifyContent="flex-end" display="flex">
                  <Button
                    endIcon={<ArrowRightAlt />}
                    onClick={() => props.changeTab(block.tab)}
                    variant="contained"
                  >
                    See all {block?.label} ({block?.total})
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
