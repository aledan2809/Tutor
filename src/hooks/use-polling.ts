"use client";

import { useEffect, useRef, useCallback } from "react";

interface UsePollingOptions {
  /** Polling interval in milliseconds (default: 30000) */
  interval?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
  /** Fetch function to call on each interval. Receives AbortSignal for cleanup. */
  fetcher: (signal?: AbortSignal) => Promise<void>;
}

/**
 * Hook for polling with proper cleanup via AbortController pattern.
 * Automatically pauses when tab is hidden and resumes when visible.
 */
export function usePolling({ interval = 30000, enabled = true, fetcher }: UsePollingOptions) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const doFetch = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    fetcherRef.current(controller.signal).catch(() => {
      // Silently handle polling errors
    });
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    timerRef.current = setInterval(doFetch, interval);
  }, [interval, stopPolling, doFetch]);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    // Initial fetch
    doFetch();

    startPolling();

    // Pause when tab is hidden, resume when visible
    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        doFetch();
        startPolling();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling, doFetch]);

  return { stopPolling, startPolling };
}
