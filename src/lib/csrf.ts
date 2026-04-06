/**
 * H14: CSRF token helpers for client-side use.
 * Reads the csrf-token cookie and adds X-CSRF-Token header to requests.
 */

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Wrapper around fetch that automatically includes the CSRF token header
 * for mutative requests (POST, PATCH, DELETE, PUT).
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers);

  if (["POST", "PATCH", "DELETE", "PUT"].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      headers.set("X-CSRF-Token", token);
    }
  }

  return fetch(input, { ...init, headers });
}
