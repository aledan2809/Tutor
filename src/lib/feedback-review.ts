/**
 * Automated feedback review agent (cron). For each new 👎 with a comment, an AI
 * judge decides if the complaint is real. Decision policy (per product):
 *  - valid + PRIVATE domain (Aptitudini / Licență):
 *      · safe, confident answer-key fix  → apply it ("corrected")
 *      · otherwise                        → hide the question (status DRAFT, "hidden")
 *  - valid + CURRICULUM domain → flag for an admin only ("flagged"); never auto-edit
 *  - not valid → dismiss
 * Then it marks the feedback resolved and notifies the user + admins of the decision.
 */
import { prisma } from "@/lib/prisma";
import { callTextAI } from "@/lib/grila-generate";
import { telegramAlertToUser } from "@/lib/notifications/service";
import { sendAppEmail } from "@/lib/email";
import { secondOpinion, type SecondOpinion } from "@/lib/content-quality-mesh";

const APP_URL = (process.env.AUTH_URL ?? "https://etutor.ro").replace(/\/$/, "");
const MAX_PER_RUN = 20;
/** A claim older than this belonged to a run that died; the item goes back to the queue. */
const STALE_CLAIM_MS = 30 * 60_000;

export interface Judgment {
  valid: boolean;
  issue: string;
  fixable: boolean;
  correctedAnswer: string | null;
  reason: string;
  /**
   * "question" = the complaint is about the question content (wrong answer,
   * wording, options). "platform" = it's about the app/experience (the TTS voice
   * reading too fast, audio, navigation, "I don't need this") — NOT the question.
   * Platform complaints must never hide/correct the question; they route to admins
   * as a product issue. Defaults to "question" if the judge omits it.
   */
  complaintType: "question" | "platform";
}

async function judge(q: {
  content: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  comment: string | null;
}): Promise<Judgment | null> {
  const prompt = `Ești un evaluator de calitate pentru întrebări grilă (română).
Un elev a dat 👎 acestei întrebări. Decide dacă reclamația e reală.

ÎNTREBARE: ${q.content}
OPȚIUNI: ${q.options.map((o, i) => `${i + 1}) ${o}`).join("  ")}
RĂSPUNS MARCAT CORECT: ${q.correctAnswer}
EXPLICAȚIE: ${q.explanation ?? "(fără)"}
COMENTARIU ELEV: ${q.comment ?? "(fără comentariu)"}

Răspunde DOAR cu JSON:
{"complaintType": "question" sau "platform",
 "valid": true/false (DOAR pentru complaintType=question: întrebarea chiar are o problemă reală),
 "issue": "scurtă descriere a problemei sau gol",
 "fixable": true/false (există o corecție SIGURĂ a cheii de răspuns),
 "correctedAnswer": "exact una dintre opțiuni dacă fixable, altfel null",
 "reason": "justificare scurtă"}
Reguli:
- complaintType="platform" dacă reclamația e despre PLATFORMĂ/EXPERIENȚĂ — vocea/robotul care citește prea repede/încet, audio, navigare, viteză, „nu am nevoie de asta/de întrebarea asta", interfață. NU despre conținutul întrebării. Pune issue = reclamația de produs pe scurt.
- complaintType="question" dacă reclamația e despre ÎNTREBARE — răspuns greșit, formulare ambiguă, opțiuni greșite, date incorecte.
- fixable=true DOAR dacă (complaintType=question ȘI) răspunsul corect e clar greșit și poți identifica cu certitudine opțiunea corectă dintre cele date (correctedAnswer trebuie să fie EXACT textul unei opțiuni). Dacă problema e de formulare/ambiguă, fixable=false.`;

  try {
    const raw = (await callTextAI(prompt)).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as Record<string, unknown>;
    return {
      valid: parsed.valid === true,
      issue: String(parsed.issue ?? ""),
      fixable: parsed.fixable === true,
      correctedAnswer: parsed.correctedAnswer ? String(parsed.correctedAnswer) : null,
      reason: String(parsed.reason ?? ""),
      // Default to "question" so an omitted/garbled field can never silently turn a
      // real question complaint into a no-op — only an explicit "platform" diverts.
      complaintType: parsed.complaintType === "platform" ? "platform" : "question",
    };
  } catch {
    return null;
  }
}

