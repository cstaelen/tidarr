import { ArtistType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";

import PageHeader from "./Header";

export default function ArtistHeader({ artist }: { artist: ArtistType }) {
  return (
    <PageHeader
      title={artist.name}
      url={artist.url}
      image={`https://resources.tidal.com/images/${artist.picture?.replace(
        /-/g,
        "/",
      )}/750x750.jpg`}
      beforeTitle={<>Artist(s)</>}
      afterTitle={
        <DownloadButton
          item={artist}
          id={artist.id}
          type="artist"
          label="Get all releases"
        />
      }
    />
  );
}
