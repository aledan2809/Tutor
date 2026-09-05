/**
 * Access codes for private domains — the pure part, safe to import from client
 * components (the generator lives in join-code-server.ts, it needs crypto).
 *
 * A private domain is reachable only through an enrollment. An admin can create
 * that enrollment by hand, or hand out a code so people enroll themselves — the
 * second key the owner asked for, for onboarding a group without twenty clicks.
 */

/** No 0/O and no 1/I/L — codes get read aloud and typed on phones. */
export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 8;

/**
 * What a person typed → what is stored: uppercase, without the display dash or
 * stray spaces. Returns null when the result cannot be a code at all, so the
 * caller never queries the database for junk. Lookalikes (0/O, 1/I/L) are not
 * "corrected" — the alphabet excludes them, so their presence means a typo, and
 * a typo should fail visibly rather than be guessed at.
 */
export function normalizeJoinCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== JOIN_CODE_LENGTH) return null;
  for (const ch of cleaned) if (!JOIN_CODE_ALPHABET.includes(ch)) return null;
  return cleaned;
}

/** Stored form → what an admin shows and reads out: XXXX-XXXX. */
export function formatJoinCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
