# AUDIT_GAPS — Tutor
> Persistent ledger of open gaps. Items stay OPEN until resolved with evidence (commit hash + date).
> Source audit: `Reports/TRUE-E2E-FULL-2026-05-11.md`

---

## Open Gaps

*(no open gaps as of 2026-05-11)*

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

---

*Last updated: 2026-05-11*
