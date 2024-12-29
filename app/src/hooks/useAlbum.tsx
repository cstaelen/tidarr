import { useEffect, useState } from "react";

import { TIDAL_API_LISTEN_URL } from "../contants";
import { AlbumType, TidalModuleResponseType, TrackType } from "../types";
import { fetchTidal } from "../utils/fetch";

type AlbumContextType = {
  loading: boolean;
  album: AlbumType | undefined;
  tracks: TrackType[] | undefined;
  actions: {
    queryAlbum: () => void;
  };
};

export const useAlbum = (id: string | undefined): AlbumContextType => {
  const [loading, setLoading] = useState<boolean>(false);
  const [album, setAlbum] = useState<AlbumType>();
  const [tracks, setTracks] = useState<TrackType[]>();

  async function queryAlbum() {
    setLoading(true);

    const data_album = await fetchTidal<
      TidalModuleResponseType<{ item: TrackType }>
    >(`${TIDAL_API_LISTEN_URL}/pages/album?albumId=${id}`);

    setAlbum(data_album.rows[0].modules[0].album);

    const data_tracks = data_album.rows[1].modules[0].pagedList.items.map(
      (track) => track.item,
    );

    setTracks(data_tracks);
    setLoading(false);
  }

  useEffect(() => {
    if (id) queryAlbum();
  }, [id]);

  return {
    album,
    tracks,
    loading,
    actions: {
      queryAlbum,
    },
  };
};
