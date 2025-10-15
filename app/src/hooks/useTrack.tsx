import { useEffect, useState } from "react";
import { useFetchTidal } from "src/hooks/useFetchTidal";

import { TrackType } from "../types";

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
  const { fetchTidal } = useFetchTidal();

  async function queryTrack() {
    setLoading(true);

    const data_track = await fetchTidal<TrackType>(`/v1/tracks/${id}`);

    setTrack(data_track);
    setLoading(false);
  }

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
