import { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";
import { useModules } from "src/hooks/useModules";
import {
  AlbumType,
  ArtistType,
  ModuleTypeKeys,
  PlaylistType,
  TrackType,
  VideoType,
} from "src/types";

import PagerButton from "../../components/Buttons/PagerButton";
import Module from "../../components/TidalModule/Module";

import { ModuleTitle } from "./Title";

export default function PagedModule({
  type,
  url,
  title,
}: {
  type: ModuleTypeKeys;
  url: string;
  title: string;
}) {
  const [page, setPage] = useState(0);
  const [nbPages, setNbPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [paginatedData, setPaginatedData] =
    useState<
      (AlbumType | TrackType | PlaylistType | ArtistType | VideoType)[]
    >();

  const {
    pagedModuleLoading,
    actions: { queryModulePage },
  } = useModules();

  const limit = TIDAL_ITEMS_PER_PAGE;

  async function paginate() {
    if (!url) return;

    const pageData = await queryModulePage(url, page, limit);
    setPage(page + 1);
    setPaginatedData([...(paginatedData || []), ...(pageData?.items || [])]);
  }

  const fetchInit = useCallback(async () => {
    if (pagedModuleLoading || paginatedData) return;
    const response = await queryModulePage(url, 0, limit);
    if (response) {
      setPaginatedData(response?.items);
      setPage(1);
      setTotalItems(response?.totalNumberOfItems);
      setNbPages(Math.ceil(response?.totalNumberOfItems / limit));
    } else {
      setPaginatedData([]);
    }
  }, [limit, pagedModuleLoading, paginatedData, queryModulePage, url]);

  useEffect(() => {
    if (!paginatedData) {
      fetchInit();
    }
  }, [fetchInit, paginatedData]);

  if (isNaN(nbPages) || !url) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <ModuleTitle title={title} total={totalItems} />
      <Module type={type} data={paginatedData} loading={pagedModuleLoading} />
      <PagerButton
        page={page}
        setPage={paginate}
        itemPerPage={limit}
        totalItems={totalItems}
      />
    </Box>
  );
}
