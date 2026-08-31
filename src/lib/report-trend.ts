/**
 * Turning a single report into a story: this period against the last five.
 *
 * The daily report exists only as a message today, which means it cannot be
 * asked for and cannot be compared. Two things follow from that: the report has
 * to be computable ON DEMAND — including for a period whose message has not been
 * sent yet — and the previous ones have to be RECOMPUTED from the underlying
 * activity rather than read back from what happened to be delivered. Recomputing
 * is what makes the history honest for periods where nothing was sent, and keeps
 * it honest if a scoring rule later changes.
 *
 * Pure: no DB, no IO. The caller supplies the reports.
 */

import type { ChildReport, ReportSection } from "@/lib/watcher-report";

export type ReportPeriod = "daily" | "weekly";

export interface PeriodWindow {
  since: Date;
  until: Date;
  label: string;
  /** True for the period still in progress — its report has not been sent yet. */
  current: boolean;
}

const DAY_MS = 86_400_000;

/**
 * The last `count` windows, newest first, the newest being the one in progress.
 *
 * Anchored on whole local days so a report never straddles two of them: a
 * "yesterday" that runs to 14:37 because that is when the page was opened would
 * make every comparison meaningless.
 */
export function periodWindows(
  period: ReportPeriod,
  count: number,
  now: Date = new Date()
): PeriodWindow[] {
  const span = period === "daily" ? DAY_MS : 7 * DAY_MS;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // The in-progress window starts at the beginning of today (daily) or of the
  // 7-day block ending today (weekly), and runs to `now`.
  const currentSince = period === "daily" ? startOfToday : startOfToday - 6 * DAY_MS;

  const out: PeriodWindow[] = [
    {
      since: new Date(currentSince),
      until: new Date(now.getTime()),
      label: period === "daily" ? "Azi (în curs)" : "Săptămâna asta (în curs)",
      current: true,
    },
  ];
  for (let i = 1; i < Math.max(1, count); i++) {
    const until = new Date(currentSince - (i - 1) * span);
    const since = new Date(currentSince - i * span);
    out.push({
      since,
      until,
      label:
        period === "daily"
          ? i === 1
            ? "Ieri"
            : `Acum ${i} zile`
          : i === 1
            ? "Săptămâna trecută"
            : `Acum ${i} săptămâni`,
      current: false,
    });
  }
  return out;
}

// ─── Per-chapter numbers ───

export interface SectionMetric {
  section: ReportSection;
  label: string;
  /** The comparable number, or null when the period holds no evidence. */
  value: number | null;
  /** How `value` reads on screen. */
  display: string;
  /** Whether a HIGHER number is the better outcome. */
  higherIsBetter: boolean;
}

const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 100) : null);

export function sectionMetrics(r: ChildReport): SectionMetric[] {
  const disciplineTotal = r.discipline.onTime + r.discipline.late + r.discipline.ignored;
  const resultsCorrect = r.results.reduce((n, x) => n + x.correct, 0);
  const resultsTotal = r.results.reduce((n, x) => n + x.total, 0);
  const accuracy = pct(resultsCorrect, resultsTotal);
  const punctuality = pct(r.discipline.onTime, disciplineTotal);

  return [
    {
      section: "sessions",
      label: "Sesiuni terminate",
      value: r.sessions.completed,
      display: `${r.sessions.completed} din ${r.sessions.total}`,
      higherIsBetter: true,
    },
    {
      section: "results",
      label: "Răspunsuri corecte",
      value: accuracy,
      display: accuracy === null ? "—" : `${accuracy}% (${resultsCorrect}/${resultsTotal})`,
      higherIsBetter: true,
    },
    {
      section: "discipline",
      label: "Punctualitate",
      value: punctuality,
      display: punctuality === null ? "—" : `${punctuality}% la timp`,
      higherIsBetter: true,
    },
    {
      section: "weaknesses",
      label: "Capitole slabe",
      value: r.weaknesses.length,
      display: r.weaknesses.length === 0 ? "niciunul" : String(r.weaknesses.length),
      higherIsBetter: false,
    },
  ];
}

// ─── Variation against the previous period ───

export interface SectionDelta extends SectionMetric {
  previous: number | null;
  /** Signed change; null when either side has no evidence. */
  delta: number | null;
  /** "up" / "down" in the sense of BETTER / WORSE, not of the raw number. */
  direction: "better" | "worse" | "same" | "unknown";
}

export function compareReports(current: ChildReport, previous?: ChildReport): SectionDelta[] {
  const prev = previous ? sectionMetrics(previous) : [];
  return sectionMetrics(current).map((m) => {
    const p = prev.find((x) => x.section === m.section);
    const previousValue = p?.value ?? null;
    if (m.value === null || previousValue === null) {
      return { ...m, previous: previousValue, delta: null, direction: "unknown" as const };
    }
    const delta = m.value - previousValue;
    const direction =
      delta === 0
        ? ("same" as const)
        : (delta > 0) === m.higherIsBetter
          ? ("better" as const)
          : ("worse" as const);
    return { ...m, previous: previousValue, delta, direction };
  });
}

// ─── The sentence at the bottom ───

/** Below this many periods with evidence, a trend is not a trend. */
export const MIN_PERIODS_FOR_TREND = 3;

/**
 * A short, honest conclusion.
 *
 * It says "not enough yet" rather than inventing a story from two points, and it
 * names what got worse as plainly as what got better — a report that only ever
 * reports improvement stops being read.
 */
export function concludeTrend(reports: readonly ChildReport[]): string {
  const withEvidence = reports.filter((r) => r.hasActivity);
  if (withEvidence.length === 0) return "Nicio activitate în perioadele astea — nu am ce compara.";
  if (withEvidence.length < MIN_PERIODS_FOR_TREND) {
    return `Deocamdată sunt date din ${withEvidence.length} ${withEvidence.length === 1 ? "perioadă" : "perioade"} — prea puțin pentru o tendință. Revino după câteva sesiuni.`;
  }

  // Oldest → newest, so "first" and "last" mean what they say.
  const series = [...withEvidence].reverse();
  const acc = series
    .map((r) => sectionMetrics(r).find((m) => m.section === "results")?.value ?? null)
    .filter((v): v is number => v !== null);

  const parts: string[] = [];
  if (acc.length >= 2) {
    const change = acc[acc.length - 1] - acc[0];
    if (Math.abs(change) < 5) {
      parts.push(`Precizia stă pe loc, în jur de ${acc[acc.length - 1]}%.`);
    } else if (change > 0) {
      parts.push(`Precizia a urcat de la ${acc[0]}% la ${acc[acc.length - 1]}%.`);
    } else {
      parts.push(`Precizia a scăzut de la ${acc[0]}% la ${acc[acc.length - 1]}%.`);
    }
  }

  // The weak chapters that persist are worth more than a single bad period.
  const counts = new Map<string, number>();
  for (const r of series) {
    for (const w of r.weaknesses) {
      const k = `${w.subject} — ${w.topic}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  const persistent = [...counts.entries()]
    .filter(([, n]) => n >= Math.ceil(series.length / 2))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k);
  if (persistent.length > 0) {
    parts.push(`Se repetă la: ${persistent.join(" și ")}.`);
  }

  const totalSessions = series.reduce((n, r) => n + r.sessions.completed, 0);
  parts.push(`${totalSessions} ${totalSessions === 1 ? "sesiune terminată" : "sesiuni terminate"} în perioadele astea.`);

  return parts.join(" ");
}
