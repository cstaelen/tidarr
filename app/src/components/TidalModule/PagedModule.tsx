import { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";
import { FetchTidalSearchProps } from "src/hooks/useFetchTidal";
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

import { SelectEventType, SortSelector } from "./SortSelector";
import { ModuleTitle } from "./Title";

export default function PagedModule({
  type,
  url,
  title,
  orderParams,
}: {
  type: ModuleTypeKeys;
  url: string;
  title: string;
  orderParams?: { [key: string]: Partial<FetchTidalSearchProps> };
}) {
  const [page, setPage] = useState(0);
  const [nbPages, setNbPages] = useState(0);
  const [sort, setSort] = useState<Partial<FetchTidalSearchProps> | undefined>(
    orderParams ? Object.entries(orderParams)[0][1] : undefined,
  );
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
    const response = await queryModulePage(url, 0, limit, { ...sort });
    if (response) {
      setPaginatedData(response?.items);
      setPage(1);
      setTotalItems(response?.totalNumberOfItems);
      setNbPages(Math.ceil(response?.totalNumberOfItems / limit));
    } else {
      setPaginatedData([]);
    }
  }, [limit, pagedModuleLoading, paginatedData, queryModulePage, sort, url]);

  const sortUpdate = (e: SelectEventType) => {
    const params = orderParams?.[e.target.value as string];
    setSort(params);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaginatedData(undefined);
    if (sort) {
      fetchInit();
    }
  }, [sort]);

  useEffect(() => {
    if (!paginatedData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchInit();
    }
  }, [fetchInit, paginatedData]);

  if (isNaN(nbPages) || !url) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <ModuleTitle
        title={title}
        total={totalItems}
        rightBlock={
          orderParams && (
            <SortSelector data={orderParams} handleChange={sortUpdate} />
          )
        }
      />
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
