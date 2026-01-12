export const ROOT_PATH = "/tidarr";
export const CONFIG_PATH = "/shared";
export const PROCESSING_PATH = "/shared/.processing";
export const TIDAL_API_URL = "https://api.tidal.com";
export const SYNC_DEFAULT_CRON = "0 3 * * *";
export const TOKEN_REFRESH_THRESHOLD = 25 * 60; // Refresh token if expires in less than 30 minutes (1800 seconds)
export const TOKEN_CHECK_INTERVAL = TOKEN_REFRESH_THRESHOLD * 1000; // Check token expiry every 30 minutes (1800000ms)
