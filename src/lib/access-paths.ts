/**
 * Which dashboard pages a paused account can't use (access.ts). It keeps Abonament, settings,
 * help, the family page and the alert settings — the ways back.
 *
 * Pure and shared: the dashboard layout computes the pause screen once, and a client gate
 * (components/access/pause-gate.tsx) decides on every navigation whether to show it, because a
 * Next.js layout is not rendered again when the user moves between its pages.
 */

const PAUSED_PREFIXES = [
  // Learning
  "/dashboard/practice",
  "/dashboard/exams",
  "/dashboard/exam-bank",
  "/dashboard/lessons",
  "/dashboard/progress",
  "/dashboard/rapoarte",
  "/dashboard/calendar",
  "/dashboard/gamification",
  "/dashboard/domains",
  "/dashboard/assessment",
  "/dashboard/bibliography",
  "/dashboard/genereaza",
  "/dashboard/licenta",
  // Following a child
  "/dashboard/watcher",
];

/** Still open while paused, even under a paused prefix. */
const OPEN_UNDER_PAUSED = ["/dashboard/watcher/setari"];

const isUnder = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** „/ro/dashboard/practice?x" → „/dashboard/practice". */
export function dashboardPath(pathname: string): string {
  const bare = pathname.split(/[?#]/)[0].replace(/^\/(ro|en)(?=\/|$)/, "");
  return bare.length > 1 ? bare.replace(/\/+$/, "") : "/";
}

export function isPausedPath(pathname: string): boolean {
  const path = dashboardPath(pathname);
  if (path === "/dashboard") return true;
  if (OPEN_UNDER_PAUSED.some((p) => isUnder(path, p))) return false;
  return PAUSED_PREFIXES.some((p) => isUnder(path, p));
}
