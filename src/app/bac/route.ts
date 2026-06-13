import { NextRequest, NextResponse } from "next/server";
import {
  CAMPAIGN_COOKIE,
  CAMPAIGN_COOKIE_MAX_AGE,
  attributionFromParams,
  serializeAttribution,
} from "@/lib/campaign-attribution";

/**
 * Short marketing link for the Bacalaureat campaign:
 *   https://etutor.ro/bac            → register (RO) + BAC subjects + default voucher
 *   https://etutor.ro/bac?voucher=X  → same, explicit voucher code override
 *
 * Lives outside [locale] (path not covered by the middleware matcher) so the
 * public URL stays clean. Default voucher comes from BAC_VOUCHER env so
 * campaigns can rotate codes without a redeploy.
 */
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const voucher =
    req.nextUrl.searchParams.get("voucher")?.trim() || process.env.BAC_VOUCHER || "";
  // Behind nginx the backend Host is the internal address (localhost:3013), so
  // req.url would leak it into the redirect. Use the canonical public origin.
  const base = process.env.AUTH_URL || req.nextUrl.origin;
  const dest = new URL("/ro/auth/register", base);
  dest.searchParams.set("exam", "bac");
  if (voucher) dest.searchParams.set("voucher", voucher);

  const res = NextResponse.redirect(dest, 307);
  // Persist Romanian for the rest of the visit (next-intl reads NEXT_LOCALE).
  res.cookies.set("NEXT_LOCALE", "ro", {
    path: "/",
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 24 * 365,
  });

  // Stamp campaign attribution (read at signup → CampaignSignup). Forwards any
  // utm_* on the short link so paid-traffic sources are attributed.
  const attr = serializeAttribution(
    attributionFromParams(req.nextUrl.searchParams, "/bac", {
      campaign: "bac",
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
