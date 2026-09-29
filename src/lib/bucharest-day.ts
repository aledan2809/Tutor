/**
 * Calendar days in Bucharest, for the dates promised to people. „Până pe 8 octombrie” must hold for the
 * whole of 8 October, whatever hour the message went out, in summer time or in winter time — so a date
 * named in an e-mail is kept as the last moment of that day, and the erasure or the offer waits for it.
 */
const TZ = "Europe/Bucharest";
const PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type Ymd = { y: number; m: number; d: number };

function wall(at: Date): Ymd & { h: number; mi: number; s: number } {
  const p = Object.fromEntries(PARTS.formatToParts(at).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

/** The Bucharest calendar date of an instant (month 1–12). */
export function bucharestYmd(at: Date): Ymd {
  const { y, m, d } = wall(at);
  return { y, m, d };
}

/** How far Bucharest's clock is ahead of UTC at an instant: 2 h in winter, 3 h in summer. */
function offsetMs(at: Date): number {
  const w = wall(at);
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s) - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant a Bucharest wall-clock time happens. Midnight is never skipped by a change of time. */
export function bucharestTimeToUtc(y: number, m: number, d: number, h = 0, mi = 0, s = 0): Date {
  const asUtc = Date.UTC(y, m - 1, d, h, mi, s);
  let t = asUtc - offsetMs(new Date(asUtc));
  t = asUtc - offsetMs(new Date(t));
  return new Date(t);
}

/** The last millisecond of a Bucharest calendar day (day overflow is fine: 31 September = 1 October). */
export function endOfBucharestDate(y: number, m: number, d: number): Date {
  return new Date(bucharestTimeToUtc(y, m, d + 1).getTime() - 1);
}

/** The last millisecond of the Bucharest calendar day an instant falls on. */
export function endOfBucharestDay(at: Date): Date {
  const { y, m, d } = bucharestYmd(at);
  return endOfBucharestDate(y, m, d);
}

/**
 * The same calendar day a year later, in Bucharest; 29 February becomes 1 March, never 28 February —
 * a year is never counted short.
 */
export function bucharestDateAYearLater(at: Date): Ymd {
  const { y, m, d } = bucharestYmd(at);
  if (m === 2 && d === 29) return { y: y + 1, m: 3, d: 1 };
  return { y: y + 1, m, d };
}
