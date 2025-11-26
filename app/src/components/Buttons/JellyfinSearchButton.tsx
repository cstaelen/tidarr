import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, SvgIcon, Tooltip } from "@mui/material";
import { TIDARR_PROXY_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { getApiUrl } from "src/utils/helpers";

interface JellyfinSearchButtonProps {
  query: string;
  albumQuery: string;
  pivot?: "artists" | "albums" | "tracks" | "search";
}

interface JellyfinCounts {
  artists: number;
  albums: number;
  tracks: number;
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

        // Artists
        if (pivot === "artists") {
          const artistResponse = await fetch(
            `${apiUrl}/jellyfin/Artists/${encodeURIComponent(query)}`,
          );
          if (artistResponse.ok) {
            const artistData = await artistResponse.json();
            artistsCount = artistData.ArtistCount ?? 1; // fallback to jellyfin 10.10.7
            albumsCount = artistData.AlbumCount;
            tracksCount = artistData.SongCount;
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
  }, [config, query, pivot, isButtonActive]);

  const handleJellyfinSearch = () => {
    const jellyfinBaseUrl = config?.JELLYFIN_URL?.replace(/\/$/, "");
    if (!jellyfinBaseUrl) {
      console.error("Jellyfin URL not configured");
      return;
    }

    // Build the Jellyfin search URL
    // Jellyfin web interface uses: /web/index.html#!/search.html?query=xxx
    // There is no filter to apply to searches (shows all results)
    const searchUrl = `${jellyfinBaseUrl}/web/index.html#!/search.html?query=${encodeURIComponent(query)}`;
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
        {jellyfinCounts.tracks} track(s)
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
        <Button
          variant="outlined"
          color="info"
          endIcon={loading ? <CircularProgress size={16} /> : <JellyfinIcon />}
          onClick={handleJellyfinSearch}
          size="small"
          disabled={loading}
          sx={{
            position: "relative",
            borderColor: "transparent",
            borderWidth: 1,
            borderStyle: "solid",
            background: "transparent",
            backgroundClip: "padding-box",

            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              margin: "-1px",
              padding: "1px",
              background: "linear-gradient(45deg, #883aa2, #0093cb)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              pointerEvents: "none",
            },
            "&:hover": {
              backgroundColor: "var(--variant-outlinedBg);",
            },
            "&:hover::before": {
              background: "linear-gradient(45deg, #bb6dd4, #00B5DC)",
            },
          }}
        >
          <Box
            component="span"
            sx={{
              background: "linear-gradient(45deg, #bb6dd4, #00B5DC)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {buttonLabel}
          </Box>
        </Button>
      </span>
    </Tooltip>
  );
};
