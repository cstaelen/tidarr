import PagedModule from "src/components/TidalModule/PagedModule";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function MyPlaylist() {
  const { tiddlConfig } = useConfigProvider();

  return (
    <PagedModule
      url={`users/${tiddlConfig?.auth.user_id}/playlistsAndFavoritePlaylists`}
      type="USER_PLAYLIST_LIST"
      title="My Playlists"
    />
  );
}
