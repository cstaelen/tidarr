import { Alert, AlertTitle } from "@mui/material";
import { ArtistType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";

import PageHeader from "./Header";

export default function ArtistHeader({ artist }: { artist: ArtistType }) {
  return (
    <>
      <PageHeader
        title={artist.name}
        url={artist.url}
        image={`https://resources.tidal.com/images/${artist.picture?.replace(
          /-/g,
          "/",
        )}/750x750.jpg`}
        afterTitle={
          <DownloadButton
            item={artist}
            id={artist.id}
            type="artist"
            label="Get all releases"
          />
        }
        subtitle="Artist(s)"
      />
      <Alert color="info" sx={{ my: 2 }}>
        <AlertTitle>"Get all releases" button.</AlertTitle>
        By default, Singles and EP's are not concerned by the "Get all releases"
        button.
        <br />
        To include them, please update "singles_filter" parameter in your
        "tiddl.json" file.
        <br />
        <a
          href="https://github.com/cstaelen/tidarr?tab=readme-ov-file#download-settings-optional"
          target="_blank"
        >
          More details
        </a>
        .
      </Alert>
    </>
  );
}
