import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { loadConsentState } from "@/lib/parent-consent-server";
import { withErrorHandler } from "@/lib/api-handler";
import { redeemJoinCode } from "@/lib/join-code-redeem";

/**
 * POST /api/domains/join { code }
 *
 * Redeem an access code → an active STUDENT enrollment in the domain that
 * issued it. Calea pentru cineva care ARE cont și tastează codul; intrarea pe
 * link, fără cont, trece prin `guest-access` din `auth.ts`.
 *
 * Regulile (expirare, limită de folosiri, revendicare atomică, resetarea
 * rolurilor, audit) stau acum în `redeemJoinCode` — un singur loc pentru
 * amândouă căile, ca să nu ajungă una dintre ele să uite o regulă.
 *
 * Every failure is the same 404: a wrong code, a cleared code, a switched-off
 * domain. Anything more specific would let someone learn which codes are live.
 */
async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // A learner whose age or parent's consent is still pending joins nothing: a company's course would
  // otherwise count as company-covered and replace the answer (parent-consent.ts).
  const consent = await loadConsentState(session.user.id);
  if (consent.kind !== "none") {
    return NextResponse.json(
      {
        error:
          consent.kind === "ask-age"
            ? "Spune-ne întâi anul nașterii: intră în contul tău, pe prima pagină."
            : "Contul așteaptă acordul unui părinte.",
        consentBlocked: true,
      },
      { status: 403 },
    );
  }

  let body: { code?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await redeemJoinCode(session.user.id, body.code);
  if (!result) {
    return NextResponse.json({ error: "Cod invalid" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export const POST = withErrorHandler(_POST);
