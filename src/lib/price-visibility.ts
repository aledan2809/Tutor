import { isAdult } from "@/lib/age";

/**
 * Who may be shown a price, a discount or an offer to buy (UCPD Annex I point 28: no direct
 * exhortation to children). A parent, a tutor or any account that isn't learning: yes. A child whose
 * parent is in the account: never. A learner on their own account: only when their date of birth says
 * they are 18 or over — a learner who hasn't said it may be a child. Pure.
 */
export function mayShowPrices(u: {
  accountRole: string | null;
  /** Enrolled as a student in some subject. */
  learning: boolean;
  /** Has an active parent link. */
  isChild: boolean;
  /** A parent in the account: not a learner, even with an old student enrollment. */
  isParent?: boolean;
  /** Tutor, instructor, administrator, platform owner: adults at work, never asked their age. */
  staff?: boolean;
  /** Learns in a subject a company pays for: an adult at work. */
  companyCovered?: boolean;
  birthDate: Date | null;
  now?: Date;
}): boolean {
  if (u.isChild) return false;
  // A known date decides first: a declared minor sees no price, whatever else the account is.
  if (u.birthDate != null && !isAdult(u.birthDate, u.now)) return false;
  if (u.staff || u.companyCovered) return true;
  const learner = u.accountRole === "STUDENT" || (u.accountRole == null && u.learning && !u.isParent);
  if (!learner) return true;
  return u.birthDate != null && isAdult(u.birthDate, u.now);
}
