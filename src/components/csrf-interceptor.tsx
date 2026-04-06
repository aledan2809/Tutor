"use client";

import { useEffect } from "react";

/**
 * H14: Global CSRF fetch interceptor.
 * Patches window.fetch to automatically include the X-CSRF-Token header
 * on all mutative requests (POST, PATCH, DELETE, PUT).
 */
export function CsrfInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const method = (init?.method || "GET").toUpperCase();

      if (["POST", "PATCH", "DELETE", "PUT"].includes(method)) {
        const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
        const token = csrfMatch ? decodeURIComponent(csrfMatch[1]) : null;

        if (token) {
          const headers = new Headers(init?.headers);
          if (!headers.has("X-CSRF-Token")) {
            headers.set("X-CSRF-Token", token);
          }
          init = { ...init, headers };
        }
      }

      return originalFetch.call(window, input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
