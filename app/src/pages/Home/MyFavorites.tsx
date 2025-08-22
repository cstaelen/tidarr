import PagedModule from "src/components/TidalModule/PagedModule";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function MyFavorites() {
  const { tiddlConfig } = useConfigProvider();

  return (
    <>
      <PagedModule
        url={`users/${tiddlConfig?.auth.user_id}/favorites/albums`}
        type="USER_ALBUM_LIST"
        title="My Favorite albums"
      />
      <PagedModule
        url={`users/${tiddlConfig?.auth.user_id}/favorites/tracks`}
        type="ALBUM_ITEMS"
        title="My Favorite tracks"
      />
      <PagedModule
        url={`users/${tiddlConfig?.auth.user_id}/favorites/artists`}
        type="USER_ARTIST_LIST"
        title="My Favorite artists"
      />
      <PagedModule
        url={`users/${tiddlConfig?.auth.user_id}/favorites/playlists`}
        type="PLAYLIST_LIST"
        title="My Favorite playlists"
      />
      <PagedModule
        url={`favorites/mixes`}
        type="MIXED_TYPES_LIST"
        title="My Favorite mixes"
      />
    </>
  );
}
