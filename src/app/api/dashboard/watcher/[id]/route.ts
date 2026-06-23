import { NextRequest, NextResponse } from "next/server";
import { requireWatcherOrInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgressSummary } from "@/lib/predictive-analytics";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf, watcherSeesAllStudents } from "@/lib/guardian";

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireWatcherOrInstructor();
  if (error) return error;

  const { id: studentId } = await params;

  // Parent scoping: a pure parent watcher may only view a linked child.
  // `isGuardian` is also reused below to decide the breadth of the new logs:
  // a guardian legitimately sees the whole child; a domain-scoped instructor
  // must NOT see the child's activity outside their own domains.
  const seesAll = watcherSeesAllStudents(session!.user);
  const isGuardian = await isGuardianOf(session!.user.id, studentId);
  if (!seesAll && !isGuardian) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify watcher has access to this student's domains
  const watcherDomainIds = session!.user.enrollments
    .filter(
      (e) =>
        e.roles.includes("WATCHER" as never) ||
        e.roles.includes("INSTRUCTOR" as never) ||
        e.roles.includes("ADMIN" as never)
    )
    .map((e) => e.domainId);

  const studentEnrollments = await prisma.enrollment.findMany({
    where: {
      userId: studentId,
      domainId: { in: watcherDomainIds },
      roles: { hasSome: ["STUDENT"] },
      isActive: true,
    },
    include: {
      domain: { select: { id: true, name: true, slug: true, icon: true } },
    },
  });

  if (studentEnrollments.length === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Get per-domain summaries
  const domainSummaries = await Promise.all(
    studentEnrollments.map(async (enrollment) => {
      const summary = await getStudentProgressSummary(studentId, enrollment.domainId);
      return {
        domain: enrollment.domain,
        ...summary,
      };
    })
  );

  // Session log — each session + its result (score). A guardian sees the whole
  // child; a domain-scoped instructor only sees sessions inside their domains
  // (Session carries domainId), so they can't read other-domain activity.
  const sessions = await prisma.session.findMany({
    where: {
      userId: studentId,
      ...(isGuardian ? {} : { domainId: { in: watcherDomainIds } }),
    },
    orderBy: { startedAt: "desc" },
    take: 25,
    select: { id: true, type: true, subject: true, startedAt: true, endedAt: true, score: true },
  });
  const sessionLog = sessions.map((s) => ({
    id: s.id,
    type: s.type,
    subject: s.subject,
    startedAt: s.startedAt,
    completed: s.endedAt != null,
    score: s.score,
  }));

  // Reminder log — each reminder/escalation touch, with the channel + whether it
  // was actually sent + whether the child acknowledged it. EscalationEvent has
  // no domainId (it's student-global), so it can't be domain-scoped — it's a
  // parent-facing feature, restricted to guardians. A pure domain-scoped
  // instructor gets an empty log rather than a cross-domain leak.
  const events = isGuardian
    ? await prisma.escalationEvent.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: "desc" },
        take: 80,
        select: {
          id: true,
          level: true,
          channel: true,
          status: true,
          sentAt: true,
          acknowledgedAt: true,
          createdAt: true,
          metadata: true,
        },
      })
    : [];
  const reminderLog = events.slice(0, 40).map((e) => ({
    id: e.id,
    channel: e.channel,
    level: e.level,
    sent: e.sentAt != null,
    acknowledged: e.acknowledgedAt != null,
    reason: ((e.metadata as Record<string, unknown> | null)?.reason as string) ?? null,
    at: e.sentAt ?? e.createdAt,
  }));

  // Program (schedule) — the child's study reminders. Parent-facing config:
  // returned only to guardians; the same payload powers the editable manager.
  const schedule = isGuardian
    ? await prisma.studyReminder.findMany({
        where: { userId: studentId },
        orderBy: [{ hour: "asc" }, { minute: "asc" }],
      })
    : [];

  // Scheduled sessions (incl. ignored) — each reminder that fired is an episode.
  // Group escalation touches by (reason, calendar-day); a window reason looks
  // like "morning_quick". Outcome: reacted (any channel acknowledged) or a
  // session that day after it fired → "done" (+score); otherwise "ignored".
  const dayKey = (d: Date) =>
    new Date(d).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" });
  type Episode = {
    key: string;
    firstAt: Date;
    window: string;
    sessionType: string;
    channels: { level: number; channel: string }[];
    reacted: boolean;
    reactedChannel: string | null;
  };
  const episodeMap = new Map<string, Episode>();
  for (const e of events) {
    const reason = ((e.metadata as Record<string, unknown> | null)?.reason as string) ?? "";
    if (!reason.startsWith("morning") && !reason.startsWith("evening")) continue;
    const [win, ...rest] = reason.split("_");
    const key = `${reason}|${dayKey(e.createdAt)}`;
    let ep = episodeMap.get(key);
    if (!ep) {
      ep = {
        key,
        firstAt: e.createdAt,
        window: win,
        sessionType: rest.join("_") || "—",
        channels: [],
        reacted: false,
        reactedChannel: null,
      };
      episodeMap.set(key, ep);
    }
    if (e.createdAt < ep.firstAt) ep.firstAt = e.createdAt;
    ep.channels.push({ level: e.level, channel: e.channel });
    if (e.acknowledgedAt) {
      ep.reacted = true;
      if (!ep.reactedChannel) ep.reactedChannel = e.channel;
    }
  }
  const scheduledSessions = Array.from(episodeMap.values())
    .map((ep) => {
      const epDay = dayKey(ep.firstAt);
      // A session counts for this episode if it was STARTED or FINISHED the same
      // day, at/after the episode fired — so a late/resumed completion still
      // marks the episode done (not "ignored").
      const match = sessions.find((s) => {
        const startedHit = dayKey(s.startedAt) === epDay && s.startedAt >= ep.firstAt;
        const endedHit =
          s.endedAt != null && dayKey(s.endedAt) === epDay && s.endedAt >= ep.firstAt;
        return startedHit || endedHit;
      });
      const done = ep.reacted || match != null;
      return {
        key: ep.key,
        at: ep.firstAt,
        window: ep.window,
        sessionType: ep.sessionType,
        channels: ep.channels.sort((a, b) => a.level - b.level).map((c) => c.channel),
        reactedChannel: ep.reactedChannel,
        done,
        score: match?.score ?? null,
        completed: match?.endedAt != null,
      };
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 20);

  return NextResponse.json({
    student: {
      ...student,
      domains: studentEnrollments.map((e) => e.domain),
    },
    canManageSchedule: isGuardian,
    domainSummaries,
    schedule,
    scheduledSessions,
    sessionLog,
    reminderLog,
  });
}

export const GET = withErrorHandler(_GET);
