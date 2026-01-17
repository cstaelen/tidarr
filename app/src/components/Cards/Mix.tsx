import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { MixType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import SyncButton from "../Buttons/SyncButton";

import CardSwitchDisplay from "./common/CardSwitchDisplay";

export default function Mix({ mix }: { mix: MixType }) {
  const isVideoMix = mix.mixType === "VIDEO_DAILY_MIX";
  const navigate = useNavigate();
  const url = `/mix/${mix.id}`;

  return (
    <CardSwitchDisplay
      id={mix.id}
      title={mix.title}
      coverUrl={mix.images.SMALL.url}
      linkUrl={url}
      downloadType="mix"
      downloadLabel="Mix"
      subtitle={mix.subTitle}
      buttons={
        !isVideoMix ? (
          <>
            <SyncButton item={mix} type="mix" />
            <DownloadButton item={mix} id={mix.id} type="mix" label="Get mix" />
          </>
        ) : (
          <Button variant="outlined" onClick={() => navigate(url)}>
            See videos
          </Button>
        )
      }
    />
  );
}
