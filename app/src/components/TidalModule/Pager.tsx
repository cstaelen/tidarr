import { useState } from "react";
import { Box, Button } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";
import { ModuleResponseType, useModules } from "src/hooks/useModules";
import {
  AlbumType,
  ArtistType,
  PlaylistType,
  TrackType,
  VideoType,
} from "src/types";

import TypeResults, { TidalContentType } from "../Results/TypeResults";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";

export function ModulePager({
  data,
  type,
}: {
  data: ModuleResponseType;
  type: TidalContentType;
}) {
  const [page, setPage] = useState(1);
  const [paginatedData, setPaginatedData] =
    useState<
      (AlbumType | TrackType | PlaylistType | ArtistType | VideoType)[]
    >();

  const {
    pagedModuleLoading,
    actions: { queryModulePage },
  } = useModules();

  const url = data.pagedList?.dataApiPath;
  const limit = data?.pagedList?.limit || TIDAL_ITEMS_PER_PAGE;
  const nbPages = Math.ceil(data.pagedList?.totalNumberOfItems / limit);

  async function paginate() {
    if (!url) return;

    const pageData = await queryModulePage(url, page, limit);
    setPage(page + 1);
    setPaginatedData([...(paginatedData || []), ...(pageData?.items || [])]);
  }

  if (pagedModuleLoading) {
    return (
      <Box marginTop={2}>
        <AlbumsLoader />
      </Box>
    );
  }

  if (page === nbPages || isNaN(nbPages) || !url) return null;

  return (
    <>
      {paginatedData && <TypeResults type={type} data={paginatedData} />}
      <Box sx={{ textAlign: "center", width: "100%", margin: "1rem" }}>
        <Button
          variant="contained"
          size="large"
          onClick={async () => paginate()}
        >
          LOAD MORE (page: {page}/{nbPages})
        </Button>
      </Box>
    </>
  );
}
