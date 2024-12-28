import { ArtistType } from "src/types";

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
    />
  );
}
