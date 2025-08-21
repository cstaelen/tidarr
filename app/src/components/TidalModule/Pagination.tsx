import { useState } from "react";
import { Box } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";
import { ModuleResponseType, useModules } from "src/hooks/useModules";
import {
  AlbumType,
  ArtistType,
  ModuleTypeKeys,
  PlaylistType,
  TrackType,
  VideoType,
} from "src/types";

import PagerButton from "../Buttons/PagerButton";

import Module from "./Module";

export function ModulePager({
  data,
  type,
}: {
  data: ModuleResponseType;
  type: ModuleTypeKeys;
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

  if (isNaN(nbPages) || !url) return null;

  return (
    <Box sx={{ my: 2 }}>
      <Module type={type} data={paginatedData} loading={pagedModuleLoading} />
      <PagerButton
        page={page}
        setPage={paginate}
        itemPerPage={limit}
        totalItems={data.pagedList?.totalNumberOfItems}
      />
    </Box>
  );
}
