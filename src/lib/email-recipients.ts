/**
 * Addresses no message should go to: the domains reserved for examples and tests (RFC 2606 / 6761),
 * the platform's own test domains, and the fake ones used in seeds. A send to one only bounces — and
 * bounces count against the whole shared sending account (30.09.2026: 274 bounced alerts to a seed
 * parent at test.com, a 37% bounce rate on an account shared with every app).
 */
import { resolveIsTest } from "@/lib/notifications/test-account";

const RESERVED_TLDS = [".test", ".example", ".invalid", ".localhost"];
const RESERVED_DOMAINS = ["example.com", "example.net", "example.org", "test.com"];

export function isUndeliverableAddress(email: string | null | undefined): boolean {
  if (!email) return true;
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  if (!domain) return true;
  if (RESERVED_TLDS.some((t) => domain === t.slice(1) || domain.endsWith(t))) return true;
  if (RESERVED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return true;
  return resolveIsTest(email);
}
