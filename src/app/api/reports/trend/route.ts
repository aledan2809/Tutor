import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { buildChildReport, ALL_SECTIONS } from "@/lib/watcher-report";
import {
  compareReports,
  concludeTrend,
  periodWindows,
  sectionMetrics,
  type ReportPeriod,
} from "@/lib/report-trend";
import { getLinkedChildIds } from "@/lib/guardian";

/** Today plus the last five. */
const WINDOW_COUNT = 6;

/**
 * The report on demand, for whoever is entitled to see it.
 *
 * The student gets his own without anyone having to grant it — the point of the
 * page is that he can see how he stands before he is asked about it, rather than
 * finding out from a parent quoting a message he never saw.
 */
async function _GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const period: ReportPeriod = url.searchParams.get("period") === "weekly" ? "weekly" : "daily";
  // A parent asking for "the report" means their child's. Defaulting to the caller
  // handed them their OWN empty report - the page was in the parent's menu and
  // showed nothing, which reads as "no data" rather than "wrong person".
  const linked = await getLinkedChildIds(session.user.id);
  const isLearner = !!session.user.enrollments?.some((e) =>
    (e.roles as string[]).includes("STUDENT")
  );
  const requested = url.searchParams.get("childId");
  const childId = requested || (!isLearner && linked[0]) || session.user.id;

  if (childId !== session.user.id) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });
    if (!linked.includes(childId) && !me?.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const windows = periodWindows(period, WINDOW_COUNT);
  // Sequential rather than parallel: six report builds each run several queries,
  // and this is a page a parent opens, not a hot path.
  const reports = [];
  for (const w of windows) {
    reports.push(await buildChildReport(childId, w.since, w.label, ALL_SECTIONS, w.until));
  }

  const [current, previous] = reports;
  const children = linked.length
    ? await prisma.user.findMany({
        where: { id: { in: linked } },
        select: { id: true, name: true },
      })
    : [];

  return NextResponse.json({
    period,
    childId,
    children,
    childName: current?.childName ?? "",
    conclusion: concludeTrend(reports),
    // The period in progress — the report that has NOT been sent yet, which is
    // the whole reason for asking on demand.
    current: current
      ? { label: windows[0].label, metrics: sectionMetrics(current), report: current }
      : null,
    deltas: current ? compareReports(current, previous) : [],
    history: reports.slice(1).map((r, i) => ({
      label: windows[i + 1].label,
      hasActivity: r.hasActivity,
      metrics: sectionMetrics(r),
    })),
  });
}

export const GET = withErrorHandler(_GET);