async function notify(userIds: string[], type: string, title: string, message: string, metadata: object) {
  for (const userId of userIds) {
    try {
      await prisma.notification.create({ data: { userId, type, title, message, metadata } });
    } catch {
      /* best-effort */
    }
  }
}

/**
 * Admin delivery: the in-app row (the bell) PLUS a Telegram alert to every admin
 * who linked their chat (free, carries arbitrary text). All best-effort.
 */
async function notifyAdmins(adminIds: string[], title: string, body: string, url: string, metadata: object) {
  await notify(adminIds, "feedback_admin", title, body, metadata);
  for (const id of adminIds) {
    await telegramAlertToUser(id, { text: `${title}\n\n${body}`, url, buttonLabel: "Deschide" });
  }
}

/**
 * Student delivery: the in-app row always; for ACTIONABLE outcomes (anything but a
 * plain dismissal) ALSO fan out through the channels the parent enabled in the
 * child's NotificationPreference — Telegram (if linked) + email (if `email` on).
 * WhatsApp/SMS are intentionally skipped here: those senders are locked to the
 * approved "study_reminder" template and can't carry free-text feedback (and are
 * metered) — so feedback rides the free, text-capable channels the parent allows.
 */
async function deliverToStudent(
  userId: string,
  title: string,
  decision: string,
  url: string,
  metadata: object,
  actionable: boolean,
) {
  await notify([userId], "feedback_resolved", title, decision, metadata);
  if (!actionable) return; // a dismissal stays in-app only — no extra channels
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  // Telegram is opt-in by linking (not a NotificationPreference flag) + free.
  await telegramAlertToUser(userId, { text: `${title}\n\n${decision}`, url, buttonLabel: "Deschide" });
  if (prefs?.email !== false) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (u?.email) {
      await sendAppEmail({
        to: u.email,
        subject: title,
        html: `<p>Salut ${u.name ?? ""},</p><p>${decision}</p><p><a href="${url}">Deschide eTutor</a></p><hr><p style="color:#888;font-size:12px">Mesaj automat de la eTutor despre feedback-ul tău.</p>`,
      }).catch(() => false);
    }
  }
}

export type ReviewAction =
  | "corrected"
  | "hidden"
  | "flagged"
  | "dismissed"
  | "product_flagged";

/**
 * Pure decision: from the AI judgment (+ whether the bank is private + the
 * question options), decide what to do and the human-readable resolution text.
 * Side-effects (editing/hiding the question, notifications) are applied by the
 * caller based on the returned action — so this stays unit-testable without a DB.
 *
 * A "platform" complaint (TTS too fast, navigation, "I don't need this") NEVER
 * hides or corrects the question — it routes to admins as a product issue.
 */
/**
 * Verdicts an automated reviewer is not allowed to close by itself.
 *
 * `dismissed` tells a child he was wrong — the most expensive thing this system
 * can say, and the one it got wrong. Between June and August a student reported
 * nine defective questions; seven were real, and the verdicts that were right to
 * doubt themselves ("flagged for admin") were written with status `resolved`,
 * so they looked finished in every list an admin might open. Nobody looked for
 * two months. A signal that closes itself is not a signal.
 *
 * `flagged` is here for the same reason, from the other direction: the reviewer
 * itself declares it cannot decide, and then marks the thread done.
 */
export const NEEDS_HUMAN_CONFIRMATION: readonly ReviewAction[] = ["dismissed", "flagged"];

export function needsHumanConfirmation(action: ReviewAction): boolean {
  return NEEDS_HUMAN_CONFIRMATION.includes(action);
}

