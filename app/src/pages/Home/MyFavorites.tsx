import PagedModule from "src/components/TidalModule/PagedModule";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function MyFavorites() {
  const { tiddlConfig } = useConfigProvider();

  return (
    <>
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/albums`}
        type="USER_ALBUM_LIST"
        title="My Favorite albums"
        orderParams={{
          "Recently added": { orderDirection: "DESC", order: "DATE" },
          "Recently released": {
            orderDirection: "DESC",
            order: "RELEASE_DATE",
          },
          "Artists A-Z": { orderDirection: "ASC", order: "ARTIST" },
          Alphabetical: { orderDirection: "ASC", order: "NAME" },
        }}
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/tracks`}
        type="ALBUM_ITEMS"
        title="My Favorite tracks"
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/artists`}
        type="USER_ARTIST_LIST"
        title="My Favorite artists"
        orderParams={{
          "Recently added": { orderDirection: "DESC", order: "DATE" },
          "Artists A-Z": { orderDirection: "ASC", order: "NAME" },
        }}
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/playlists`}
        type="MIXED_TYPES_LIST"
        title="My Favorite playlists"
        orderParams={{
          "Most recent": { orderDirection: "DESC", order: "DATE" },
          Alphabetical: { orderDirection: "ASC", order: "NAME" },
        }}
      />
      <PagedModule
        url={`/v2/favorites/mixes`}
        type="MIX_LIST"
        title="My Favorite mixes"
      />
    </>
  );
}
