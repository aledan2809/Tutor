import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";
import { upcomingReminders, buildReminderUrl } from "@/lib/escalation/reminders";

const WINDOW_MIN = 240; // 4h
const TYPE_RO: Record<string, string> = {
  micro: "Sesiune micro",
  quick: "Sesiune rapidă",
  deep: "Sesiune lungă",
  repair: "Sesiune de remediere",
  recovery: "Sesiune de recuperare",
  intensive: "Sesiune intensivă",
};
const typeRO = (t: string) => TYPE_RO[t] ?? t;
const hhmm = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
const fmtTime = (d: Date) =>
  new Date(d).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });

/** GET — sessions a parent can attach a memento to: recent ignored (≤4h) + upcoming (≤4h). */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  // Upcoming (next 4h).
  const up = await upcomingReminders(childId, now, WINDOW_MIN);
  const upcoming = up.map((r) => ({
    value: `up:${r.id}`,
    label: `→ ${r.label || typeRO(r.sessionType)} — peste ${r.inMin} min (${hhmm(r.hour, r.minute)})`,
    message: `Urmează ${typeRO(r.sessionType)} la ${hhmm(r.hour, r.minute)}. Pregătește-te! 💪`,
    url: buildReminderUrl({ sessionType: r.sessionType, domainSlug: r.domainSlug }),
  }));

  // Recent ignored (last 4h): escalation episodes the child didn't react to and
  // for which no session was done.
  const since = new Date(now.getTime() - WINDOW_MIN * 60_000);
  const events = await prisma.escalationEvent.findMany({
    where: { userId: childId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { metadata: true, createdAt: true, acknowledgedAt: true },
  });
  const sessionsSince = await prisma.session.findMany({
    where: { userId: childId, OR: [{ startedAt: { gte: since } }, { endedAt: { gte: since } }] },
    select: { id: true },
  });
  const reactedBySession = sessionsSince.length > 0;

  type G = { reminderId: string | null; reason: string; firstAt: Date; reacted: boolean };
  const groups = new Map<string, G>();
  for (const e of events) {
    const meta = e.metadata as Record<string, unknown> | null;
    const reason = (meta?.reason as string) ?? "";
    if (!reason.startsWith("morning") && !reason.startsWith("evening")) continue;
    const reminderId = (meta?.reminderId as string) ?? null;
    const key = reminderId ?? reason;
    const g = groups.get(key) ?? { reminderId, reason, firstAt: e.createdAt, reacted: false };
    if (e.createdAt < g.firstAt) g.firstAt = e.createdAt;
    if (e.acknowledgedAt) g.reacted = true;
    groups.set(key, g);
  }

  const ridList = [...new Set([...groups.values()].map((g) => g.reminderId).filter(Boolean))] as string[];
  const reminders = ridList.length
    ? await prisma.studyReminder.findMany({
        where: { id: { in: ridList } },
        select: { id: true, label: true, sessionType: true, domainSlug: true },
      })
    : [];
  const remById = new Map(reminders.map((r) => [r.id, r]));

  const recent = [...groups.values()]
    .filter((g) => !g.reacted && !reactedBySession)
    .map((g) => {
      const r = g.reminderId ? remById.get(g.reminderId) : undefined;
      const sessionType = r?.sessionType ?? (g.reason.split("_").slice(1).join("_") || "quick");
      const name = r?.label || typeRO(sessionType);
      return {
        value: `rec:${g.reminderId ?? g.reason}`,
        label: `↩ ${name} — sărită la ${fmtTime(g.firstAt)}`,
        message: `Ai sărit ${typeRO(sessionType)} de la ${fmtTime(g.firstAt)} — hai s-o facem acum! 💪`,
        url: buildReminderUrl({ sessionType, domainSlug: r?.domainSlug ?? null }),
      };
    });

  return NextResponse.json({ recent, upcoming });
}

export const GET = withErrorHandler(_GET);
