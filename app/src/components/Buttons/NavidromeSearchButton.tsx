import { useEffect, useState } from "react";
import { Button, CircularProgress, SvgIcon, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

interface NavidromeSearchButtonProps {
  query: string;
  pivot?: "artists" | "albums" | "tracks" | "search";
}

interface NavidromeCounts {
  artists: number;
  albums: number;
  tracks: number;
}

// Navidrome icon (music note with wave)
const NavidromeIcon = () => (
  <SvgIcon viewBox="0 0 24 24">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </SvgIcon>
);

export const NavidromeSearchButton = ({
  query,
  pivot = "search",
}: NavidromeSearchButtonProps) => {
  const { config } = useConfigProvider();
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [navidromeCounts, setNavidromeCounts] =
    useState<NavidromeCounts | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config?.NAVIDROME_URL || !query) {
      return;
    }

    // Skip fetch if we don't have credentials
    if (!config?.NAVIDROME_USER || !config?.NAVIDROME_PASSWORD) {
      return;
    }

    const fetchNavidromeResults = async () => {
      setLoading(true);
      try {
        // const navidromeBaseUrl = config.NAVIDROME_URL?.replace(/\/$/, "");
        const navidromeBaseUrl = "http://navidrome.nas.docker";

        // Navidrome uses Subsonic API with search3 endpoint
        // Using simple username + password authentication
        const searchUrl = `${navidromeBaseUrl}/rest/search3?query=${encodeURIComponent(query)}&u=${config.NAVIDROME_USER}&p=${config.NAVIDROME_PASSWORD}&v=1.16.1&c=tidarr&f=json`;

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
  }, [
    config?.NAVIDROME_URL,
    config?.NAVIDROME_USER,
    config?.NAVIDROME_PASSWORD,
    query,
    pivot,
  ]);

  // if (!config?.NAVIDROME_URL || !config?.NAVIDROME_SEARCH_LINK) {
  //   return null;
  // }

  const handleNavidromeSearch = () => {
    // const navidromeBaseUrl = config.NAVIDROME_URL?.replace(/\/$/, "");
    const navidromeBaseUrl = "http://navidrome.nas.docker";

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
  };

  const buttonLabel = loading
    ? "Searching..."
    : resultCount !== null
      ? `Search on Navidrome (${resultCount})`
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

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <Button
          variant="outlined"
          color="success"
          endIcon={loading ? <CircularProgress size={16} /> : <NavidromeIcon />}
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
