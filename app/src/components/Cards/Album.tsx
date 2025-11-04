import { AlbumType } from "../../types";
import { DownloadButton } from "../Buttons/DownloadButton";

import CardSwitchDisplay from "./common/CardSwitchDisplay";

export default function AlbumCard({ album }: { album: AlbumType }) {
  return (
    <CardSwitchDisplay
      id={album.id}
      title={album.title}
      coverUrl={`https://resources.tidal.com/images/${album.cover?.replace(/-/g, "/")}/750x750.jpg`}
      linkUrl={`/album/${album.id}`}
      downloadType="album"
      downloadLabel="Album"
      numberOfTracks={album.numberOfTracks}
      duration={album.duration}
      releaseDate={album.releaseDate}
      artist={album.artists[0]}
      buttons={
        <DownloadButton
          item={album}
          id={album.id}
          type="album"
          label="Get album"
        />
      }
    />
  );
}