/** Status written for a verdict — open until a person closes the ones above. */
export function statusForAction(action: ReviewAction): "resolved" | "pending_review" {
  return needsHumanConfirmation(action) ? "pending_review" : "resolved";
}

/**
 * Whether the student is told the outcome now.
 *
 * A dismissal waits for a human. Being told "your complaint was rejected" by a
 * machine that is itself unsure is exactly what happened to this student, five
 * times, while he was right.
 */
export function tellsStudentNow(action: ReviewAction): boolean {
  return action !== "dismissed";
}

/**
 * What a second, independent opinion changes.
 *
 * Only one thing: a dismissal the second judge disagrees with stops being a dismissal. It becomes
 * "flagged" — still waiting for a person, but no longer telling anyone the child was wrong, and the
 * decision text says plainly that the two judges disagree. An agreeing or unavailable second opinion
 * changes nothing: the verdict still waits for a human, it just arrives with more to go on.
 */
export function applySecondOpinion(
  action: ReviewAction,
  decision: string,
  op: SecondOpinion | null,
): { action: ReviewAction; decision: string } {
  if (action === "dismissed" && op?.verdict === "disagrees") {
    const what = [op.defect, op.reason].filter(Boolean).join(": ");
    return {
      action: "flagged",
      decision: `Verificatorii nu sunt de acord: primul a respins reclamația, al doilea, independent, a găsit o problemă${what ? ` (${what})` : ""}. Probabil elevul are dreptate — de confirmat de un om.`,
    };
  }
  return { action, decision };
}

/**
 * Interactive exercises carry a HIDDEN payload in `passage` — what is dictated aloud, drawn, or shown
 * for a few seconds ([AUDIODICT], [CUBEVOICE], [MEMORIE], [CLOCK]; see question-renderer.tsx). A judge
 * that reads text sees a question with nothing to answer from, and "finds" a defect every time.
 * Measured 2026-09-24 on the four dictated-cube complaints: all four came back "disagrees — depends on
 * external audio", while the students were complaining that the voice was too fast.
 */
