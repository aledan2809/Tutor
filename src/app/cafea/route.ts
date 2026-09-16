import { NextRequest, NextResponse } from "next/server";
import {
  CAMPAIGN_COOKIE,
  CAMPAIGN_COOKIE_MAX_AGE,
  attributionFromParams,
  serializeAttribution,
} from "@/lib/campaign-attribution";
import { flyerVoucherCode } from "@/lib/parent-landing";

/**
 * Short marketing link for the "cât o cafea" flyer (QR code + printed URL):
 *   https://eTutor.ro/cafea → the parents' page (RO) with the flyer's code
 *
 * Since 16.09.2026 it lands on /ro/parinte, not straight on the signup form: a parent holding the
 * flyer first needs the rest of the story (how it works, what the code means, the 7 free days).
 * The page recognises the flyer code in the URL (or the campaign cookie below) and carries it on
 * to signup and payment.
 *
 * The code is always the flyer's (CAFEA_VOUCHER, default V126S). A `?voucher=` on this link used
 * to override it, but the parents' page only offers the flyer's and the site's codes, so the
 * attribution recorded one code while the page showed another.
 *
 * Same pattern as /evaluare (see that file). Lives outside [locale] so the printed/QR URL stays
 * short. The code comes from env so it can rotate without a redeploy (a compromised code does).
 */
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  // Always the flyer's code (see the note above on why `?voucher=` no longer overrides it).
  const voucher = flyerVoucherCode();
  // Behind nginx the backend Host is the internal address (localhost:3013), so
  // req.url would leak it into the redirect. Use the canonical public origin.
  const base = process.env.AUTH_URL || req.nextUrl.origin;
  const dest = new URL("/ro/parinte", base);
  if (voucher) dest.searchParams.set("voucher", voucher);

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
