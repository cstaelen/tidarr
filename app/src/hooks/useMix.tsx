import { useState } from "react";

import { TIDAL_API_LISTEN_URL } from "../contants";
import { MixType, TidalModuleResponseType, TrackType } from "../types";
import { fetchTidal } from "../utils/fetch";

type ArtistContextType = {
  loading: boolean;
  mix: MixReponseType | undefined;
  actions: {
    queryMix: (id: string) => void;
  };
};

type MixReponseType = {
  info: MixType;
  items: TrackType[];
  totalNumberOfItems: number;
};

export const useMix = (): ArtistContextType => {
  const [loading, setLoading] = useState<boolean>(false);
  const [mix, setMix] = useState<MixReponseType>();

  async function queryMix(id: string) {
    setLoading(true);

    const data_mix = await fetchTidal<TidalModuleResponseType<TrackType>>(
      `${TIDAL_API_LISTEN_URL}/pages/mix?mixId=${id}`,
    );

    setLoading(false);

    const mix = data_mix?.rows[0].modules[0].mix;
    const items = data_mix?.rows[1].modules[0].pagedList.items;

    if (!mix || !items) return;

    setMix({
      info: {
        ...mix,
        url: `https://tidal.com/mix/${data_mix?.rows[0].modules[0].mix?.id}`,
      },
      items: items,
      totalNumberOfItems: 1,
    });
  }

  return {
    mix,
    loading,
    actions: {
      queryMix,
    },
  };
};
