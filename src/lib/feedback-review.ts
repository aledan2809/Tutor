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

const PRIVATE_SLUGS = new Set(["aptitudini-aviatie", "licenta-rares"]);
const MAX_PER_RUN = 20;

interface Judgment {
  valid: boolean;
  issue: string;
  fixable: boolean;
  correctedAnswer: string | null;
  reason: string;
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
{"valid": true/false (întrebarea chiar are o problemă reală),
 "issue": "scurtă descriere a problemei sau gol",
 "fixable": true/false (există o corecție SIGURĂ a cheii de răspuns),
 "correctedAnswer": "exact una dintre opțiuni dacă fixable, altfel null",
 "reason": "justificare scurtă"}
Reguli: fixable=true DOAR dacă răspunsul corect e clar greșit și poți identifica cu certitudine opțiunea corectă dintre cele date (correctedAnswer trebuie să fie EXACT textul unei opțiuni). Dacă problema e de formulare/ambiguă, fixable=false.`;

  try {
    const raw = (await callTextAI(prompt)).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as Record<string, unknown>;
    return {
      valid: parsed.valid === true,
      issue: String(parsed.issue ?? ""),
      fixable: parsed.fixable === true,
      correctedAnswer: parsed.correctedAnswer ? String(parsed.correctedAnswer) : null,
      reason: String(parsed.reason ?? ""),
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

export async function runFeedbackReview(): Promise<{
  reviewed: number;
  corrected: number;
  hidden: number;
  flagged: number;
  dismissed: number;
}> {
  const stats = { reviewed: 0, corrected: 0, hidden: 0, flagged: 0, dismissed: 0 };

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
    try {
      const q = await prisma.question.findUnique({
        where: { id: fb.questionId },
        select: { id: true, content: true, options: true, correctAnswer: true, explanation: true, domainId: true },
      });
      if (!q) {
        await prisma.questionFeedback.update({ where: { id: fb.id }, data: { status: "resolved", resolution: "Întrebarea nu mai există." } });
        continue;
      }
      const domain = await prisma.domain.findUnique({ where: { id: q.domainId }, select: { slug: true, name: true } });
      const isPrivate = domain ? PRIVATE_SLUGS.has(domain.slug) : false;
      const options = Array.isArray(q.options) ? (q.options as string[]) : [];

      const j = await judge({
        content: q.content,
        options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        comment: fb.comment,
      });
      stats.reviewed++;
      if (!j) continue; // AI unavailable — leave it "new" for the next run

      let decision: string;
      let action: "corrected" | "hidden" | "flagged" | "dismissed";

      if (!j.valid) {
        decision = `Reclamație respinsă: ${j.reason}`;
        action = "dismissed";
        stats.dismissed++;
      } else if (isPrivate && j.fixable && j.correctedAnswer && options.includes(j.correctedAnswer)) {
        await prisma.question.update({ where: { id: q.id }, data: { correctAnswer: j.correctedAnswer } });
        decision = `Corectat automat (răspuns: „${j.correctedAnswer}"). Motiv: ${j.issue}`;
        action = "corrected";
        stats.corrected++;
      } else if (isPrivate) {
        await prisma.question.update({ where: { id: q.id }, data: { status: "DRAFT" } });
        decision = `Ascunsă din practică (necesită revizuire). Problemă: ${j.issue}`;
        action = "hidden";
        stats.hidden++;
      } else {
        decision = `Semnalată pentru admin (curriculum, fără editare automată). Problemă: ${j.issue}`;
        action = "flagged";
        stats.flagged++;
      }

      await prisma.questionFeedback.update({
        where: { id: fb.id },
        data: {
          status: "resolved",
          resolution: decision,
          reviewAction: action,
          reviewIssue: j.valid ? j.issue : j.reason,
          correctedAnswer: action === "corrected" ? j.correctedAnswer : null,
        },
      });

      const meta = { questionId: q.id, feedbackId: fb.id, action, domain: domain?.slug ?? null };
      // The user who complained
      await notify(
        [fb.userId],
        "feedback_resolved",
        action === "dismissed" ? "Feedback analizat" : "Feedback rezolvat ✅",
        decision,
        meta
      );
      // Admins (skip the complaining user to avoid a duplicate)
      await notify(
        adminIds.filter((id) => id !== fb.userId),
        "feedback_admin",
        `Feedback la o întrebare (${domain?.name ?? "?"})`,
        `${action.toUpperCase()} — ${decision}${fb.comment ? ` · comentariu: „${fb.comment}"` : ""}`,
        meta
      );
    } catch (err) {
      console.error(`[feedback-review] ${fb.id} failed:`, (err as Error).message);
    }
  }

  return stats;
}