export function isInteractiveExercise(passage: string | null | undefined): boolean {
  return /^\[(MEMORIE|AUDIODICT|CUBEVOICE|CLOCK|HEADING|ATTITUDE)\b/.test(passage ?? "");
}

/** The second opinion for a question — never asked of an exercise a text judge cannot see. */
export async function secondOpinionFor(q: {
  content: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  passage: string | null;
}): Promise<SecondOpinion> {
  if (isInteractiveExercise(q.passage)) {
    return {
      verdict: "unavailable",
      defect: null,
      reason: "exercițiu interactiv (dictat, desenat sau afișat câteva secunde) — nu se poate verifica din text",
      answer: null,
    };
  }
  return secondOpinion({ content: q.content, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation ?? undefined });
}

/** One line for the admin: what the second opinion said, in plain words. */
export function describeSecondOpinion(op: SecondOpinion): string {
  if (op.verdict === "agrees") return "A doua verificare, independentă, confirmă răspunsul marcat.";
  if (op.verdict === "disagrees") {
    const what = [op.defect, op.reason].filter(Boolean).join(": ");
    return `A doua verificare, independentă, a găsit o problemă${what ? `: ${what}` : ""}.`;
  }
  return `A doua verificare n-a putut judeca (${op.reason || "indisponibilă"}).`;
}

export function decideReviewAction(
  j: Judgment,
  isPrivate: boolean,
  options: string[],
  comment: string | null,
): { action: ReviewAction; decision: string } {
  if (j.complaintType === "platform") {
    return {
      action: "product_flagged",
      decision: `Reclamație de platformă/experiență (nu despre întrebare): ${j.issue || comment || "—"}. Întrebarea rămâne neschimbată; semnalat echipei de produs.`,
    };
  }
  if (!j.valid) {
    return { action: "dismissed", decision: `Reclamație respinsă: ${j.reason}` };
  }
  if (isPrivate && j.fixable && j.correctedAnswer && options.includes(j.correctedAnswer)) {
    return {
      action: "corrected",
      decision: `Corectat automat (răspuns: „${j.correctedAnswer}"). Motiv: ${j.issue}`,
    };
  }
  if (isPrivate) {
    return { action: "hidden", decision: `Ascunsă din practică (necesită revizuire). Problemă: ${j.issue}` };
  }
  return {
    action: "flagged",
    decision: `Semnalată pentru admin (curriculum, fără editare automată). Problemă: ${j.issue}`,
  };
}

export async function runFeedbackReview(): Promise<{
  reviewed: number;
  corrected: number;
  hidden: number;
  flagged: number;
  dismissed: number;
  productFlagged: number;
}> {
  const stats = { reviewed: 0, corrected: 0, hidden: 0, flagged: 0, dismissed: 0, productFlagged: 0 };

  // Runs can overlap: the cron fires every 15 min, and a run that waits on second opinions can take
  // longer than that. Each item is CLAIMED (new → reviewing) before it is judged, so two runs never
  // judge the same complaint — two different verdicts, and a student told twice. A claim left by a
  // run that died is released after STALE_CLAIM_MS.
  await prisma.questionFeedback.updateMany({
    where: { status: "reviewing", updatedAt: { lt: new Date(Date.now() - STALE_CLAIM_MS) } },
    data: { status: "new" },
  });

  const items = await prisma.questionFeedback.findMany({
    where: { status: "new", rating: "down" },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });
  if (items.length === 0) return stats;

  const admins = await prisma.user.findMany({
    where: { OR: [{ isSuperAdmin: true }, { enrollments: { some: { roles: { has: "ADMIN" } } } }] },
    select: { id: true },
  });
  const adminIds = admins.map((a) => a.id);

  for (const fb of items) {
    const claim = await prisma.questionFeedback.updateMany({
      where: { id: fb.id, status: "new" },
      data: { status: "reviewing" },
    });
    if (claim.count === 0) continue; // another run has it
    const release = () =>
      prisma.questionFeedback
        .updateMany({ where: { id: fb.id, status: "reviewing" }, data: { status: "new" } })
        .catch(() => {});
    try {
      const q = await prisma.question.findUnique({
        where: { id: fb.questionId },
        select: { id: true, content: true, options: true, correctAnswer: true, explanation: true, passage: true, domainId: true },
      });
      if (!q) {
        await prisma.questionFeedback.update({ where: { id: fb.id }, data: { status: "resolved", resolution: "Întrebarea nu mai există." } });
        continue;
      }
      const domain = await prisma.domain.findUnique({ where: { id: q.domainId }, select: { slug: true, name: true, visibility: true } });
      const isPrivate = domain?.visibility === "PRIVATE";
      const options = Array.isArray(q.options) ? (q.options as string[]) : [];

      const j = await judge({
        content: q.content,
        options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        comment: fb.comment,
      });
      stats.reviewed++;
      if (!j) {
        await release(); // AI unavailable — back to "new" for the next run
        continue;
      }

      // Pure decision, then — for the verdicts that wait for a person — an independent second
      // opinion, then the side-effect for the resulting action.
      const first = decideReviewAction(j, isPrivate, options, fb.comment);
      const op = needsHumanConfirmation(first.action)
        ? await secondOpinionFor({ ...q, options })
        : null;
      const { action, decision } = applySecondOpinion(first.action, first.decision, op);
      if (action === "corrected") {
        await prisma.question.update({ where: { id: q.id }, data: { correctAnswer: j.correctedAnswer! } });
        stats.corrected++;
      } else if (action === "hidden") {
        await prisma.question.update({ where: { id: q.id }, data: { status: "DRAFT" } });
        stats.hidden++;
      } else if (action === "dismissed") {
        stats.dismissed++;
      } else if (action === "flagged") {
        stats.flagged++;
      } else {
        // product_flagged — no question edit; routed to admins as a product issue.
        stats.productFlagged++;
      }

      await prisma.questionFeedback.update({
        where: { id: fb.id },
        data: {
          status: statusForAction(action),
          resolution: decision,
          reviewAction: action,
          reviewIssue:
            action === "product_flagged"
              ? j.issue || fb.comment || ""
              : action !== first.action && op
                ? op.reason || op.defect || "" // a flipped dismissal: the problem is what the 2nd judge found
                : j.valid
                  ? j.issue
                  : j.reason,
          correctedAnswer: action === "corrected" ? j.correctedAnswer : null,
          ...(op
            ? {
                secondOpinion: op.verdict,
                secondOpinionNote: describeSecondOpinion(op),
                secondOpinionAt: new Date(),
                secondOpinionAnswer: op.answer,
              }
            : {}),
        },
      });

      const meta = { questionId: q.id, feedbackId: fb.id, action, domain: domain?.slug ?? null };
      const url = `${APP_URL}/`;
      // The student who complained — in-app always; actionable outcomes also fan
      // out through the parent-configured channels (Telegram + email).
      const userTitle =
        action === "product_flagged"
          ? "Mulțumim! Am trimis sesizarea echipei 🛠️"
          : action === "dismissed"
            ? "Feedback analizat"
            : "Feedback rezolvat ✅";
      // A specific message: quote the student's own words + the concrete outcome,
      // not a generic "resolved". (Students reported the notices were too vague.)
      const outcomeText: Record<typeof action, string> = {
        corrected: "am corectat răspunsul. Întrebarea e acum actualizată și o vei vedea corectată.",
        hidden: "ai avut dreptate — am scos întrebarea din practică pentru revizuire, nu o vei mai primi.",
        flagged: "am trimis-o unui profesor să o verifice; revenim dacă e nevoie de o corecție.",
        dismissed: "am verificat-o cu atenție și răspunsul/întrebarea părea corect(ă), așa că rămâne neschimbată.",
        product_flagged: "ține de aplicație (nu de întrebare) — am trimis sesizarea echipei ca să o rezolve.",
      };
      const studentMsg = `Referitor la feedback-ul tău${fb.comment ? `: „${fb.comment}”` : ""} — ${outcomeText[action]}`;
      // A dismissal is NOT sent to the student yet. Telling a child "we checked
      // and you were wrong" is the most expensive sentence here, and it is the
      // one this reviewer got wrong five times while he was right. It waits for
      // a person to confirm it; the thread stays `pending_review` until then.
      if (tellsStudentNow(action)) {
        await deliverToStudent(fb.userId, userTitle, studentMsg, url, meta, true);
      }
      // Admins (skip the complaining user) — in-app + Telegram where linked.
      const adminTitle = action !== first.action
        ? `⚠️ DE CONFIRMAT — verificatorii nu sunt de acord, probabil elevul are dreptate (${domain?.name ?? "?"})`
        : needsHumanConfirmation(action)
        ? `⏳ DE CONFIRMAT — ${action === "dismissed" ? "urmează să-i spunem elevului că nu are dreptate" : "reviewerul nu a putut decide"} (${domain?.name ?? "?"})`
        : action === "product_flagged"
          ? `🛠️ Problemă de produs/UX semnalată (${domain?.name ?? "?"})`
          : `Feedback la o întrebare (${domain?.name ?? "?"})`;
      await notifyAdmins(
        adminIds.filter((id) => id !== fb.userId),
        adminTitle,
        `${action.toUpperCase()} — ${decision}${fb.comment ? ` · comentariu: „${fb.comment}"` : ""}${op && action === first.action ? `\n${describeSecondOpinion(op)}` : ""}`,
        url,
        meta
      );
    } catch (err) {
      console.error(`[feedback-review] ${fb.id} failed:`, (err as Error).message);
      await release();
    }
  }

  return stats;
}
