import { LOCALSTORAGE_TOKEN_KEY } from "src/contants";

/**
 * Get JWT token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
}

/**
 * Add Authorization header to request options if token exists
 */
export function withAuthHeader(options: RequestInit = {}): RequestInit {
  const token = getAuthToken();
  if (!token) return options;

  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

/**
 * Handle 403 response - clear token and reload page
 * Returns true if 403 was handled
 */
export function handleForbidden(response: Response): boolean {
  if (response.status !== 403) return false;

  console.error("[AUTH] 403 - JWT invalid, logging out");
  if (getAuthToken()) {
    localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
    window.location.reload();
  }
  return true;
}
