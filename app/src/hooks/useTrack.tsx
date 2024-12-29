import { useEffect, useState } from "react";

import { TIDAL_API_LISTEN_URL } from "../contants";
import { TrackType } from "../types";
import { fetchTidal } from "../utils/fetch";

type ArtistContextType = {
  loading: boolean;
  track: TrackType | undefined;
  actions: {
    queryTrack: () => void;
  };
};

export const useTrack = (id?: string): ArtistContextType => {
  const [loading, setLoading] = useState<boolean>(false);
  const [track, setTrack] = useState<TrackType>();

  async function queryTrack() {
    setLoading(true);

    const data_track = await fetchTidal<TrackType>(
      `${TIDAL_API_LISTEN_URL}/tracks/${id}`,
    );

    setTrack(data_track);
    setLoading(false);
  }

  useEffect(() => {
    if (id) {
      queryTrack();
    }
  }, [id]);

  return {
    track,
    loading,
    actions: {
      queryTrack,
    },
  };
};
