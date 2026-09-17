"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isPausedPath } from "@/lib/access-paths";

/**
 * Shows the pause screen instead of a page a paused account can't use. Decided here, on the
 * current path, because the dashboard layout isn't rendered again on client-side navigation:
 * a paused parent who taps „Activează Family" must reach Abonament, and a paused child who starts
 * on Settings must not reach the exercises through the menu.
 */
export function PauseGate({ screen, children }: { screen: ReactNode; children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const paused = Boolean(screen);
  // While paused, coming back to the tab reads the access again: a parent who just paid in another
  // tab or on their phone sees the app come back without reloading. At most once a minute, since each
  // refresh renders the dashboard again on the server (focus and visibilitychange often fire together).
  useEffect(() => {
    if (!paused) return;
    let last = 0;
    const onReturn = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 60_000) return;
      last = Date.now();
      router.refresh();
    };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [paused, router]);
  if (!screen) return <>{children}</>;
  return <>{isPausedPath(pathname) ? screen : children}</>;
}

/**
 * Reloads the dashboard's server data the moment the free week ends, so the app doesn't keep
 * showing the trial to someone who stays on a page past the end.
 *
 * The wait is counted from the server's clock (`now`, when the page was rendered), not the
 * browser's: a phone whose clock runs ahead used to set no timer at all, or refresh too early and
 * never again. Each refresh renders a new `now`, so a refresh that still finds the trial running
 * sets the timer again (review r6, U4).
 */
export function RefreshAt({ at, now }: { at: string | null; now: string }) {
  const router = useRouter();
  useEffect(() => {
    if (!at) return;
    const ms = new Date(at).getTime() - new Date(now).getTime() + 1_000;
    // setTimeout overflows past ~24.8 days; a week never gets there.
    if (!Number.isFinite(ms) || ms <= 0 || ms > 2_000_000_000) return;
    const timer = setTimeout(() => router.refresh(), ms);
    return () => clearTimeout(timer);
  }, [at, now, router]);
  return null;
}
