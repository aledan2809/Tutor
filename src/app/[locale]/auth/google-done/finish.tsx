"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { trackFunnel } from "@/lib/funnel-events";

/**
 * The session was signed before the account got its role: refresh it (the jwt callback re-reads the
 * account on an update), count the new account like the form does, then go on.
 */
export function GoogleDoneFinish({ dest, newAccount, locale }: { dest: string; newAccount: boolean; locale: "ro" | "en" }) {
  const { status, update } = useSession();
  const ran = useRef(false);

  useEffect(() => {
    // update() does nothing while the session is still loading — wait for it, or the refresh is lost.
    if (status === "loading" || ran.current) return;
    ran.current = true;
    if (newAccount) trackFunnel("register_done", { role: "PARENT", via: "google" });
    (async () => {
      try {
        // With an argument: update() alone only re-reads the session (a GET); with data it POSTs, which
        // runs the jwt callback with trigger "update" — the one that re-reads the account's role.
        await update({});
      } catch {
        // The role is in the database; at worst the menu catches up at the next refresh.
      }
      // A full load, so the dashboard's server parts read the refreshed session too.
      window.location.replace(dest);
    })();
  }, [status, dest, newAccount, update]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-gray-400" role="status">
        {locale === "ro" ? "Îți pregătim contul…" : "Getting your account ready…"}
      </p>
    </div>
  );
}
