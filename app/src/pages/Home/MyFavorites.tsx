import { DownloadButton } from "src/components/Buttons/DownloadButton";
import SyncButton from "src/components/Buttons/SyncButton";
import PagedModule from "src/components/TidalModule/PagedModule";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { FavoritesType } from "src/types";

export default function MyFavorites() {
  const { tiddlConfig } = useConfigProvider();
  const { quality } = useConfigProvider();

  return (
    <>
      <PagedModule
        url={`/v1/users/${tiddlConfig?.auth.user_id}/favorites/albums`}
        type="USER_ALBUM_LIST"
        title="My Favorite albums"
        titleSide={
          quality && (
            <>
              <DownloadButton
                id="favorite_albums"
                type="favorite_albums"
                label="Favorite albums"
                item={
                  {
                    id: "favorite_albums",
                    title: "Favorite albums",
                    type: "favorite_albums",
                    quality: quality,
                    url: "#",
                  } as FavoritesType
                }
              />
              <SyncButton
                type="favorite_albums"
                item={
                  {
                    id: "favorite_albums",
                    type: "favorite_albums",
                    title: "Favorite albums",
                    quality: quality,
                    url: "#",
                  } as FavoritesType
                }
              />
            </>
          )
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
          quality && (
            <>
              <DownloadButton
                label="Favorite tracks"
                id="favorite_tracks"
                type="favorite_tracks"
                item={
                  {
                    id: "favorite_tracks",
                    type: "favorite_tracks",
                    title: "Favorite tracks",
                    quality: quality,
                    url: "#",
                  } as FavoritesType
                }
              />
              <SyncButton
                type="favorite_tracks"
                item={
                  {
                    id: "favorite_tracks",
                    title: "Favorite tracks",
                    type: "favorite_tracks",
                    quality: quality,
                    url: "#",
                  } as FavoritesType
                }
              />
            </>
          )
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
          quality && (
            <>
              <DownloadButton
                id="favorite_playlists"
                type="favorite_playlists"
                label="Favorite playlists"
                item={
                  {
                    id: "favorite_playlists",
                    title: "Favorite playlists",
                    type: "favorite_playlists",
                    quality: quality,
                    url: "#",
                  } as FavoritesType
                }
              />
              <SyncButton
                type="favorite_playlists"
                item={
                  {
                    id: "favorite_playlists",
                    title: "Favorite playlists",
                    type: "favorite_playlists",
                    quality: quality,
                    url: "#",
                  } as FavoritesType
                }
              />
            </>
          )
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
