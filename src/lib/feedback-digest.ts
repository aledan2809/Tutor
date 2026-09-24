/**
 * The daily nudge for complaints that wait for a person.
 *
 * Built to avoid the exact failure it exists for: seven valid reports from a student sat for two
 * months because every signal about them either closed itself or only counted ("you have 7
 * pending"). A count repeated daily becomes noise. So each message carries the DECISION to take —
 * what the student wrote, the question, what the two judges said, what we recommend — and one tap
 * that lands on that exact complaint.
 */
import { prisma } from "@/lib/prisma";
import { telegramAlertToUser } from "@/lib/notifications/service";
import { feedbackDeepLink } from "@/lib/feedback-admin";

const APP_URL = (process.env.AUTH_URL ?? "https://etutor.ro").replace(/\/$/, "");
/** Messages per day, oldest first. Past this, one closing line says how many more wait. */
export const DIGEST_MAX_ITEMS = 5;

export interface PendingItem {
  reviewAction: string | null;
  secondOpinion: string | null;
}

/** What we recommend the human does — derived, never a decision taken for them. */
export function recommendFor(item: PendingItem): string {
  if (item.secondOpinion === "disagrees") {
    return "Probabil elevul are dreptate: aprobă reclamația, apoi corectează sau ascunde întrebarea.";
  }
  if (item.reviewAction === "dismissed" && item.secondOpinion === "agrees") {
    return "Ambele verificări spun că răspunsul e corect: confirmă respingerea și scrie-i elevului de ce.";
  }
  return "Verificările nu sunt concludente: citește întrebarea și decide tu.";
}

/** Telegram's limit is 4096 characters; the question and the options always fit, the rest is trimmed. */
const TELEGRAM_MAX = 3900;

/**
 * One complaint, laid out so a person can decide it WITHOUT opening anything (Alex, 24.09): the
 * whole question, every option — the marked one ✅ and the one the second check found 💡 — then
 * what the student wrote, the two verdicts and our recommendation.
 */
export function composeDigestItem(i: {
  header: string;
  student: string;
  comment: string | null;
  question: string;
  passage: string | null;
  options: string[];
  marked: string;
  suggested: string | null;
  explanation: string | null;
  firstVerdict: string | null;
  secondVerdict: string | null;
  recommendation: string;
}): string {
  const clip = (t: string | null | undefined, max: number) => {
    const x = (t ?? "").trim();
    return x.length > max ? `${x.slice(0, max - 1)}…` : x;
  };
  const letters = "abcdefgh";
  const optionLines = i.options.map((o, k) => {
    const marks = [o === i.marked ? "✅ marcat corect" : "", i.suggested && o === i.suggested && o !== i.marked ? "💡 sugerat" : ""]
      .filter(Boolean)
      .join(" · ");
    return `${letters[k] ?? "-"}) ${clip(o, 300)}${marks ? `   ← ${marks}` : ""}`;
  });
  const agreeLine =
    i.suggested == null
      ? "A doua verificare nu a indicat o variantă."
      : i.suggested === i.marked
        ? "A doua verificare alege aceeași variantă ca cea marcată."
        : `A doua verificare alege altă variantă: „${clip(i.suggested, 200)}”.`;
  const interactive = /^\[(MEMORIE|AUDIODICT|CUBEVOICE|CLOCK)\b/.test(i.passage ?? "");
  const parts = [
    i.header,
    ``,
    `ÎNTREBAREA:`,
    clip(i.question, 1200),
    ...(interactive ? [``, `Date dictate/afișate elevului (ascunse în text): ${clip(i.passage, 300)}`] : []),
    ``,
    `VARIANTE:`,
    ...optionLines,
    ...(i.options.length === 0 ? [`Răspuns marcat: ${clip(i.marked, 300)}`] : []),
    agreeLine,
    ``,
    `${i.student} a scris: „${clip(i.comment, 400) || "(fără comentariu)"}”`,
    ``,
    `Prima verificare: ${clip(i.firstVerdict, 350)}`,
    `A doua: ${clip(i.secondVerdict, 350) || "încă nerulată."}`,
    ...(i.explanation ? [``, `Explicația din întrebare: ${clip(i.explanation, 400)}`] : []),
    ``,
    `➡️ ${i.recommendation}`,
  ];
  const text = parts.join("\n");
  return text.length > TELEGRAM_MAX ? `${text.slice(0, TELEGRAM_MAX - 1)}…` : text;
}

export function daysWaiting(createdAt: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86_400_000));
}

export async function sendPendingFeedbackDigest(now = new Date()): Promise<{ pending: number; sent: number }> {
  const pending = await prisma.questionFeedback.findMany({
    where: { status: "pending_review" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, userId: true, comment: true, createdAt: true, reviewAction: true, resolution: true,
      secondOpinion: true, secondOpinionNote: true, secondOpinionAnswer: true, questionId: true,
    },
  });
  if (pending.length === 0) return { pending: 0, sent: 0 };

  const admins = await prisma.user.findMany({ where: { isSuperAdmin: true }, select: { id: true } });
  if (admins.length === 0) return { pending: pending.length, sent: 0 };

  const shown = pending.slice(0, DIGEST_MAX_ITEMS);
  const [questions, students] = await Promise.all([
    prisma.question.findMany({
      where: { id: { in: shown.map((p) => p.questionId) } },
      select: {
        id: true, content: true, options: true, correctAnswer: true, explanation: true, passage: true,
        domain: { select: { name: true } },
      },
    }),
    prisma.user.findMany({ where: { id: { in: shown.map((p) => p.userId) } }, select: { id: true, name: true } }),
  ]);
  const qById = new Map(questions.map((q) => [q.id, q]));
  const nameById = new Map(students.map((u) => [u.id, u.name]));

  let sent = 0;
  for (const [i, fb] of shown.entries()) {
    const q = qById.get(fb.questionId);
    const d = daysWaiting(fb.createdAt, now);
    const options = Array.isArray(q?.options) ? (q!.options as string[]) : [];
    const text = composeDigestItem({
      header: `⏳ De decis ${i + 1}/${pending.length} — așteaptă de ${d === 0 ? "azi" : d === 1 ? "o zi" : `${d} zile`}${q?.domain?.name ? ` · ${q.domain.name}` : ""}`,
      student: nameById.get(fb.userId) ?? "Elevul",
      comment: fb.comment,
      question: q?.content ?? "(întrebarea nu mai există)",
      passage: q?.passage ?? null,
      options,
      marked: q?.correctAnswer ?? "",
      suggested: fb.secondOpinionAnswer,
      explanation: q?.explanation ?? null,
      firstVerdict: fb.resolution,
      secondVerdict: fb.secondOpinionNote,
      recommendation: recommendFor(fb),
    });
    for (const a of admins) {
      const ok = await telegramAlertToUser(a.id, { text, url: feedbackDeepLink(fb.id), buttonLabel: "Decide acum" }).catch(() => false);
      if (ok) sent++;
    }
  }

  if (pending.length > shown.length) {
    for (const a of admins) {
      await telegramAlertToUser(a.id, {
        text: `Mai așteaptă încă ${pending.length - shown.length}, după acestea. Mâine vin următoarele, cele mai vechi primele.`,
        url: `${APP_URL}/dashboard/admin/feedback`,
        buttonLabel: "Coada completă",
      }).catch(() => false);
    }
  }
  return { pending: pending.length, sent };
}
