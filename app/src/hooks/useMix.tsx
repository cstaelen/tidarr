import { useState } from "react";

import { TIDAL_API_LISTEN_URL } from "../contants";
import { MixResponseType, TidalMixResponseType } from "../types";
import { fetchTidal } from "../utils/fetch";

type ArtistContextType = {
  loading: boolean;
  mix: MixResponseType | undefined;
  actions: {
    queryMix: (id: string) => void;
  };
};

export const useMix = (): ArtistContextType => {
  const [loading, setLoading] = useState<boolean>(false);
  const [mix, setMix] = useState<MixResponseType>();

  async function queryMix(id: string) {
    setLoading(true);

    const data_mix = await fetchTidal<TidalMixResponseType>(
      `${TIDAL_API_LISTEN_URL}/pages/mix?mixId=${id}`,
    );

    setLoading(false);

    setMix({
      info: {
        ...data_mix?.rows[0].modules[0].mix,
        url: `https://tidal.com/mix/${data_mix?.rows[0].modules[0].mix.id}`,
      },
      items: data_mix?.rows[1].modules[0].pagedList.items,
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
