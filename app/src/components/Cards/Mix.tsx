import { MixType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import SyncButton from "../Buttons/SyncButton";

import CardSwitchDisplay from "./common/CardSwitchDisplay";

export default function Mix({ mix }: { mix: MixType }) {
  return (
    <CardSwitchDisplay
      id={mix.id}
      title={mix.title}
      coverUrl={mix.images.SMALL.url}
      linkUrl={`/mix/${mix.id}`}
      downloadType="mix"
      downloadLabel="Mix"
      subtitle={mix.subTitle}
      buttons={
        <>
          <SyncButton item={mix} type="mix" />
          <DownloadButton item={mix} id={mix.id} type="mix" label="Get mix" />
        </>
      }
    />
  );
}
