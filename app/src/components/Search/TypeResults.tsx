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

import PagerButton from "../Buttons/PagerButton";
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
      <PagerButton
        page={page}
        setPage={() => actions.setPage(page + 1)}
        itemPerPage={TIDAL_ITEMS_PER_PAGE}
        totalItems={props.data.totalNumberOfItems}
      />
    </>
  );
}
