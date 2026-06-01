import { NextRequest, NextResponse } from "next/server";
import { normalizeCode, REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from "@/lib/referral";

export const dynamic = "force-dynamic";

// Public referral landing: etutor.ro/r/<CODE>
// Sets a 90-day cookie carrying the code, then drops the visitor into the
// Magic Quiz demo (/<locale>/try) so they see the product BEFORE signup.
// The cookie is consumed at registration to link promoter → referred.
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params;
  const code = normalizeCode(raw);

  // Land on the visitor's locale if known, else RO (the target market).
  const locale = req.cookies.get("NEXT_LOCALE")?.value === "en" ? "en" : "ro";
  const dest = new URL(`/${locale}/try`, req.url);
  if (code) dest.searchParams.set("ref", code); // surfaced by /try for UX (optional)

  const res = NextResponse.redirect(dest);
  if (code) {
    res.cookies.set(REFERRAL_COOKIE, code, {
      path: "/",
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
    });
  }
  return res;
}
