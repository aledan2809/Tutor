"use client";

import { usePathname } from "next/navigation";

/**
 * Hides its children inside a running test (/dashboard/practice/<id>): on a phone the trial banner
 * pushed the answers off the first screen (approved mockup, Alex 14.10.2026). The countdown in the top
 * bar stays, so the trial is still visible there.
 */
export function HideDuringTest({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  return /\/dashboard\/practice\/[^/]+\/?$/.test(path) ? null : <>{children}</>;
}
