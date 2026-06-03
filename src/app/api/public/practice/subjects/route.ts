import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: subjects that have enough PUBLISHED multiple-choice questions to make
// a real demo quiz. Drives the no-account "pick a subject → practice" dropdown.
const MIN_QUESTIONS = 4;

export async function GET() {
  try {
    const rows = await prisma.question.groupBy({
      by: ["subject"],
      where: { status: "PUBLISHED", type: "MULTIPLE_CHOICE" },
      _count: { _all: true },
    });
    const subjects = rows
      .map((r) => ({ subject: r.subject, count: r._count._all }))
      .filter((s) => s.count >= MIN_QUESTIONS)
      .sort((a, b) => b.count - a.count);
    return NextResponse.json({ subjects });
  } catch {
    return NextResponse.json({ subjects: [] });
  }
}
