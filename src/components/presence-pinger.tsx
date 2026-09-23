"use client";

import { useEffect } from "react";

/**
 * Sends the presence signal while the page is in front: once on arrival, then every minute, and again
 * whenever the tab comes back to the front. A hidden tab sends nothing — time spent means time with
 * the page in front of the person, not a tab forgotten since Tuesday.
 *
 * Failures are swallowed on purpose: presence is worth less than the page the person came for.
 */
export function PresencePinger({ everyMs = 60_000 }: { everyMs?: number }) {
  useEffect(() => {
    const ping = () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      fetch("/api/presence/ping", { method: "POST", keepalive: true }).catch(() => {});
    };
    ping();
    const timer = setInterval(ping, everyMs);
    const onVisible = () => ping();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [everyMs]);

  return null;
}
