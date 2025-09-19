import PagedModule from "src/components/TidalModule/PagedModule";
import { FetchTidalSearchProps } from "src/hooks/useFetchTidal";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function MyFavorites() {
  const { tiddlConfig } = useConfigProvider();

  const orderParams: { [key: string]: Partial<FetchTidalSearchProps> } = {
    "Most recent": { orderDirection: "DESC", order: "DATE" },
    "Recently updated": { orderDirection: "DESC", order: "DATE_UPDATED" },
    Alphabetical: { orderDirection: "ASC", order: "NAME" },
  };

  return (
    <>
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/albums`}
        type="USER_ALBUM_LIST"
        title="My Favorite albums"
        orderParams={orderParams}
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/tracks`}
        type="ALBUM_ITEMS"
        title="My Favorite tracks"
        orderParams={orderParams}
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/artists`}
        type="USER_ARTIST_LIST"
        title="My Favorite artists"
        orderParams={orderParams}
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/playlists`}
        type="MIXED_TYPES_LIST"
        title="My Favorite playlists"
        orderParams={orderParams}
      />
      <PagedModule
        url={`/v2/favorites/mixes`}
        type="MIX_LIST"
        title="My Favorite mixes"
        orderParams={orderParams}
      />
    </>
  );
}
