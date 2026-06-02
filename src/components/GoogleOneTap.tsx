"use client";

import { useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useLocale } from "next-intl";

// Google One Tap (Tier 4 — zero-friction entry). Shows the floating "Continue as
// <name>" prompt for unauthenticated visitors who have a Google session in the
// browser, signing them in without leaving the page.
//
// The prompt returns a Google ID token (JWT) which we hand to the
// "google-one-tap" NextAuth Credentials provider (verified server-side). Requires
// the page origin to be an Authorized JavaScript Origin on the OAuth client.
//
// Gated on a real clientId (passed from AUTH_GOOGLE_ID by the layout) — renders
// nothing without it. The client ID is public (it travels in every OAuth URL).

interface CredentialResponse {
  credential?: string;
}

interface GsiId {
  initialize(config: {
    client_id: string;
    callback: (resp: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
    context?: string;
  }): void;
  prompt(): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GsiId } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

export default function GoogleOneTap({ clientId }: { clientId?: string }) {
  const { status } = useSession();
  const locale = useLocale();
  const initialized = useRef(false);

  useEffect(() => {
    // Only prompt unauthenticated visitors, once, and only with a real clientId.
    if (!clientId || status !== "unauthenticated" || initialized.current) return;
    initialized.current = true;

    async function handleCredential(resp: CredentialResponse) {
      if (!resp.credential) return;
      const res = await signIn("google-one-tap", {
        credential: resp.credential,
        redirect: false,
      });
      if (res && !res.error) {
        // Land the freshly signed-in visitor on their dashboard.
        window.location.href = `/${locale}/dashboard`;
      }
    }

    function startOneTap() {
      const id = window.google?.accounts?.id;
      if (!id) return;
      id.initialize({
        client_id: clientId!,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        context: "signin",
      });
      id.prompt();
    }

    if (window.google?.accounts?.id) {
      startOneTap();
      return;
    }

    // Load the Google Identity Services script once, then start.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", startOneTap, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = startOneTap;
    document.head.appendChild(script);
  }, [clientId, status, locale]);

  return null;
}
