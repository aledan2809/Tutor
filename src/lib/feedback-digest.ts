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

export function daysWaiting(createdAt: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86_400_000));
}

const oneLine = (s: string | null | undefined, max: number) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

export async function sendPendingFeedbackDigest(now = new Date()): Promise<{ pending: number; sent: number }> {
  const pending = await prisma.questionFeedback.findMany({
    where: { status: "pending_review" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, userId: true, comment: true, createdAt: true, reviewAction: true, resolution: true,
      secondOpinion: true, secondOpinionNote: true, questionId: true,
    },
  });
  if (pending.length === 0) return { pending: 0, sent: 0 };

  const admins = await prisma.user.findMany({ where: { isSuperAdmin: true }, select: { id: true } });
  if (admins.length === 0) return { pending: pending.length, sent: 0 };

  const shown = pending.slice(0, DIGEST_MAX_ITEMS);
  const [questions, students] = await Promise.all([
    prisma.question.findMany({
      where: { id: { in: shown.map((p) => p.questionId) } },
      select: { id: true, content: true, correctAnswer: true, domain: { select: { name: true } } },
    }),
    prisma.user.findMany({ where: { id: { in: shown.map((p) => p.userId) } }, select: { id: true, name: true } }),
  ]);
  const qById = new Map(questions.map((q) => [q.id, q]));
  const nameById = new Map(students.map((u) => [u.id, u.name]));

  let sent = 0;
  for (const [i, fb] of shown.entries()) {
    const q = qById.get(fb.questionId);
    const d = daysWaiting(fb.createdAt, now);
    const text = [
      `⏳ De decis ${i + 1}/${pending.length} — așteaptă de ${d === 0 ? "azi" : d === 1 ? "o zi" : `${d} zile`}${q?.domain?.name ? ` · ${q.domain.name}` : ""}`,
      ``,
      `${nameById.get(fb.userId) ?? "Elevul"}: „${oneLine(fb.comment, 300) || "(fără comentariu)"}”`,
      `Întrebarea: ${oneLine(q?.content, 220)}`,
      `Răspuns marcat: ${oneLine(q?.correctAnswer, 120)}`,
      ``,
      `Prima verificare: ${oneLine(fb.resolution, 260)}`,
      fb.secondOpinionNote ? `A doua: ${oneLine(fb.secondOpinionNote, 260)}` : `A doua: încă nerulată.`,
      ``,
      `➡️ ${recommendFor(fb)}`,
    ].join("\n");
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
