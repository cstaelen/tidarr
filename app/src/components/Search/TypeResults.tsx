import { Box, Button } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";
import { useSearchProvider } from "src/provider/SearchProvider";
import {
  AlbumType,
  ArtistType,
  ModuleTypeKeys,
  PlaylistType,
  TidalPagedListType,
  TrackType,
  VideoType,
} from "src/types";

import Module from "../TidalModule/Module";

interface TabContentProps {
  setTabIndex?: (index: number) => void;
  limit?: number;
  total?: number;
  type: ModuleTypeKeys;
  data: TidalPagedListType<
    AlbumType | TrackType | PlaylistType | ArtistType | VideoType
  >;
}

export default function TypeResults(props: TabContentProps) {
  const { actions, page, loading } = useSearchProvider();

  return (
    <>
      <Module data={props.data.items} type={props.type} loading={loading} />

      <Box sx={{ textAlign: "center", width: "100%", margin: "1rem" }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => actions.setPage(page + 1)}
        >
          LOAD MORE (page: {page}/
          {Math.ceil(props.data.totalNumberOfItems / TIDAL_ITEMS_PER_PAGE)})
        </Button>
      </Box>
    </>
  );
}
