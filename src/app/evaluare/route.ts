import { NextRequest, NextResponse } from "next/server";

/**
 * Short marketing link for the Evaluarea Națională campaign:
 *   https://etutor.ro/evaluare            → register (RO) + EN subjects + default voucher
 *   https://etutor.ro/evaluare?voucher=X  → same, explicit voucher code override
 *
 * Lives outside [locale] (path not covered by the middleware matcher) so the
 * public URL stays clean. Default voucher comes from EVALUARE_VOUCHER env so
 * campaigns can rotate codes without a redeploy.
 */
export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  const voucher =
    url.searchParams.get("voucher")?.trim() || process.env.EVALUARE_VOUCHER || "";
  url.pathname = "/ro/auth/register";
  url.search = "";
  url.searchParams.set("exam", "en");
  if (voucher) url.searchParams.set("voucher", voucher);

  const res = NextResponse.redirect(url, 307);
  // Persist Romanian for the rest of the visit (next-intl reads NEXT_LOCALE).
  res.cookies.set("NEXT_LOCALE", "ro", {
    path: "/",
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
