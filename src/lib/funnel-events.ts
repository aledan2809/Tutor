import { trackEvent } from "@aledan/analytics";

/**
 * The visitor→account funnel, measured as Umami events (site etutor.ro on analytics.knowbest.ro).
 * Until 2026-10-05 nothing was measured: 115 visitors, 6 views of the signup page and no way to tell
 * which button they pressed (True E2E 2026-10-05 §0, leak 8). One list, so a typo can't open a new
 * event nobody looks at. Data carries only where the click came from — never an address or a name
 * (the tracker's before-send scrubber handles the page address itself).
 */
export type FunnelEvent =
  | "cta_try" // pressed a "try a quiz without an account" button
  | "cta_register" // pressed a "make an account" button
  | "cta_parinte_fara_card" // parents' page: "try without a card"
  | "cta_google" // pressed "Continuă cu Google" to make a parent account
  | "register_done" // the signup form went through
  | "first_question"; // answered the first question of a quiz (demo or logged in)

export type FunnelData = Record<string, string | number | boolean>;

export function trackFunnel(event: FunnelEvent, data?: FunnelData): void {
  trackEvent(event, data);
}

const ONCE_PREFIX = "etutor_funnel_once:";

/**
 * Same, but at most once per browser session for this key — e.g. "first_question" fires on the
 * first answer, not on every answer of every quiz.
 */
export function trackFunnelOnce(event: FunnelEvent, data?: FunnelData, key: string = event): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(ONCE_PREFIX + key)) return;
    window.sessionStorage.setItem(ONCE_PREFIX + key, "1");
  } catch {
    // Storage blocked (private mode): send it anyway — a duplicate beats a blind spot.
  }
  trackEvent(event, data);
}
