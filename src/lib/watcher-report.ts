/**
 * Watcher KPI report builder. Aggregates a child's activity over a period
 * (daily / weekly) into sessions + discipline + weaknesses + results, plus a
 * short rule-based narrative. Rendered to HTML (email) and plain text (push /
 * Telegram). No AI call — deterministic + free, runs from the cron.
 */

import { prisma } from "@/lib/prisma";

export type ReportSection = "sessions" | "discipline" | "weaknesses" | "results";
export const ALL_SECTIONS: ReportSection[] = ["sessions", "discipline", "weaknesses", "results"];

export interface ChildReport {
  childId: string;
  childName: string;
  periodLabel: string;
  hasActivity: boolean;
  sessions: { total: number; completed: number; avgScore: number | null };
  discipline: { onTime: number; late: number; ignored: number };
  weaknesses: { subject: string; topic: string; wrong: number; total: number }[];
  results: { domainName: string; correct: number; total: number; accuracy: number }[];
  feedback: string;
}

const TYPE_RO: Record<string, string> = {
  micro: "Sesiune micro",
  quick: "Sesiune rapidă",
  deep: "Sesiune lungă",
  repair: "Sesiune de remediere",
  recovery: "Sesiune de recuperare",
  intensive: "Sesiune intensivă",
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Build a KPI report for one child over [since, now]. */
export async function buildChildReport(
  childId: string,
  since: Date,
  periodLabel: string,
  sections: ReportSection[] = ALL_SECTIONS
): Promise<ChildReport> {
  const child = await prisma.user.findUnique({
    where: { id: childId },
    select: { name: true, email: true },
  });
  const childName = child?.name || child?.email || "Copilul";

  // Sessions in period (used by both session stats + discipline matching).
  const sessions = await prisma.session.findMany({
    where: { userId: childId, startedAt: { gte: since } },
    select: { id: true, startedAt: true, endedAt: true, score: true },
    orderBy: { startedAt: "asc" },
  });
  const completed = sessions.filter((s) => s.endedAt != null);
  const scored = completed.filter((s) => s.score != null);
  const avgScore =
    scored.length > 0 ? Math.round(scored.reduce((a, s) => a + (s.score ?? 0), 0) / scored.length) : null;

  // Discipline — scheduled reminder episodes vs sessions (on-time / late / ignored).
  const discipline = { onTime: 0, late: 0, ignored: 0 };
  if (sections.includes("discipline")) {
    const events = await prisma.escalationEvent.findMany({
      where: { userId: childId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, acknowledgedAt: true, metadata: true },
    });
    type Ep = { firstAt: Date; reacted: boolean };
    const eps = new Map<string, Ep>();
    for (const e of events) {
      const meta = e.metadata as Record<string, unknown> | null;
      const reason = (meta?.reason as string) ?? "";
      if (!reason.startsWith("morning") && !reason.startsWith("evening")) continue;
      const reminderId = (meta?.reminderId as string) ?? reason;
      const key = `${reminderId}|${dayKey(e.createdAt)}`;
      const ep = eps.get(key) ?? { firstAt: e.createdAt, reacted: false };
      if (e.createdAt < ep.firstAt) ep.firstAt = e.createdAt;
      if (e.acknowledgedAt) ep.reacted = true;
      eps.set(key, ep);
    }
    for (const ep of eps.values()) {
      const epDay = dayKey(ep.firstAt);
      const match = sessions.find((s) => {
        const startedHit = dayKey(s.startedAt) === epDay && s.startedAt >= ep.firstAt;
        const endedHit = s.endedAt != null && dayKey(s.endedAt) === epDay && s.endedAt >= ep.firstAt;
        return startedHit || endedHit;
      });
      const done = ep.reacted || match != null;
      if (!done) discipline.ignored++;
      else if (match != null && match.startedAt.getTime() - ep.firstAt.getTime() > 90 * 60_000)
        discipline.late++;
      else discipline.onTime++;
    }
  }

  // Weaknesses + per-domain results — from the period's answers.
  let weaknesses: ChildReport["weaknesses"] = [];
  let results: ChildReport["results"] = [];
  if (sections.includes("weaknesses") || sections.includes("results")) {
    const sessionIds = sessions.map((s) => s.id);
    const attempts = sessionIds.length
      ? await prisma.attempt.findMany({
          where: { sessionId: { in: sessionIds } },
          select: {
            isCorrect: true,
            question: { select: { subject: true, topic: true } },
            session: { select: { domainId: true } },
          },
        })
      : [];
    type TopicAgg = { subject: string; topic: string; wrong: number; total: number };
    const domAgg = new Map<string, { total: number; correct: number; topics: Map<string, TopicAgg> }>();
    for (const a of attempts) {
      const subject = a.question.subject || "—";
      const topic = a.question.topic || subject;
      const domainId = a.session?.domainId ?? "—";
      const dom = domAgg.get(domainId) ?? { total: 0, correct: 0, topics: new Map() };
      dom.total++;
      if (a.isCorrect) dom.correct++;
      const tk = `${subject}|${topic}`;
      const t = dom.topics.get(tk) ?? { subject, topic, wrong: 0, total: 0 };
      t.total++;
      if (!a.isCorrect) t.wrong++;
      dom.topics.set(tk, t);
      domAgg.set(domainId, dom);
    }
    const domIds = [...domAgg.keys()].filter((id) => id !== "—");
    const domRows = domIds.length
      ? await prisma.domain.findMany({ where: { id: { in: domIds } }, select: { id: true, name: true } })
      : [];
    const domNames = new Map(domRows.map((d) => [d.id, d.name]));
    if (sections.includes("results")) {
      results = [...domAgg.entries()]
        .map(([domainId, d]) => ({
          domainName: domNames.get(domainId) ?? "Altul",
          total: d.total,
          correct: d.correct,
          accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);
    }
    if (sections.includes("weaknesses")) {
      weaknesses = [...domAgg.values()]
        .flatMap((d) => [...d.topics.values()])
        .filter((m) => m.wrong > 0)
        .sort((x, y) => y.wrong / y.total - x.wrong / x.total || y.wrong - x.wrong)
        .slice(0, 6);
    }
  }

  const hasActivity = sessions.length > 0 || discipline.ignored + discipline.late + discipline.onTime > 0;

  // Rule-based narrative — a couple of plain-RO sentences.
  const fb: string[] = [];
  if (!hasActivity) {
    fb.push(`${childName} nu a avut activitate în ${periodLabel}.`);
  } else {
    if (discipline.ignored > 0)
      fb.push(`⚠️ ${discipline.ignored} ${discipline.ignored === 1 ? "sesiune programată a fost ratată" : "sesiuni programate au fost ratate"}.`);
    if (discipline.late > discipline.onTime && discipline.late > 0)
      fb.push("Multe sesiuni au început târziu — disciplina poate fi îmbunătățită.");
    if (avgScore != null) {
      if (avgScore >= 80) fb.push(`Rezultate foarte bune (medie ${avgScore}%).`);
      else if (avgScore < 50) fb.push(`Rezultatele au nevoie de atenție (medie ${avgScore}%).`);
    }
    if (weaknesses.length > 0)
      fb.push(`Cel mai slab subiect: ${weaknesses[0].subject} · ${weaknesses[0].topic}.`);
    if (fb.length === 0) fb.push("Totul merge bine — felicitări! 🎉");
  }

  return {
    childId,
    childName,
    periodLabel,
    hasActivity,
    sessions: { total: sessions.length, completed: completed.length, avgScore },
    discipline,
    weaknesses,
    results,
    feedback: fb.join(" "),
  };
}

export { TYPE_RO };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Render one or more child reports as an HTML email body. */
export function renderReportHtml(reports: ChildReport[], sections: ReportSection[]): string {
  const blocks = reports.map((r) => renderChildHtml(r, sections)).join("\n");
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;color:#1f2937">
      <h1 style="font-size:20px;margin:0 0 4px">Raport eTutor</h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px">Rezumat ${esc(reports[0]?.periodLabel ?? "")}.</p>
      ${blocks}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">Raport automat de la eTutor. Modifică programul rapoartelor din panoul Watcher.</p>
    </div>`;
}

function renderChildHtml(r: ChildReport, sections: ReportSection[]): string {
  const card = (inner: string) =>
    `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:0 0 14px">${inner}</div>`;
  const parts: string[] = [];
  parts.push(`<h2 style="font-size:16px;margin:0 0 6px">${esc(r.childName)}</h2>`);
  parts.push(`<p style="color:#4b5563;font-size:14px;margin:0 0 12px">${esc(r.feedback)}</p>`);

  if (!r.hasActivity) return card(parts.join(""));

  if (sections.includes("sessions")) {
    parts.push(
      `<p style="margin:8px 0 4px;font-weight:600;font-size:13px">📚 Sesiuni</p>
       <p style="margin:0;font-size:14px">${r.sessions.completed}/${r.sessions.total} finalizate${
         r.sessions.avgScore != null ? ` · medie <b>${r.sessions.avgScore}%</b>` : ""
       }</p>`
    );
  }
  if (sections.includes("discipline")) {
    const d = r.discipline;
    parts.push(
      `<p style="margin:12px 0 4px;font-weight:600;font-size:13px">⏱️ Disciplină</p>
       <p style="margin:0;font-size:14px">
         <span style="color:#16a34a">${d.onTime} la timp</span> ·
         <span style="color:#ca8a04">${d.late} întârziate</span> ·
         <span style="color:#dc2626">${d.ignored} ignorate</span>
       </p>`
    );
  }
  if (sections.includes("results") && r.results.length > 0) {
    const rows = r.results
      .map(
        (x) =>
          `<tr><td style="padding:2px 0;font-size:14px">${esc(x.domainName)}</td><td style="padding:2px 0;text-align:right;font-size:14px"><b>${x.accuracy}%</b> <span style="color:#9ca3af">(${x.correct}/${x.total})</span></td></tr>`
      )
      .join("");
    parts.push(
      `<p style="margin:12px 0 4px;font-weight:600;font-size:13px">📊 Rezultate</p>
       <table style="width:100%;border-collapse:collapse">${rows}</table>`
    );
  }
  if (sections.includes("weaknesses") && r.weaknesses.length > 0) {
    const items = r.weaknesses
      .map(
        (w) =>
          `<li style="font-size:14px;margin:2px 0">${esc(w.subject)} · ${esc(w.topic)} <span style="color:#dc2626">(${w.wrong}/${w.total} greșite)</span></li>`
      )
      .join("");
    parts.push(
      `<p style="margin:12px 0 4px;font-weight:600;font-size:13px">🎯 Puncte slabe</p>
       <ul style="margin:0;padding-left:18px">${items}</ul>`
    );
  }
  return card(parts.join(""));
}

/** Compact plain-text summary for push / Telegram. */
export function renderReportText(reports: ChildReport[], sections: ReportSection[]): string {
  const lines: string[] = [];
  for (const r of reports) {
    lines.push(`📊 ${r.childName} — ${r.periodLabel}`);
    if (!r.hasActivity) {
      lines.push("Fără activitate.");
      continue;
    }
    if (sections.includes("sessions"))
      lines.push(
        `Sesiuni: ${r.sessions.completed}/${r.sessions.total}${r.sessions.avgScore != null ? ` · medie ${r.sessions.avgScore}%` : ""}`
      );
    if (sections.includes("discipline"))
      lines.push(`Disciplină: ${r.discipline.onTime} la timp / ${r.discipline.late} întârziate / ${r.discipline.ignored} ignorate`);
    if (sections.includes("weaknesses") && r.weaknesses.length > 0)
      lines.push(`Slab: ${r.weaknesses[0].subject} · ${r.weaknesses[0].topic}`);
    lines.push(r.feedback);
  }
  return lines.join("\n");
}
