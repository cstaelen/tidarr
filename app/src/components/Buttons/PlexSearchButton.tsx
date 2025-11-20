import { useCallback, useEffect, useState } from "react";
import { Button, CircularProgress, SvgIcon, Tooltip } from "@mui/material";
import { TIDARR_PROXY_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { getApiUrl } from "src/utils/helpers";

interface PlexSearchButtonProps {
  query: string;
  pivot?: "artists" | "albums" | "tracks" | "search";
}

interface PlexCounts {
  artists: number;
  albums: number;
  tracks: number;
}

const PlexIcon = () => (
  <SvgIcon viewBox="0 0 24 24">
    <path d="M11.643 0H4.68l7.679 12L4.68 24h6.963l7.677-12-7.677-12" />
  </SvgIcon>
);

export const PlexSearchButton = ({
  query,
  pivot = "search",
}: PlexSearchButtonProps) => {
  const { config } = useConfigProvider();
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [plexCounts, setPlexCounts] = useState<PlexCounts | null>(null);
  const [loading, setLoading] = useState(false);

  const isButtonActive: () => boolean = useCallback(
    () => !!(config?.PLEX_URL && config?.PLEX_TOKEN && !!query),
    [config?.PLEX_URL, config?.PLEX_TOKEN, query],
  );

  useEffect(() => {
    if (!isButtonActive() || !config) {
      return;
    }

    const fetchPlexResults = async () => {
      setLoading(true);
      try {
        // Use proxy to avoid CORS
        // Fetch without type - returns Directory elements (artists/albums) but NOT tracks
        const apiUrl = getApiUrl(TIDARR_PROXY_URL);
        const url = `${apiUrl}/plex/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch Plex search results");
        }

        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Count Directory elements by type attribute
        let artistsCount = 0;
        let albumsCount = 0;

        const directories = xmlDoc.querySelectorAll("Directory");
        directories.forEach((dir) => {
          const type = dir.getAttribute("type");
          if (type === "artist") {
            artistsCount++;
          } else if (type === "album") {
            albumsCount++;
          }
        });

        // Only fetch tracks if needed (when pivot is tracks or search)
        let tracksCount = 0;
        if (pivot === "tracks" || pivot === "search") {
          const trackUrl = `${TIDARR_PROXY_URL}/plex/search?query=${encodeURIComponent(query)}&type=10`;
          const trackResponse = await fetch(trackUrl);

          if (trackResponse.ok) {
            const trackXmlText = await trackResponse.text();
            const trackXmlDoc = parser.parseFromString(
              trackXmlText,
              "text/xml",
            );
            const mediaContainer = trackXmlDoc.querySelector("MediaContainer");
            const size = mediaContainer?.getAttribute("size");
            tracksCount = size ? parseInt(size, 10) : 0;
          }
        }

        setPlexCounts({
          artists: artistsCount,
          albums: albumsCount,
          tracks: tracksCount,
        });

        // Set the count for the current pivot
        if (pivot === "artists") {
          setResultCount(artistsCount);
        } else if (pivot === "albums") {
          setResultCount(albumsCount);
        } else if (pivot === "tracks") {
          setResultCount(tracksCount);
        } else {
          // For general search, sum all counts
          setResultCount(artistsCount + albumsCount + tracksCount);
        }
      } catch (error) {
        console.error("Error fetching Plex search results:", error);
        setResultCount(null);
        setPlexCounts(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlexResults();
  }, [config, query, pivot, isButtonActive]);

  if (!isButtonActive() || !config) {
    return null;
  }

  const handlePlexSearch = () => {
    const plexBaseUrl = config.PLEX_URL?.replace(/\/$/, "");

    // Build the Plex search URL with pivot parameter
    // Format: https://app.plex.tv/desktop/#!/search?query=<query>&pivot=<pivot>
    const searchUrl = `${plexBaseUrl}/web/index.html#!/search?query=${encodeURIComponent(query)}&pivot=${pivot}`;

    window.open(searchUrl, "plex-search");
  };

  const buttonLabel = loading
    ? "Searching..."
    : resultCount !== null
      ? `Search on Plex (${resultCount})`
      : "Search on Plex";

  const tooltipTitle = plexCounts ? (
    <>
      <div>Plex results for &quot;{query}&quot;:</div>
      <div>
        {plexCounts.artists} artist(s) - {plexCounts.albums} album(s) - {` `}
        {plexCounts.tracks} tracks
      </div>
    </>
  ) : (
    "Search in Plex"
  );

  if (!isButtonActive()) {
    return;
  }

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <Button
          variant="outlined"
          color="warning"
          endIcon={loading ? <CircularProgress size={16} /> : <PlexIcon />}
          onClick={handlePlexSearch}
          size="small"
          disabled={loading}
        >
          {buttonLabel}
        </Button>
      </span>
    </Tooltip>
  );
};
