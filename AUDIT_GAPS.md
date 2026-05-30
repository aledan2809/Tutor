# AUDIT_GAPS — Tutor
> Persistent ledger of open gaps. Items stay OPEN until resolved with evidence (commit hash + date).
> Source audit: `Reports/TRUE-E2E-FULL-2026-05-11.md`

---

## Open Gaps

*(no open gaps as of 2026-05-30)*

> Re-audit 2026-05-30 (TRUE-E2E-FULL after etutor.ro cutover): 0 real P0/P1. Login (L178 fix) + creatori page + admin CRUD role-gating + domain 301s all verified live. TRWG-GW "2 P0 + 2 P1" were 429 rate-limit artifacts (proven via clean cooldown login → 302). See `Reports/TRUE-E2E-FULL-2026-05-30.md`.

---

## Eliminated Gaps

| Gap ID | Description | Status | Commit | Date |
|--------|-------------|--------|--------|------|
| AGT-001 | No PATCH handler on admin/questions/[id] | Eliminated | 788a6b9 | 2026-05-11 |
| AGT-007 | Mobile touch targets on dashboard content pages | Eliminated | 788a6b9 | 2026-05-11 |
| AGT-008 (partial) | a11y heading order (h1→h3 skip in gamification) | Eliminated | 788a6b9 | 2026-05-11 |
| AGT-008 (partial) | focus-visible ring missing on answer option buttons | Eliminated | 788a6b9 | 2026-05-11 |
| AGT-002 | Settings page blank at desktop viewport (hydration loading state) | Eliminated | 07b791e | 2026-05-11 |
| AGT-003 | Calendar page empty (hydration loading state + no CTA) | Eliminated | 07b791e | 2026-05-11 |
| AGT-006 | No JSON bulk import for questions | Eliminated | 07b791e | 2026-05-11 |
| AGT-008 (contrast) | text-gray-500 contrast failures on dark bg (3.56:1 < WCAG AA) | Eliminated | 07b791e | 2026-05-11 |
| AGT-009 | Mobile-tester low score — text sizing + contrast on content pages | Eliminated | 07b791e | 2026-05-11 |
| AGT-004 | Aviation bibliography not seeded | Eliminated | direct DB (VPS2 Prisma script) | 2026-05-11 |
| AGT-005 | admin-test Puppeteer login blocked — dedicated account created | Eliminated | direct DB (VPS2 Prisma script) | 2026-05-11 |
| AGT-010 | Signin-page a11y/mobile — muted text-gray-500 contrast (3.5:1) + sub-44px tap targets on Forgot/magic-link/Create/ToS/Privacy | Eliminated | b4d5b23 | 2026-05-30 |
| AGT-CSRF | Dormant CSRF system removed (route + lib + interceptor) — httpOnly cookie unreadable by JS + zero server validation = dead code (caused L178) | Eliminated | b4d5b23 | 2026-05-30 |

---

*Last updated: 2026-05-30 (re-audit TRUE-E2E-FULL etutor.ro cutover)*
