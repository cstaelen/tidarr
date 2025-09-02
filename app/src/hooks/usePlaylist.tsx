import { useEffect, useState } from "react";
import { useFetchTidal } from "src/hooks/useFetchTidal";

import { TIDAL_ITEMS_PER_PAGE } from "../contants";
import { PlaylistType, TidalPagedListType, TrackType } from "../types";

type PlaylistContextType = {
  loading: boolean;
  playlist: PlaylistType | undefined;
  tracks: TrackType[] | undefined;
  page: number;
  total: number;
  actions: {
    queryPlaylist: () => void;
    setPage: (page: number) => void;
  };
};

export const usePlaylist = (id: string | undefined): PlaylistContextType => {
  const [loading, setLoading] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<PlaylistType>();
  const [tracks, setTracks] = useState<TrackType[]>();
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);

  const { fetchTidal } = useFetchTidal();

  async function queryPlaylist() {
    setLoading(true);

    const data_playlist = await fetchTidal<PlaylistType>(`/v1/playlists/${id}`);

    setPlaylist(data_playlist);

    const data_tracks = await fetchTidal<
      TidalPagedListType<{ item: TrackType }>
    >(
      `/v1/playlists/${id}/items?limit=${TIDAL_ITEMS_PER_PAGE}&offset=${
        (page - 1) * TIDAL_ITEMS_PER_PAGE
      }`,
    );

    if (data_tracks) {
      setTracks([
        ...(tracks || ([] as TrackType[])),
        ...data_tracks.items.map((playlist) => playlist.item),
      ]);
      setTotal(data_tracks.totalNumberOfItems);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (id) queryPlaylist();
  }, [id, page]);

  return {
    playlist,
    tracks,
    total,
    page,
    loading,
    actions: {
      queryPlaylist,
      setPage,
    },
  };
};
