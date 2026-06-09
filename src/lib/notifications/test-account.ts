/**
 * Cost-metrics test-account resolution for the escalation ledger, backed by the
 * shared `@aledan/notify-ladder` `isTestAccount` predicate. Stamp every
 * EscalationEvent with `isTest` at write time so synthetic (journey-audit / seed)
 * accounts don't pollute escalation/WhatsApp cost stats.
 *
 * Tutor's synthetic accounts use the app's own seed/demo domains `@tutor.app` and
 * `@demo.tutor.app` (plus the built-in `.test` / `example.com` defaults). The
 * test-domain list lives here so the shared predicate — not a per-app copy —
 * stays the single source of truth. (Verified on prod: only seed accounts use
 * these domains; real learners use their own emails.)
 */
import { isTestAccount } from '@aledan/notify-ladder'
import { prisma } from '@/lib/prisma'

const TUTOR_TEST_DOMAINS = ['tutor.app', 'demo.tutor.app']

/** True when the email belongs to a synthetic test/seed account. Safe on null. */
export function resolveIsTest(email: string | null | undefined): boolean {
  return isTestAccount(email, { extraTestDomains: TUTOR_TEST_DOMAINS })
}

/**
 * Resolve the `isTest` flag for an escalation from its recipient user id. Never
 * throws — a metrics-flag lookup must never block (or fail) an escalation send.
 */
export async function resolveIsTestForUser(userId: string): Promise<boolean> {
  try {
    if (!userId) return false
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    return resolveIsTest(user?.email)
  } catch {
    return false
  }
}
