import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { issueConsentRequest, loadConsentState, sendConsentEmail } from "@/lib/parent-consent-server";
import { maskEmail } from "@/lib/parent-consent";

const schema = z.object({
  parentEmail: z.string().trim().toLowerCase().email(),
  locale: z.enum(["ro", "en"]).optional(),
});

/** POST: send the consent email again, or to another parent's address (a few times a day at most). */
async function _POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Scrie un email valid pentru părinte." }, { status: 400 });

  const state = await loadConsentState(session.user.id);
  if (state.kind !== "ask-parent" && state.kind !== "waiting" && state.kind !== "blocked") {
    return NextResponse.json({ error: "Contul nu așteaptă acordul unui părinte." }, { status: 409 });
  }
  // A parent's „no” is final: the account is being erased.
  if (state.kind === "blocked" && state.reason === "refused") {
    return NextResponse.json({ error: "Un părinte n-a fost de acord, așa că acest cont se închide." }, { status: 409 });
  }
  const issued = await issueConsentRequest(session.user.id, parsed.data.parentEmail);
  if (!issued.ok) {
    return issued.reason === "too-many"
      ? NextResponse.json({ error: "Am trimis deja de trei ori azi. Mai încearcă mâine." }, { status: 429 })
      : issued.reason === "address-busy"
        ? NextResponse.json({ error: "Acestei adrese i-am scris de prea multe ori azi. Scrie adresa celuilalt părinte sau încearcă mâine." }, { status: 429 })
      : issued.reason === "same-as-child"
        ? NextResponse.json({ error: "Scrie adresa unui părinte, nu pe a ta." }, { status: 400 })
        : issued.reason === "refused"
          ? NextResponse.json({ error: "Un părinte n-a fost de acord, așa că acest cont se închide." }, { status: 409 })
          : issued.reason === "not-needed"
            ? NextResponse.json({ error: "Contul are deja acordul unui părinte." }, { status: 409 })
            : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locale = parsed.data.locale ?? "ro";
  after(() => sendConsentEmail(session.user.id, issued.token, locale));
  return NextResponse.json({ ok: true, sentTo: maskEmail(parsed.data.parentEmail) });
}

export const POST = withErrorHandler(_POST);
