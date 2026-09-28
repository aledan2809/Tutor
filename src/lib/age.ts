/**
 * Age from a year of birth (Alex, 28.09.2026): only the year is asked, so each rule leans toward
 * protecting a child. Pure.
 *
 * - Parent's consent: the law asks it under 16 (GDPR art. 8). Born in the year that turns 16 now may
 *   still be 15, so that year asks for it too.
 * - Prices: shown only to someone surely 18 or over (born 19 or more years before this year) — a
 *   17-year-old born late in the year must not be offered a price (UCPD Annex I point 28).
 */
export const CONSENT_AGE = 16;
export const ADULT_AGE = 18;
const OLDEST = 1920;
const YOUNGEST_AGE = 5;

export function validBirthYear(year: unknown, now: Date = new Date()): year is number {
  return Number.isInteger(year) && (year as number) >= OLDEST && (year as number) <= now.getFullYear() - YOUNGEST_AGE;
}

/** May be under 16: a parent's consent is needed. */
export function needsParentConsent(birthYear: number, now: Date = new Date()): boolean {
  return now.getFullYear() - birthYear <= CONSENT_AGE;
}

/** Surely 18 or over. */
export function surelyAdult(birthYear: number, now: Date = new Date()): boolean {
  return now.getFullYear() - birthYear > ADULT_AGE;
}
