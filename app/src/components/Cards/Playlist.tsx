import { PlaylistType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import SyncButton from "../Buttons/SyncButton";

import CardSwitchDisplay from "./common/CardSwitchDisplay";

export default function Playlist({ playlist }: { playlist: PlaylistType }) {
  return (
    <CardSwitchDisplay
      id={playlist.uuid}
      title={playlist.title}
      coverUrl={`https://resources.tidal.com/images/${playlist.squareImage?.replace(/-/g, "/")}/750x750.jpg`}
      linkUrl={`/playlist/${playlist.uuid}`}
      downloadType="playlist"
      downloadLabel="Playlist"
      numberOfTracks={playlist.numberOfTracks}
      duration={playlist.duration}
      createdDate={playlist.created}
      lastUpdatedDate={playlist.lastUpdated}
      buttons={
        <>
          <SyncButton item={playlist} type="playlist" />
          <DownloadButton
            item={playlist}
            id={playlist.uuid}
            type="playlist"
            label="Playlist"
          />
        </>
      }
    />
  );
}
