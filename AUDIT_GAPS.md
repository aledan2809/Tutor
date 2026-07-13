# AUDIT_GAPS — Tutor
> Persistent ledger of open gaps. Items stay OPEN until resolved with evidence (commit hash + date).
> Source audit: `Reports/TRUE-E2E-FULL-2026-05-11.md`

---

## Open Gaps

> **Audit COMPLET /pa + True E2E [10] 2026-07-12** — 7-persona walk (vizitator/elev/părinte/meditator/admin/superadmin) + cross-cutting E2E. Full report: `Reports/AUDIT-PA-E2E-2026-07-12.md`. Zero 404s + clean auth gating; but **10 × P0** (7 security + 3 money-path) + ~20 P1. Batch A (7 security P0) **ELIMINATED + LIVE** (commit `1808362`, see below). Remaining open (batched for next passes):

| Gap ID | Description | Priority | Status |
|--------|-------------|----------|--------|
| G-TU-B9 | Extra child added FREE via invite (no billing) — per-child add-on (custom broker lineItem, broker untouched) + `paidExtraChildSeats` schema + callback grant/clamp + effective seat-gate on ALL 3 child-add paths + upgrade links | P0 money | **Eliminated — DEPLOYED + broker checkout live-verified 2026-07-13 (commit `68ee0b9`)** |
| G-TU-B10 | No self-service cancel/manage subscription — persist `stripeSubscriptionId` in `stripe/callback` + `/api/stripe/portal` route (broker `POST /api/portal`) + button on packages | P0 money | **Eliminated — DEPLOYED 2026-07-13 (commit `68ee0b9`); broker project-key wiring verified. NOTE: no real Stripe subscribers in prod yet (5 "active" users are seeded/non-Stripe → graceful "no subscription to manage"). Customer-Portal config on Class RDA still to confirm before 1st real subscriber manages.** |
| G-TU-B8 | Pricing page → generic signup, no continuity | P0 money | **Eliminated — DEPLOYED 2026-07-13 as Batch B (commit `64188a0`)** |
| G-TU-FUNNEL | Parent funnel discoverability chain broken (sidebar hides Family/Watcher for unpaid, no CTA; /parinte+/elev CTA→signin not register; bell no child-alerts; setup-checklist no "link child"; push banner can't fire watcher-only; assessment orphan) | P0/P1 | **Eliminated — DEPLOYED Batch C 2026-07-13 (commits `1c10f49`+`ca5e297`): locked "🔒 Familia mea" nav, 4 CTAs→register (incl. ParentFunnel, live-verified), bell child-alerts, watcher/setari in nav, "add child" setup step, push banner for watcher-only. DEFERRED: assessment-orphan wiring (#18, larger).** |
| G-TU-VIRAL | Viral paste-text demo promised on /scor+/duel+/certificat but /try can't do it — DECIDED: drop the promise (no "AI" showcase), rewrite copy | P1 | **Eliminated — DEPLOYED Batch D 2026-07-13 (commit `7d95afa`): /scor + /duel + /certificat copy sells subject quiz (no paste-text, no "AI"); live-verified.** |
| G-TU-I18N | Two parallel i18n systems; landing + practice-session + assessment + auth reset bypass next-intl; `calendar.loading` missing key; instructor domain dropdown shows raw cuids; "AI" copy across admin | P1/P2 | **PARTIAL — DEPLOYED Batch E 2026-07-13 (`7d95afa`): calendar.loading + hero landmine + full admin "AI"-copy sweep + instructor cuid→names + /cookies landing footer. DEFERRED (large, separate item): systemic i18n consolidation (practice page, reset-password RO, assessment EN, admin surface).** |
| G-TU-LEGAL | Persona/pricing pages no footer + /cookies /privacy /terms dead-ends → legal unreachable (GDPR) | P1 | **Eliminated — footer/legal-nav already shipped `d318f98` (PolicyFooter on all non-landing pages + "Înapoi" on legal pages, live-verified); /cookies added to landing footer Batch E (`7d95afa`).** |
| G-TU-ADMIN | ingest-pdf full-book pipeline no UI; exam-bank no import; /superadmin/referrals missing (commission liability invisible); plan/ad mutations not audit-logged; overview cards inert | P1 | **PARTIAL — DEPLOYED Batch F 2026-07-13 (`67f772e`): plan+ad mutations audit-logged, overview cards clickable, /superadmin/referrals read-only liability view + card, exam-bank labelled "(vizualizare)". DEFERRED (dedicated): #22 mark-PAID mutation (money), #20 ingest-book UI, #6 revenue north-star metrics.** |
| G-TU-STRATEGY | STRATEGY.md understates reality — FAZA 2/7 shipped but marked `[ ]`; Tier-5 mesh + ExamPaper + campaign-attribution undocumented; pricing model = per-composition (raise, don't cut) | P2 | **Eliminated — Batch G 2026-07-13 (`c02058b`): STRATEGY.md v2.0 raised FAZA 2/7 to LIVE, pricing source-of-truth = code, Tier 5 addendum (ingest-pdf/ExamPaper/campaign-attribution), Tier 0 pivot noted.** |

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
| G-TU-A1 | "Ban User" cosmetic — no isBanned check in auth (banned user kept 30-day JWT). jwt callback returns null → Auth.js clears session cookie (≤5 min) | Eliminated | 1808362 | 2026-07-12 |
| G-TU-A2 | Dead "Impersonate" button discarded the real signed token (only alert) — removed (full impersonation deferred as feature) | Eliminated | 1808362 | 2026-07-12 |
| G-TU-A3 | Create-user "Admin" role silently made a powerless account — removed from enum + dropdown (admin = per-domain Enroll) | Eliminated | 1808362 | 2026-07-12 |
| G-TU-A4 | Cross-tenant IDOR on instructor groups/[id] (GET/PATCH/DELETE + page) — ownership guard added | Eliminated | 1808362 | 2026-07-12 |
| G-TU-A5 | Report generator group+domain branches unscoped (any instructor read any roster) — scoped to caller's domains | Eliminated | 1808362 | 2026-07-12 |
| G-TU-A6 | Instructor saw admin question-mutation buttons → silent 403 — QuestionList readOnly unless admin | Eliminated | 1808362 | 2026-07-12 |
| G-TU-A7 | Instructor goals+sessions POST no ownership check — verify domain + student enrollment | Eliminated | 1808362 | 2026-07-12 |
| AGT-CSRF | Dormant CSRF system removed (route + lib + interceptor) — httpOnly cookie unreadable by JS + zero server validation = dead code (caused L178) | Eliminated | b4d5b23 | 2026-05-30 |

---

*Last updated: 2026-05-30 (re-audit TRUE-E2E-FULL etutor.ro cutover)*
