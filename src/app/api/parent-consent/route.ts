import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";
import { answerConsent } from "@/lib/parent-consent-server";
import { clientIp } from "@/lib/client-ip";

const schema = z.object({ token: z.string().min(1).max(100), decision: z.enum(["GIVEN", "REFUSED"]) });

/** POST (no account needed): the parent's answer from the link in the email. */
async function _POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  const res = await answerConsent(parsed.data.token, parsed.data.decision, {
    ip: clientIp(req.headers),
    userAgent: req.headers.get("user-agent"),
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Linkul nu mai e valid: a fost deja folosit sau a expirat. Copilul îți poate trimite altul din contul lui." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, decision: parsed.data.decision });
}

export const POST = withErrorHandler(_POST);
