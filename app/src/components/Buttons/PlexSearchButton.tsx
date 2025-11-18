import { useEffect, useState } from "react";
import { Button, CircularProgress, SvgIcon, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

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

  useEffect(() => {
    if (!config?.PLEX_URL || !config?.PLEX_TOKEN || !query) {
      return;
    }

    const fetchPlexResults = async () => {
      setLoading(true);
      try {
        const plexBaseUrl = config.PLEX_URL?.replace(/\/$/, "");

        // Map pivot to Plex search type parameter
        // Type codes: 8=Artist, 9=Album, 10=Track
        const typeMap: Record<string, string> = {
          artists: "8",
          albums: "9",
          tracks: "10",
        };

        // Fetch all three types in parallel
        const fetchCount = async (type: string) => {
          const url = `${plexBaseUrl}/search?type=${type}&query=${encodeURIComponent(query)}&X-Plex-Token=${config.PLEX_TOKEN}`;
          const response = await fetch(url);
          if (!response.ok) return 0;
          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const mediaContainer = xmlDoc.querySelector("MediaContainer");
          const size = mediaContainer?.getAttribute("size");
          return size ? parseInt(size, 10) : 0;
        };

        const [artistsCount, albumsCount, tracksCount] = await Promise.all([
          fetchCount("8"), // Artists
          fetchCount("9"), // Albums
          fetchCount("10"), // Tracks
        ]);

        setPlexCounts({
          artists: artistsCount,
          albums: albumsCount,
          tracks: tracksCount,
        });

        // Set the count for the current pivot
        const typeParam = typeMap[pivot] || "";
        if (typeParam) {
          const currentCount = await fetchCount(typeParam);
          setResultCount(currentCount);
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
  }, [config?.PLEX_URL, config?.PLEX_TOKEN, query, pivot]);

  if (!config?.PLEX_URL || !config?.PLEX_SEARCH_LINK) {
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
        {plexCounts.artists} artist(s) - {plexCounts.albums} album(s) -
        {plexCounts.tracks} tracks
      </div>
    </>
  ) : (
    "Search in Plex"
  );

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
