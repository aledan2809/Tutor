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
  // Mistakes from the actual answers — both per-session ("greșit la …") and an
  // aggregate recent-mistakes view (more responsive than the high-bar WeakArea
  // table, which only flags a topic after ≥5 attempts <60% and clears on improve).
  const sessionIds = sessions.map((s) => s.id);
  const attempts = sessionIds.length
    ? await prisma.attempt.findMany({
        where: { sessionId: { in: sessionIds } },
        select: {
          sessionId: true,
          isCorrect: true,
          question: { select: { subject: true, topic: true } },
          session: { select: { domainId: true } },
        },
      })
    : [];
  const wrongBySession = new Map<string, Set<string>>();
  type TopicAgg = { subject: string; topic: string; wrong: number; total: number };
  const domAgg = new Map<string, { total: number; correct: number; topics: Map<string, TopicAgg> }>();
  for (const a of attempts) {
    const subject = a.question.subject || "—";
    const topic = a.question.topic || subject;
    const domainId = a.session?.domainId ?? "—";
    const dom = domAgg.get(domainId) ?? { total: 0, correct: 0, topics: new Map<string, TopicAgg>() };
    dom.total++;
    if (a.isCorrect) dom.correct++;
    const tk = `${subject}|${topic}`;
    const t = dom.topics.get(tk) ?? { subject, topic, wrong: 0, total: 0 };
    t.total++;
    if (!a.isCorrect) {
      t.wrong++;
      const set = wrongBySession.get(a.sessionId) ?? new Set<string>();
      set.add(topic);
      wrongBySession.set(a.sessionId, set);
    }
    dom.topics.set(tk, t);
    domAgg.set(domainId, dom);
  }
  // Per-domain results + weak areas (for the "Rezultate" tab).
  const domIds = [...domAgg.keys()].filter((id) => id !== "—");
  const domRows = domIds.length
    ? await prisma.domain.findMany({ where: { id: { in: domIds } }, select: { id: true, name: true } })
    : [];
  const domNames = new Map(domRows.map((d) => [d.id, d.name]));
  const byDomain = [...domAgg.entries()]
    .map(([domainId, d]) => ({
      domainId,
      domainName: domNames.get(domainId) ?? "Altul",
      total: d.total,
      correct: d.correct,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      mistakes: [...d.topics.values()]
        .filter((m) => m.wrong > 0)
        .sort((x, y) => y.wrong / y.total - x.wrong / x.total)
        .slice(0, 8),
    }))
    .sort((a, b) => b.total - a.total);

  const sessionLog = sessions.map((s) => ({
    id: s.id,
    type: s.type,
    subject: s.subject,
    startedAt: s.startedAt,
    completed: s.endedAt != null,
    score: s.score,
    wrongTopics: [...(wrongBySession.get(s.id) ?? [])].slice(0, 5),
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
    reminderId: string | null;
    channels: { level: number; channel: string }[];
    reacted: boolean;
    reactedChannel: string | null;
  };
  const episodeMap = new Map<string, Episode>();
  for (const e of events) {
    const meta = e.metadata as Record<string, unknown> | null;
    const reason = (meta?.reason as string) ?? "";
    if (!reason.startsWith("morning") && !reason.startsWith("evening")) continue;
    const reminderId = (meta?.reminderId as string) ?? null;
    const [win, ...rest] = reason.split("_");
    // Key by reminderId when present so renaming/re-typing a reminder doesn't split
    // its episodes; falls back to the frozen reason for older events.
    const key = `${reminderId ? `r:${reminderId}` : reason}|${dayKey(e.createdAt)}`;
    let ep = episodeMap.get(key);
    if (!ep) {
      ep = {
        key,
        firstAt: e.createdAt,
        window: win,
        sessionType: rest.join("_") || "—",
        reminderId,
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
  // Resolve the CURRENT name/type of each episode's reminder (it may have been
  // renamed/re-typed since the cascade fired) — always show the latest name.
  const epReminderIds = [...new Set(Array.from(episodeMap.values()).map((e) => e.reminderId).filter(Boolean))] as string[];
  const reminderRows = epReminderIds.length
    ? await prisma.studyReminder.findMany({
        where: { id: { in: epReminderIds } },
        select: { id: true, label: true, sessionType: true, window: true },
      })
    : [];
  const reminderById = new Map(reminderRows.map((r) => [r.id, r]));

  const scheduledSessions = Array.from(episodeMap.values())
    .map((ep) => {
      const epDay = dayKey(ep.firstAt);
      const cur = ep.reminderId ? reminderById.get(ep.reminderId) : undefined;
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
        window: cur?.window ?? ep.window,
        sessionType: cur?.sessionType ?? ep.sessionType,
        label: cur?.label?.trim() || null,
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
    byDomain,
    reminderLog,
  });
}

export const GET = withErrorHandler(_GET);
