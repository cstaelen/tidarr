import { useState } from "react";
import { useFetchTidal } from "src/hooks/useFetchTidal";

import { MixType, TidalModuleResponseType, TrackType } from "../types";

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

  const { fetchTidal } = useFetchTidal();

  async function queryMix(id: string) {
    setLoading(true);

    const data_mix = await fetchTidal<TidalModuleResponseType<TrackType>>(
      `/v1/pages/mix?mixId=${id}`,
    );

    setLoading(false);

    const mix = data_mix?.rows[0].modules[0].mix;
    const items = data_mix?.rows[1].modules[0].pagedList.items;
    const total = data_mix?.rows[1].modules[0].pagedList.totalNumberOfItems;

    if (!mix || !items) return;

    setMix({
      info: {
        ...mix,
        url: `https://tidal.com/mix/${data_mix?.rows[0].modules[0].mix?.id}`,
      },
      items: items,
      totalNumberOfItems: total || 0,
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
