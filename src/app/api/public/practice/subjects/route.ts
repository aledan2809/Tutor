import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: school-curriculum subjects with enough PUBLISHED multiple-choice questions to
// make a real demo quiz, GROUPED BY EXAM LEVEL. Drives the no-account homepage dropdown.
// Only school domains are shown (Capacitate cl. VIII / Bacalaureat) — non-curriculum
// verticals (Aviation pilot-theory, Drept, demo Istorie) are excluded. Level is inferred
// from the domain slug convention so new curriculum domains classify automatically:
//   *-v-viii / *cl-viii  → Evaluarea Națională (clasa a VIII-a)
//   *-ix-xii             → Bacalaureat
const MIN_QUESTIONS = 4;

type LevelKey = "EN_VIII" | "BAC";
const LEVELS: { key: LevelKey; label: string }[] = [
  { key: "EN_VIII", label: "Evaluarea Națională — clasa a VIII-a" },
  { key: "BAC", label: "Bacalaureat" },
];

function classifyDomainSlug(slug: string): LevelKey | null {
  if (/(?:-v-viii|cl-viii)$/.test(slug)) return "EN_VIII";
  if (/-ix-xii$/.test(slug)) return "BAC";
  return null; // not a classified school domain → excluded from the public demo
}

// Leaf label shown UNDER a level group — strip the level suffix that the group header
// already conveys (e.g. "Română — Bacalaureat" → "Română", "Matematica cl. VIII" → "Matematica").
function displayName(subject: string): string {
  const d = subject
    .replace(/\s*[—–-]\s*Bacalaureat$/i, "")
    .replace(/\s+cl\.?\s*VIII$/i, "")
    .replace(/\s+(?:V-VIII|IX-XII)$/i, "")
    .trim();
  return d || subject;
}

export async function GET() {
  try {
    const rows = await prisma.question.groupBy({
      by: ["domainId", "subject"],
      where: { status: "PUBLISHED", type: "MULTIPLE_CHOICE" },
      _count: { _all: true },
    });

    const domainIds = [...new Set(rows.map((r) => r.domainId))];
    const domains = await prisma.domain.findMany({
      where: { id: { in: domainIds } },
      select: { id: true, slug: true },
    });
    const slugById = new Map(domains.map((d) => [d.id, d.slug]));

    // Bucket eligible subjects by inferred level.
    const byLevel = new Map<LevelKey, { subject: string; count: number; display: string }[]>();
    for (const r of rows) {
      const count = r._count._all;
      if (count < MIN_QUESTIONS) continue;
      const slug = slugById.get(r.domainId);
      const level = slug ? classifyDomainSlug(slug) : null;
      if (!level) continue;
      const list = byLevel.get(level) ?? [];
      list.push({ subject: r.subject, count, display: displayName(r.subject) });
      byLevel.set(level, list);
    }

    const groups = LEVELS.filter((l) => (byLevel.get(l.key)?.length ?? 0) > 0).map((l) => ({
      level: l.key,
      label: l.label,
      subjects: byLevel.get(l.key)!.sort((a, b) => b.count - a.count),
    }));

    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ groups: [] });
  }
}
