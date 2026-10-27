export const TIDAL_ITEMS_PER_PAGE = 18;
export const TIDAL_ALBUM_URL = "http://www.tidal.com/album/";
export const TIDAL_MIX_URL = "http://www.tidal.com/mix/";
export const TIDAL_VIDEO_URL = "http://www.tidal.com/browse/video";

export const TIDARR_REPO_URL = "cstaelen/tidarr";
// The server rewrites <base href> in index.html with URL_BASE at runtime
export const BASE_PATH = new URL(document.baseURI).pathname.replace(/\/$/, "");
export const TIDARR_API_URL = `${BASE_PATH}/api`;
export const TIDARR_PROXY_URL = `${BASE_PATH}/proxy`;

export const LOCALSTORAGE_TOKEN_KEY = "tidarr-token";
export const LOCALSTORAGE_REDIRECT_URL = "tidarr-redirect";
export const LOCALSTORAGE_LAST_SEEN_VERSION = "tidarr-last-seen-version";
export const LOCALSTORAGE_DISPLAY_MODE = "tidarr-display-mode";
