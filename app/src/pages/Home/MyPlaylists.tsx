import { useEffect, useState } from "react";
import { Box, Container } from "@mui/material";
import Module from "src/components/TidalModule/Module";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useFetchTidal } from "src/hooks/useFetchTidal";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { PlaylistType, TidalPagedListType } from "src/types";

export default function MyPlaylists() {
  const [data, setData] = useState<TidalPagedListType<PlaylistType>>();
  const { tiddlConfig } = useConfigProvider();
  const { fetchTidal, loading } = useFetchTidal();

  async function queryPlaylists() {
    const response = await fetchTidal<TidalPagedListType<PlaylistType>>(
      `/users/${tiddlConfig?.auth.user_id}/playlistsAndFavoritePlaylists`,
    );
    setData(response);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    queryPlaylists();
  }, []);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        <ModuleTitle title="My Playlists" total={data?.totalNumberOfItems} />
        <Module type="PLAYLIST_LIST" data={data?.items} loading={loading} />
      </Container>
    </Box>
  );
}
