"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { trackFunnel } from "@/lib/funnel-events";

/**
 * „Continuă cu Google” for a parent making an account (parents' page, signup form). Google brings the
 * account back to /auth/google-done with what the signup form would have sent — the plan, the code,
 * the no-card start, where to return — and that page gives the new account the parent's role and
 * keeps the code, through the same checks as the form (lib/google-signup.ts).
 */
export function GoogleSignupButton({
  locale,
  plan,
  voucher,
  start,
  returnTo,
  from,
  className,
  label,
}: {
  locale: "ro" | "en";
  plan: string | null;
  voucher: string | null;
  start: string | null;
  returnTo?: string | null;
  /** Where the click came from, for the funnel (never a name or an address). */
  from: string;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const text = label ?? (locale === "ro" ? "Continuă cu Google" : "Continue with Google");

  const go = () => {
    if (busy) return;
    setBusy(true);
    trackFunnel("cta_google", { from });
    const q = new URLSearchParams();
    if (plan) q.set("plan", plan);
    if (voucher) q.set("voucher", voucher);
    if (start) q.set("start", start);
    if (returnTo) q.set("returnTo", returnTo);
    const rest = q.toString();
    // A failure to start the redirect (no network) gives the button back.
    signIn("google", { callbackUrl: `/${locale}/auth/google-done${rest ? `?${rest}` : ""}` }).catch(() => setBusy(false));
  };

  return (
    <button type="button" onClick={go} disabled={busy} aria-busy={busy} className={className}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {text}
    </button>
  );
}
