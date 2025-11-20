import { useCallback, useEffect, useState } from "react";
import { Album } from "@mui/icons-material";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import { TIDARR_PROXY_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { getApiUrl } from "src/utils/helpers";

interface NavidromeSearchButtonProps {
  query: string;
  pivot?: "artists" | "albums" | "tracks" | "search";
}

interface NavidromeCounts {
  artists: number;
  albums: number;
  tracks: number;
}

export const NavidromeSearchButton = ({
  query,
  pivot = "search",
}: NavidromeSearchButtonProps) => {
  const { config } = useConfigProvider();
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [navidromeCounts, setNavidromeCounts] =
    useState<NavidromeCounts | null>(null);
  const [loading, setLoading] = useState(false);

  const isButtonActive: () => boolean = useCallback(
    () =>
      !!(
        config?.NAVIDROME_USER &&
        config?.NAVIDROME_PASSWORD &&
        config?.NAVIDROME_URL &&
        query
      ),
    [
      config?.NAVIDROME_PASSWORD,
      config?.NAVIDROME_URL,
      config?.NAVIDROME_USER,
      query,
    ],
  );

  useEffect(() => {
    if (!isButtonActive() || !config) {
      return;
    }

    const fetchNavidromeResults = async () => {
      setLoading(true);
      try {
        // Use proxy to avoid CORS
        const apiUrl = getApiUrl(TIDARR_PROXY_URL);
        const searchUrl = `${apiUrl}/navidrome/rest/search3?query=${encodeURIComponent(query)}`;

        const response = await fetch(searchUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch Navidrome search results");
        }

        const data = await response.json();
        const searchResult = data["subsonic-response"]?.searchResult3;

        if (!searchResult) {
          setResultCount(0);
          setNavidromeCounts({ artists: 0, albums: 0, tracks: 0 });
          return;
        }

        const artistsCount = searchResult.artist?.length || 0;
        const albumsCount = searchResult.album?.length || 0;
        const tracksCount = searchResult.song?.length || 0;

        setNavidromeCounts({
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
        console.error("Error fetching Navidrome search results:", error);
        setResultCount(null);
        setNavidromeCounts(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNavidromeResults();
  }, [config, query, pivot, isButtonActive]);

  const handleNavidromeSearch = async () => {
    const navidromeBaseUrl = config?.NAVIDROME_URL?.replace(/\/$/, "");

    if (!navidromeBaseUrl) {
      console.error("Navidrome URL not configured");
      return;
    }

    // Authenticate with Navidrome using proxy
    try {
      await fetch("/navidrome-proxy/rest/ping", { credentials: "include" });

      // Build the Navidrome search URL based on pivot type
      // Format: http://navidrome.url/app/#/artist?filter={"role":"albumartist","name":"query"}
      let searchUrl = `${navidromeBaseUrl}/app/#`;

      if (pivot === "artists") {
        const filter = JSON.stringify({ role: "albumartist", name: query });
        searchUrl += `/artist?displayedFilters=%7B%7D&filter=${encodeURIComponent(filter)}&order=ASC&page=1&perPage=15&sort=name`;
      } else if (pivot === "albums") {
        const filter = JSON.stringify({ name: query });
        searchUrl += `/album?displayedFilters=%7B%7D&filter=${encodeURIComponent(filter)}&order=ASC&page=1&perPage=15&sort=name`;
      } else if (pivot === "tracks") {
        const filter = JSON.stringify({ title: query });
        searchUrl += `/song?displayedFilters=%7B%7D&filter=${encodeURIComponent(filter)}&order=ASC&page=1&perPage=15&sort=title`;
      } else {
        // General search - use global search page
        searchUrl += `/search?q=${encodeURIComponent(query)}`;
      }

      window.open(searchUrl, "navidrome-search");
    } catch (error) {
      console.error("Failed to authenticate with Navidrome:", error);
    }
  };

  const buttonLabel = loading
    ? "Searching..."
    : resultCount !== null
      ? `Navidrome (${resultCount})`
      : "Search on Navidrome";

  const tooltipTitle = navidromeCounts ? (
    <>
      <div>Navidrome results for &quot;{query}&quot;:</div>
      <div>
        {navidromeCounts.artists} artist(s) - {navidromeCounts.albums} album(s)
        - {navidromeCounts.tracks} track(s)
      </div>
    </>
  ) : (
    "Search in Navidrome"
  );

  if (!isButtonActive()) {
    return;
  }

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <Button
          variant="outlined"
          color="info"
          endIcon={loading ? <CircularProgress size={16} /> : <Album />}
          onClick={handleNavidromeSearch}
          size="small"
          disabled={loading}
        >
          {buttonLabel}
        </Button>
      </span>
    </Tooltip>
  );
};
