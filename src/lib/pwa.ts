/**
 * Shared PWA install helpers (browser-only). Used by the post-login AppBanner
 * and the permanent "Install app" control in Settings.
 */

export const INSTALL_DONE_KEY = "tutor_pwa_installed";
export const MANUAL_SEEN_KEY = "tutor_pwa_manual_seen";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * In-app webview (Telegram / WhatsApp / Instagram / Facebook / a non-Safari iOS
 * wrapper). "Add to Home Screen" doesn't work there, so we must NOT show an
 * install prompt — it would just confuse the user.
 */
export function isInAppWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (isStandalone()) return false;
  return (
    /Telegram|WhatsApp|WAiOS|FB_IAB|FBAN|FBAV|Instagram|Line\//i.test(ua) ||
    (isIOS() && !/Safari\//i.test(ua))
  );
}

export function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}
