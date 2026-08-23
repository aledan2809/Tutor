// Shared cookie-consent state.
//
// The banner writes the visitor's choice; anything that would load a
// non-essential third party (today: the Google Identity Services script behind
// One Tap) reads it and waits. Kept in one module so the writer and the readers
// can never disagree about the storage key or the stored shape — a drift there
// would silently load the third party before consent, which is exactly the
// thing the banner promises does not happen.

export const COOKIE_CONSENT_KEY = "etutor_cookie_consent_v1";
export const COOKIE_CONSENT_EVENT = "etutor:cookie-consent";

export type ConsentChoice = "accepted" | "rejected";

/**
 * Parse what the banner stored. Returns null for absent, corrupt, or unknown
 * values — callers must treat null as "no consent yet", never as acceptance.
 */
export function parseStoredConsent(raw: string | null | undefined): ConsentChoice | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const choice = (parsed as { choice?: unknown }).choice;
  return choice === "accepted" || choice === "rejected" ? choice : null;
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY));
  } catch {
    // Storage can throw outright (Safari private mode, blocked cookies).
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ choice, at: new Date().toISOString() })
    );
  } catch {
    // Persisting failed, but the event below still unblocks this page view.
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: choice }));
}

/** Run `cb` on every consent change in this tab. Returns an unsubscribe fn. */
export function subscribeConsent(cb: (choice: ConsentChoice) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const choice = (e as CustomEvent<ConsentChoice>).detail;
    if (choice === "accepted" || choice === "rejected") cb(choice);
  };
  window.addEventListener(COOKIE_CONSENT_EVENT, handler);
  return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handler);
}
