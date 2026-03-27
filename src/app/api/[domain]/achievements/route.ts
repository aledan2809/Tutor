import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { getAchievements, ACHIEVEMENTS } from "@/lib/gamification";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const unlocked = await getAchievements(session.user.id, domain.id);

  return NextResponse.json({
    achievements: unlocked,
    available: ACHIEVEMENTS.map((a) => ({
      slug: a.slug,
      name: a.name,
      description: a.description,
      unlocked: unlocked.some((u) => u.slug === a.slug),
    })),
  });
}
