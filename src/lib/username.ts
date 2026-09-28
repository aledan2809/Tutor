/**
 * Usernames: short, typable on a phone, unambiguous. The sign-in field takes an email or a username
 * (auth.ts), and a username never contains "@", so the two can't be mistaken for each other.
 * Stored lowercase: phones capitalise the first letter.
 */
export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]{2,29})$/;

export const USERNAME_RULE_RO =
  "Numele de utilizator: 3–30 de caractere, litere mici, cifre, punct, minus sau underscore; începe cu o literă sau o cifră.";

export function normalizeUsername(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/** A username proposed from a name: „Ana-Maria Popescu” → „ana-maria.popescu”; "" when nothing usable. */
export function suggestUsername(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.\-_]+|[.\-_]+$/g, "")
    .slice(0, 30)
    .replace(/[.\-_]+$/g, "");
  return USERNAME_RE.test(base) ? base : "";
}
