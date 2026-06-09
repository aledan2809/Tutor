import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXAM_LEVELS, classifyDomainSlug, stripLevelSuffix, type ExamLevel } from "@/lib/exam-level";

// Public: school-curriculum subjects with enough PUBLISHED multiple-choice questions to
// make a real demo quiz, GROUPED BY EXAM LEVEL. Drives the no-account homepage dropdown.
// Only school domains are shown; level + label come from the shared @/lib/exam-level helper.
const MIN_QUESTIONS = 4;

type LevelKey = ExamLevel;
const LEVELS = EXAM_LEVELS;
const displayName = stripLevelSuffix;

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
