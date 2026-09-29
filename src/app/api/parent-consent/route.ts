import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";
import { answerConsent, loadConsentState } from "@/lib/parent-consent-server";
import { eraseAccount, tellAdmins } from "@/lib/account-erasure";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/client-ip";
import { logger } from "@/lib/logger";

const schema = z.object({
  token: z.string().min(1).max(100),
  decision: z.enum(["GIVEN", "REFUSED"]),
  /** The Legal Hub's id of the text the page showed: the answer is anchored on exactly that text. */
  versionId: z.string().min(1).max(64),
});

/**
 * POST (no account needed): the parent's answer from the link in the email. Recorded in the Legal Hub
 * first; a „no” then erases the child's account right away. If the erasure can't finish now (the Hub
 * unreachable, a payment on the account) the account stays shut: the sweep, or a person, finishes it.
 *
 * `erased`: the account is gone. `held`: stopped, closed by a person within 30 days (payments).
 * `asked` ≠ `decision`: an earlier answer on this link was already recorded, and it is the one kept.
 * `closed` (no `decision`): the account was already erased — nobody's answer is named, since it may
 * have gone for want of one.
 */
async function _POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  const { token, decision, versionId } = parsed.data;
  const res = await answerConsent(token, decision, versionId, {
    ip: clientIp(req.headers),
    userAgent: req.headers.get("user-agent"),
  });

  if (!res.ok) {
    switch (res.why) {
      case "erased": {
        // The Hub holds the account's erasure. Gone here too: clear anything left behind.
        const still = await prisma.user.findUnique({ where: { id: res.userId }, select: { id: true } });
        if (!still) {
          await eraseAccount(res.userId, "OTHER").catch(() => undefined);
          return NextResponse.json({ ok: true, closed: true });
        }
        // Still here: finished only for a reason eTutor holds itself (a refusal, the silence that ran out).
        const state = await loadConsentState(res.userId);
        if (state.kind === "blocked") {
          await eraseAccount(res.userId, state.reason === "refused" ? "GUARDIAN_REFUSED" : "NO_GUARDIAN_ANSWER").catch((err) =>
            logger.error("Erasure after the Hub's erasure record failed; the sweep will finish it", err, { userId: res.userId }),
          );
          return NextResponse.json({ ok: true, closed: true });
        }
        // The Hub and eTutor disagree: never erased on the Hub's word alone — a person decides.
        logger.error("The Hub holds an erasure for an account eTutor keeps; the parent's answer wasn't recorded", undefined, {
          userId: res.userId,
          state: state.kind,
        });
        await tellAdmins(
          "eTutor.ro: un răspuns de părinte n-a putut fi înregistrat",
          `<p>Legal Hub are ștergerea contului <code>${res.userId}</code>, dar contul există și nu e oprit (${state.kind}). Un părinte tocmai a încercat să răspundă și n-a putut. Verifică-l.</p>`,
        );
        return NextResponse.json(
          { error: "Nu am putut înregistra răspunsul pentru acest cont. Te rugăm să ne scrii la adresa din Politica de confidențialitate." },
          { status: 409 },
        );
      }
      case "not-needed":
        return NextResponse.json(
          { error: "Nu mai e nevoie de acordul tău: elevul a împlinit 16 ani sau contul are deja acordul unui părinte." },
          { status: 409 },
        );
      case "busy":
        return NextResponse.json(
          { error: "Un răspuns pentru acest cont se înregistrează chiar acum. Reîncarcă pagina peste câteva secunde." },
          { status: 409 },
        );
      case "stale-text":
        return NextResponse.json({ error: "Textul acordului s-a schimbat între timp. Reîncarcă pagina și răspunde din nou." }, { status: 409 });
      case "uncertain":
        return NextResponse.json(
          { error: "Nu știm sigur dacă răspunsul a ajuns. Încearcă din nou peste câteva minute: dacă a ajuns deja, rămâne cel dat prima dată." },
          { status: 503 },
        );
      default:
        return NextResponse.json(
          { error: "Linkul nu mai e valid: a fost folosit, a expirat sau l-a înlocuit unul mai nou (vezi cel mai recent e-mail de la eTutor.ro)." },
          { status: 400 },
        );
    }
  }

  if (res.decision === "REFUSED") {
    // The refusal is recorded; the erasure is best done now, and finished later if it can't be.
    try {
      const erasure = await eraseAccount(res.userId, "GUARDIAN_REFUSED");
      return NextResponse.json({
        ok: true,
        decision: res.decision,
        asked: res.asked,
        erased: erasure.erased,
        held: !erasure.erased && erasure.why === "has-payments",
      });
    } catch (err) {
      logger.error("Erasure after a parent's refusal failed; the sweep will finish it", err, { userId: res.userId });
      return NextResponse.json({ ok: true, decision: res.decision, asked: res.asked, erased: false, held: false });
    }
  }
  return NextResponse.json({ ok: true, decision: res.decision, asked: res.asked });
}

export const POST = withErrorHandler(_POST);
