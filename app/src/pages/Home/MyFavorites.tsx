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
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/playlists`}
        type="MIXED_TYPES_LIST"
        title="My Favorite playlists"
      />
      <PagedModule
        url={`/v2/favorites/mixes`}
        type="MIX_LIST"
        title="My Favorite mixes"
      />
    </>
  );
}
