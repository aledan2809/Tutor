import { NextRequest, NextResponse } from "next/server";
import {
  CAMPAIGN_COOKIE,
  CAMPAIGN_COOKIE_MAX_AGE,
  attributionFromParams,
  serializeAttribution,
} from "@/lib/campaign-attribution";

/**
 * Short marketing link for the "cât o cafea" flyer (QR code + printed URL):
 *   https://etutor.ro/cafea            → register (RO) + default voucher
 *   https://etutor.ro/cafea?voucher=X  → same, explicit voucher code override
 *
 * Same pattern as /evaluare (see that file). Lives outside [locale] so the
 * printed/QR URL stays short. Default voucher comes from CAFEA_VOUCHER env
 * so the flyer's code can rotate without a redeploy (a reprint doesn't need
 * one either way, but a compromised code does).
 */
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const voucher =
    req.nextUrl.searchParams.get("voucher")?.trim() || process.env.CAFEA_VOUCHER || "";
  // Behind nginx the backend Host is the internal address (localhost:3013), so
  // req.url would leak it into the redirect. Use the canonical public origin.
  const base = process.env.AUTH_URL || req.nextUrl.origin;
  const dest = new URL("/ro/auth/register", base);
  if (voucher) dest.searchParams.set("voucher", voucher);
  // The flyer's price (and V126S) is for the Family plan: preselect it on the packages
  // page, so a parent doesn't pick another plan first and get "code valid only for Family".
  dest.searchParams.set("plan", req.nextUrl.searchParams.get("plan")?.trim() || "FAMILY");

  const res = NextResponse.redirect(dest, 307);
  // Persist Romanian for the rest of the visit (next-intl reads NEXT_LOCALE).
  res.cookies.set("NEXT_LOCALE", "ro", {
    path: "/",
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 24 * 365,
  });

  // Stamp campaign attribution (read at signup → CampaignSignup) — lets the
  // flyer's actual conversions be counted, not just guessed at.
  const attr = serializeAttribution(
    attributionFromParams(req.nextUrl.searchParams, "/cafea", {
      campaign: "flyer-cafea",
      voucher: voucher || undefined,
    })
  );
  if (attr) {
    res.cookies.set(CAMPAIGN_COOKIE, attr, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      maxAge: CAMPAIGN_COOKIE_MAX_AGE,
    });
  }
  return res;
}
