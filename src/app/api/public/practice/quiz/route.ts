import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRestrictedDomainSlug } from "@/lib/domain-access";

// Public: a short quiz of real PUBLISHED questions for a chosen subject.
// correctIndex is computed server-side (options + correctAnswer are stored
// clean) so the client can grade the demo without an account — same shape the
// MagicQuiz demo already uses.
// 5 questions to match the free tier (2 subjects/day × 5 questions).
const LIMIT = 5;

const strip = (s: string | null | undefined) =>
  (s ?? "").trim().replace(/^[a-d]\)\s*/i, "").toLowerCase();

export async function GET(req: Request) {
  const subject = new URL(req.url).searchParams.get("subject")?.trim();
  if (!subject) {
    return NextResponse.json({ error: "subject required" }, { status: 400 });
  }
  try {
    // Only PUBLIC curriculum domains may surface in the no-auth demo. Restricted
    // domains (e.g. a student's private licență grile, the Rareș-only aviație
    // domains) must NEVER leak here — they share generic subjects ("Licență",
    // "Mathematics") so a subject-only filter would expose them.
    const domains = await prisma.domain.findMany({
      where: { isActive: true },
      select: { id: true, slug: true },
    });
    const publicDomainIds = domains
      .filter((d) => !isRestrictedDomainSlug(d.slug))
      .map((d) => d.id);

    const rows = await prisma.question.findMany({
      where: {
        status: "PUBLISHED",
        type: "MULTIPLE_CHOICE",
        subject,
        domainId: { in: publicDomainIds },
      },
      select: {
        content: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        topic: true,
        passage: true,
        sourceReference: true,
      },
    });

    const usable = rows
      .map((q) => {
        const options = Array.isArray(q.options) ? (q.options as string[]) : [];
        const correctIndex = options.findIndex((o) => strip(o) === strip(q.correctAnswer));
        // Human-readable citation (curriculum). Defensive prefix-strip — restricted
        // licență grile never reach here, so no quote leaks.
        const sr = (q.sourceReference ?? "").replace(/^licenta-gen:\s*/i, "").trim();
        return {
          content: q.content,
          options,
          correctIndex,
          explanation: q.explanation,
          topic: q.topic,
          passage: q.passage,
          source: sr || null,
        };
      })
      .filter((q) => q.correctIndex >= 0 && q.options.length >= 2);

    // Shuffle so each demo run feels fresh…
    for (let i = usable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [usable[i], usable[j]] = [usable[j], usable[i]];
    }
    // …then bias toward questions that carry an explanation — that's what makes
    // the demo compelling (V8 sort is stable, so the shuffle order is preserved
    // within each group).
    usable.sort((a, b) => (b.explanation ? 1 : 0) - (a.explanation ? 1 : 0));

    return NextResponse.json({ subject, questions: usable.slice(0, LIMIT) });
  } catch {
    return NextResponse.json({ subject, questions: [] });
  }
}
