import { useCallback, useEffect, useState } from "react";
import { SvgIcon, Tooltip } from "@mui/material";
import { TIDARR_PROXY_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { getApiUrl } from "src/utils/helpers";

import ButtonGradient from "./ButtonGradient";

interface JellyfinSearchButtonProps {
  query: string;
  albumQuery: string;
  pivot?: "artists" | "albums" | "tracks" | "search";
}

interface JellyfinCounts {
  artists: number;
  albums: number;
  tracks: number;
  videos: number;
}

const JellyfinIcon = () => (
  <SvgIcon viewBox="0 0 0.72 0.72">
    <path d="m 0.35999765,0.06035401 v 4.877e-5 c -0.0792562,0 -0.33454988,0.46282844 -0.29564596,0.54096091 0.03895387,0.0781324 0.5528363,0.0772585 0.5913407,0 C 0.69419683,0.52413009 0.4393287,0.06035401 0.35999765,0.06035401 Z m 9.755e-5,0.11875584 c 0.0519634,0 0.21896099,0.30377306 0.19371589,0.35446303 h -4.877e-5 c -0.0251702,0.05064 -0.36188822,0.0511893 -0.38738302,0 C 0.1408595,0.48235848 0.3080818,0.17910985 0.3600952,0.17910985 Z m -9.755e-5,0.11090382 c -0.0263189,0 -0.11101071,0.15357944 -0.098126,0.17952371 0.0129347,0.0259692 0.18346711,0.0256446 0.19625195,0 0.0127599,-0.0256446 -0.0717572,-0.17952371 -0.098126,-0.17952371 z" />
  </SvgIcon>
);

export const JellyfinSearchButton = ({
  query,
  albumQuery,
  pivot = "search",
}: JellyfinSearchButtonProps) => {
  const { config } = useConfigProvider();
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [jellyfinCounts, setJellyfinCounts] = useState<JellyfinCounts | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  const isButtonActive: () => boolean = useCallback(
    () => !!(config?.JELLYFIN_URL && config?.JELLYFIN_API_KEY && query),
    [config?.JELLYFIN_URL, config?.JELLYFIN_API_KEY, query],
  );

  useEffect(() => {
    if (!isButtonActive() || !config) return;

    const fetchJellyfinResults = async () => {
      setLoading(true);
      try {
        // Use proxy to avoid CORS
        const apiUrl = getApiUrl(TIDARR_PROXY_URL);

        let artistsCount = 0;
        let albumsCount = 0;
        let tracksCount = 0;
        let videosCount = 0;

        // Artists
        if (pivot === "artists") {
          // Normalize: replace any '/' with a space
          const safeQuery = query.replaceAll("/", " ");

          const artistResponse = await fetch(
            `${apiUrl}/jellyfin/Artists/${encodeURIComponent(safeQuery)}`,
          );
          if (artistResponse.ok) {
            const artistData = await artistResponse.json();
            albumsCount = artistData.AlbumCount;
            tracksCount = artistData.SongCount;
            videosCount = artistData.MusicVideoCount;
            if (tracksCount > 0 || videosCount > 0) {
              // Jellyfin <10.11 does not expose ArtistCount
              // Jellyfin 10.11.x exposes ArtistCount but always returns 0
              // Assume at least 1 artist when tracks/videos exist (compatibility fallback)
              artistsCount = 1;
            }
          }
        }

        // Albums
        if (pivot === "albums") {
          const albumResponse = await fetch(
            `${apiUrl}/jellyfin/Search/Hints?searchTerm=${encodeURIComponent(query)}&includeItemTypes=MusicAlbum`,
          );
          if (albumResponse.ok) {
            const albumData = await albumResponse.json();
            const albumHint = Array.isArray(albumData.SearchHints)
              ? albumData.SearchHints[0]
              : null;
            if (albumHint?.ItemId) {
              albumsCount = albumData.TotalRecordCount;
              const itemsResponse = await fetch(
                `${apiUrl}/jellyfin/Items?parentId=${encodeURIComponent(albumHint.ItemId)}&includeItemTypes=Audio&limit=0`,
              );
              if (itemsResponse.ok) {
                const trackData = await itemsResponse.json();
                tracksCount = trackData.TotalRecordCount;
              }
            }
          }
        }

        // Tracks
        if (pivot === "tracks") {
          // first locate the album
          const albumResponse = await fetch(
            `${apiUrl}/jellyfin/Search/Hints?searchTerm=${encodeURIComponent(albumQuery)}&includeItemTypes=MusicAlbum`,
          );
          if (albumResponse.ok) {
            const albumData = await albumResponse.json();
            const albumHint = Array.isArray(albumData.SearchHints)
              ? albumData.SearchHints[0]
              : null;
            if (albumHint?.ItemId) {
              setParentId(albumHint.ItemId);
              // after search track into album
              const trackResponse = await fetch(
                `${apiUrl}/jellyfin/Search/Hints?searchTerm=${encodeURIComponent(query)}&parentId=${encodeURIComponent(albumHint.ItemId)}&includeItemTypes=Audio`,
              );
              if (trackResponse.ok) {
                const trackData = await trackResponse.json();
                tracksCount = trackData.TotalRecordCount;
              }
            }
          }
        }

        setJellyfinCounts({
          artists: artistsCount,
          albums: albumsCount,
          tracks: tracksCount,
          videos: videosCount,
        });

        // Set the count for the current pivot
        if (pivot === "artists") {
          setResultCount(artistsCount);
        } else if (pivot === "albums") {
          setResultCount(albumsCount);
        } else if (pivot === "tracks") {
          setResultCount(tracksCount);
        } else {
          // For general search, sum all counts (counts = 1 always)
          setResultCount(artistsCount + albumsCount + tracksCount);
        }
      } catch (error) {
        console.error("Error fetching Jellyfin search results:", error);
        setResultCount(null);
        setJellyfinCounts(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJellyfinResults();
  }, [config, query, pivot, isButtonActive, albumQuery]);

  const handleJellyfinSearch = () => {
    const jellyfinBaseUrl = config?.JELLYFIN_URL?.replace(/\/$/, "");
    if (!jellyfinBaseUrl) {
      console.error("Jellyfin URL not configured");
      return;
    }

    let searchUrl: string;

    // Build the Jellyfin search URL
    // Jellyfin web interface uses: /web/#/search.html?collectionType=music&query=xxx
    if (pivot === "tracks" && parentId) {
      // Search within the specific album to avoid matches with other albums
      searchUrl = `${jellyfinBaseUrl}/web/#/search.html?collectionType=music&query=${encodeURIComponent(query)}&parentId=${encodeURIComponent(parentId)}`;
    } else {
      // Generic search
      searchUrl = `${jellyfinBaseUrl}/web/#/search.html?collectionType=music&query=${encodeURIComponent(query)}`;
    }
    window.open(searchUrl, "jellyfin-search");
  };

  const buttonLabel = loading
    ? "Searching..."
    : resultCount !== null
      ? `Jellyfin (${resultCount})`
      : "Search on Jellyfin";

  const tooltipTitle = jellyfinCounts ? (
    <>
      <div>Jellyfin results for &quot;{query}&quot;:</div>
      <div>
        {jellyfinCounts.artists} artist(s) - {jellyfinCounts.albums} album(s) -{" "}
        {jellyfinCounts.tracks} track(s) - {jellyfinCounts.videos} video(s)
      </div>
    </>
  ) : (
    "Search in Jellyfin"
  );

  if (!isButtonActive()) {
    return;
  }

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <ButtonGradient
          onClick={handleJellyfinSearch}
          loading={loading}
          disabled={loading}
          endIcon={<JellyfinIcon />}
          color="info"
          gradientFrom="#883aa2"
          gradientTo="#0093cb"
        >
          {buttonLabel}
        </ButtonGradient>
      </span>
    </Tooltip>
  );
};
