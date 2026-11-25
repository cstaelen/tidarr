import { LOCALSTORAGE_TOKEN_KEY } from "src/contants";
import { UserRole } from "src/types";

/**
 * Get JWT token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
}

/**
 * Read the role out of the stored JWT, without waiting for /api/settings.
 * The signature is not checked here, on purpose: the API re-validates the
 * token on every request, this only tells the UI what to render on first
 * paint. Anything unreadable falls back to "admin", so a decoding bug hides
 * nothing from a real admin: the API stays the one saying no.
 */
export function getTokenRole(): UserRole {
  const payload = getAuthToken()?.split(".")[1];
  if (!payload) return "admin";

  try {
    const { role } = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return role === "guest" ? "guest" : "admin";
  } catch {
    return "admin";
  }
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
export async function handleForbidden(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;

  // Guest on an admin route: the token is fine, only the role is not
  const body = await response
    .clone()
    .json()
    .catch(() => undefined);

  if (body?.code === "FORBIDDEN_ROLE") {
    console.warn("[AUTH] 403 - admin access required");
    return true;
  }

  console.error("[AUTH] 403 - JWT invalid, logging out");
  if (getAuthToken()) {
    localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
    window.location.reload();
  }
  return true;
}
