import { DownloadButton } from "src/components/Buttons/DownloadButton";
import SyncButton from "src/components/Buttons/SyncButton";
import PagedModule from "src/components/TidalModule/PagedModule";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { ContentType, FavoritesType } from "src/types";

function FavoritesActions({
  type,
  label,
}: {
  type: ContentType;
  label: string;
}) {
  const { quality } = useConfigProvider();
  if (!quality) return;
  return (
    <>
      <DownloadButton
        id={type}
        type={type}
        label="Favorite albums"
        item={
          {
            id: type,
            title: label,
            type: type,
            quality: quality,
            url: "#",
          } as FavoritesType
        }
      />
      <SyncButton
        type={type}
        item={
          {
            id: type,
            type: type,
            title: label,
            quality: quality,
            url: "#",
          } as FavoritesType
        }
      />
    </>
  );
}

export default function MyFavorites() {
  const { tiddlConfig } = useConfigProvider();

  return (
    <>
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/albums`}
        type="USER_ALBUM_LIST"
        title="My Favorite albums"
        titleSide={
          <FavoritesActions label="Favorite albums" type="favorite_albums" />
        }
        orderParams={{
          "Recently added": { orderDirection: "DESC", order: "DATE" },
          "Recently released": {
            orderDirection: "DESC",
            order: "RELEASE_DATE",
          },
          "Artists A-Z": { orderDirection: "ASC", order: "ARTIST" },
          Alphabetical: { orderDirection: "ASC", order: "NAME" },
        }}
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/tracks`}
        type="ALBUM_ITEMS"
        title="My Favorite tracks"
        titleSide={
          <FavoritesActions label="Favorite tracks" type="favorite_tracks" />
        }
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/playlists`}
        type="MIXED_TYPES_LIST"
        title="My Favorite playlists"
        orderParams={{
          "Most recent": { orderDirection: "DESC", order: "DATE" },
          Alphabetical: { orderDirection: "ASC", order: "NAME" },
        }}
        titleSide={
          <FavoritesActions
            label="Favorite playlists"
            type="favorite_playlists"
          />
        }
      />
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/artists`}
        type="USER_ARTIST_LIST"
        title="My Favorite artists"
        orderParams={{
          "Recently added": { orderDirection: "DESC", order: "DATE" },
          "Artists A-Z": { orderDirection: "ASC", order: "NAME" },
        }}
      />
      <PagedModule
        url={`/v2/favorites/mixes`}
        type="MIX_LIST"
        title="My Favorite mixes"
      />
    </>
  );
}
