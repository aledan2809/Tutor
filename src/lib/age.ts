/**
 * Age from a date of birth (Alex, 28.09.2026: the day matters — a learner can turn 16 in a few days or
 * in a few months). Counted on the calendar day in Romania. Pure.
 *
 * - Parent's consent: the law asks it under 16 (GDPR art. 8).
 * - Prices: shown only to someone 18 or over (UCPD Annex I point 28).
 * - Born on 29 February: in a year without it, the birthday is 28 February (Codul civil, art. 2552:
 *   a term in years ends on the last day of the month when that month has no matching day).
 */
export const CONSENT_AGE = 16;
export const ADULT_AGE = 18;
const TZ = "Europe/Bucharest";
const OLDEST = "1920-01-01";
const YOUNGEST_AGE = 5;

type Ymd = { y: number; m: number; d: number };

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Today in Romania (the servers run in UTC: near midnight the date differs). */
function todayIn(now: Date): Ymd {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** A stored date of birth (a DATE column arrives as UTC midnight). */
const birthOf = (b: Date): Ymd => ({ y: b.getUTCFullYear(), m: b.getUTCMonth() + 1, d: b.getUTCDate() });

export function ageOn(birth: Date, now: Date = new Date()): number {
  const t = todayIn(now);
  const b = birthOf(birth);
  const birthdayDay = b.m === 2 && b.d === 29 && !isLeap(t.y) ? 28 : b.d;
  let age = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.d < birthdayDay)) age--;
  return age;
}

/** Under 16: a parent's consent is needed. */
export const needsParentConsent = (birth: Date, now: Date = new Date()) => ageOn(birth, now) < CONSENT_AGE;

/** 18 or over. */
export const isAdult = (birth: Date, now: Date = new Date()) => ageOn(birth, now) >= ADULT_AGE;

/**
 * „YYYY-MM-DD” → the date (UTC midnight, as stored), or null when it isn't a real calendar day, is
 * before 1920 or makes the person younger than 5 (a typo, or a date in the future).
 */
export function parseBirthDate(raw: unknown, now: Date = new Date()): Date | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // 31 February rolls over into March: not a real day.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  if (raw < OLDEST) return null;
  return ageOn(date, now) >= YOUNGEST_AGE ? date : null;
}

/**
 * Why a picked date isn't accepted, for the message: not all three picked, not a real day (31 February),
 * or real but too recent (under 5 — the list's last year still holds dates that are).
 */
export function birthDateProblem(raw: string, now: Date = new Date()): "incomplete" | "invalid" | "too-young" | null {
  if (!raw) return "incomplete";
  if (parseBirthDate(raw, now)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "invalid";
  const [y, m, d] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && raw >= OLDEST;
  return real ? "too-young" : "invalid";
}

/** „YYYY-MM-DD” from three picked values (day, month 1-12, year), or "" while one is missing. */
export function birthDateString(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
