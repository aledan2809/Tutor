# TODO Persistent — Tutor

> Citit la FIECARE sesiune. Items rămân până marcate `[x]` cu dată + commit.

---

## [~] 🎯 Creator program (revenue-share perpetuu) — pagina LIVE; comisioane + teaser de făcut (creat 2026-05-26, pagina DONE 2026-05-27 commit `af05335`)

Plan complet în `knowledge/creator-program-plan.md`. Recrutăm creatori de conținut (profesori) care adaugă material pe materii și câștigă **comision perpetuu** (~40% pro-rata pe consum, plăți Stripe Connect). Promovare **idee-întâi** (fără URL platformă) → pagină dedicată creatorilor + waitlist.

**Domeniu DECIS 2026-05-27:** `etutor.ro` (achiziționat pe Hostico). Plan migrare Cloudflare DNS → VPS2 în `knowledge/etutor-migration-plan.md` (Faza 1 = acțiune user: Cloudflare + nameservers Hostico; Fazele 2-6 = eu, ~30-45min după ce DNS rezolvă).

**DONE 2026-05-27** (build #1 — pagina creatorilor): `/creatori` LIVE pe tutor.knowbest.ro (RO+EN, idee-întâi, fără URL platformă) — hero, cum funcționează, model comision transparent, materii deschise, FAQ + formular waitlist. Model `CreatorWaitlist` (migrare 0010) + `/api/creatori-waitlist` (zod, upsert-idempotent, public). Verificat end-to-end (POST salvează lead, validare, cleanup). Va rula pe `etutor.ro/creatori` automat după DNS.

**Build rămas:**
- [ ] (2) **sistem comisioane + Stripe Connect** (faza 4 din plan — atribuire conținut→creator, tracking consum, calcul lunar, payouts). Sesiune dedicată mare.
- [ ] (3) **campanie recrutare pe materii** (idee-întâi, 1 materie/săptămână, CTA = `/creatori`) — build în MA ca celelalte; start ~început iulie (după campaniile curente).
- [ ] migrare `etutor.ro` (vezi plan) — Faza 1 user, restul eu.

---

## 🎯 TRUE FULL E2E — multi-role business workflows

**Invocare**: [10] True Full E2E Audit — scope complet per CLAUDE.md §10.

**Roles disponibile**:
- **STUDENT** (enrolled in domain): practice sessions, exams, progress, bibliography, gamification
- **INSTRUCTOR** (enrolled with INSTRUCTOR role): groups, students, analytics, goals, reports, questions
- **ADMIN** (enrolled with ADMIN role): questions CRUD, domains, lessons, bibliography, subjects, tags
- **WATCHER** (enrolled with WATCHER role): watcher dashboard, student monitoring, escalation management
- **SUPER_ADMIN** (`isSuperAdmin=true`): all above + superadmin panel (users, plans, ads, revenue, vouchers)

**Test accounts (prod DB `tutor` on VPS2)**:
- `admin-test@tutor.app` / `vqAY88Ym7aJ7xwQM` — isSuperAdmin=true
- `instructor-test@tutor.app` / `m8JGvxUMDk8shUeE` — INSTRUCTOR role in domain aviation
- `test_student@test.com` / `TutorTest2024!` — STUDENT role
- `test_instructor@test.com` / `TutorTest2024!` — INSTRUCTOR role
- `test_admin@test.com` / `TutorTest2024!` — ADMIN role
- `test_watcher@test.com` / `TutorTest2024!` — WATCHER role

**Notes on aviation domain**: 24 PUBLISHED questions in DB. API routes are domain-prefixed: `/api/aviation/session/start`, `/api/aviation/exam/start`, `/api/aviation/xp`, etc. (NOT flat `/api/practice/` paths).

---

### A. Pre-requisites

- [x] **A1** — Verify all 6 test accounts accessible + correct roles in prod DB — 2026-05-11
- [x] **A2** — Verify domain `aviation` exists + has questions, lessons, bibliography seeded — 2026-05-11 (24 PUBLISHED questions; bibliography empty — see AGT-004)
- [x] **A3** — Provision test data: at least 1 practice session per student, 1 completed exam, 1 group per instructor — 2026-05-11

---

### E. Workflow Scenarios (happy path + edge cases)

- [x] **E1 — Student practice flow** — 2026-05-11 PASS
- [x] **E2 — Student exam flow** — 2026-05-11 PASS
- [x] **E3 — Student assessment flow** — 2026-05-11 PASS
- [x] **E4 — Student bibliography** — 2026-05-11 PARTIAL (0 items in aviation — see AGT-004)
- [x] **E5 — Student progress & gamification** — 2026-05-11 PASS
- [x] **E6 — Student notifications** — 2026-05-11 PASS
- [x] **E7 — Instructor group management** — 2026-05-11 PASS
- [x] **E8 — Instructor student monitoring** — 2026-05-11 PASS
- [x] **E9 — Instructor questions** — 2026-05-11 PASS
- [x] **E10 — Instructor reports + analytics** — 2026-05-11 PASS
- [x] **E11 — Admin question management** — 2026-05-11 PARTIAL (GET/POST/PUT/DELETE PASS; PATCH 405 bug — see AGT-001)
- [x] **E12 — Admin domain management** — 2026-05-11 PASS
- [x] **E13 — Admin lessons + bibliography** — 2026-05-11 PASS
- [x] **E14 — Watcher monitoring** — 2026-05-11 PASS
- [x] **E15 — SuperAdmin panel** — 2026-05-11 PASS (all 7 API endpoints)
- [x] **E16 — Auth flows** — 2026-05-11 PASS
- [x] **E17 — Locale switch** — 2026-05-11 PASS

---

### F. Concurrency

- [x] **F1** — 2 students simultaneous sessions → no collision — 2026-05-11 PASS
- [x] **F2** — Student + instructor concurrent progress read → consistent — 2026-05-11 PASS

---

### G. Browser Real (headed, Tester journey-audit)

- [x] **G1** — Student role walk — 2026-05-11 (14 OK, 1 HAS_ERRORS/Exams, 2 EMPTY/Calendar+Settings)
- [x] **G2** — Instructor role walk — 2026-05-11 (15 OK, 2 EMPTY/Calendar+Settings)
- [x] **G3** — Admin role walk — 2026-05-11 (API tests PASS; Puppeteer login blocked — AGT-005)
- [x] **G4** — SuperAdmin role walk — 2026-05-11 (API tests PASS; same Puppeteer blocker)
- [x] **G5** — Mobile viewport (390×844) — 2026-05-11 PASS (7/7 OK)

---

### H. Parity

- [x] **H1** — Local dev vs prod: same feature set — 2026-05-11 PASS
- [x] **H2** — EN↔RO locale: all pages translate, no missing keys — 2026-05-11 PASS
- [x] **H3** — Unauthenticated redirect to signin with callbackUrl — 2026-05-11 PASS

---

### I. Stress

- [x] **I1** — 10 concurrent practice session starts → no 500s — 2026-05-11 PASS
- [x] **I2** — 50 questions bulk import — 2026-05-11 N/A (image-only endpoint; no JSON bulk import — AGT-006)

---

## [ ] Mobile touch targets — dashboard content pages

**Status**: sidebar.tsx fixed (min-h-[44px] on nav links). Dashboard page content needs per-page audit.
**Scope**: mobile-tester currently 75/100. Likely affected: buttons on practice, exam, assessment pages.
**Gap**: AGT-007 + AGT-009 in AUDIT_GAPS.md

---

## [x] AUDIT_GAPS.md — create + populate — DONE 2026-05-11

Created `Tutor/AUDIT_GAPS.md` with 9 gaps from TRUE-E2E-FULL-2026-05-11 audit.

---

## [ ] Fix AGT-001 — PATCH handler on admin/questions/[id]

Add `export const PATCH` to `src/app/api/admin/questions/[id]/route.ts` for partial updates.

---

## [ ] Fix AGT-003 — Calendar page empty

Configure Google Calendar OAuth env vars on VPS2 OR add "Connect Google Calendar" CTA with clear explanation.

---

## [ ] Fix AGT-004 — Seed aviation bibliography

Run POST /api/admin/bibliography to add items for aviation domain.

---

## [ ] WG Fixes — a11y 55/100 + mobile-tester 75/100

Use Website Guru (`POST guru.techbiz.ae/api/fix`) to fix AGT-008 (a11y) + AGT-009 (mobile touch targets).

---

## Session Log

| Date | Change |
|------|--------|
| 2026-05-11 | Created. E2E [9] done (CODE 89/100, Journey 17/17 OK). Sidebar focus trap + touch targets + contrast + dangerouslySetInnerHTML + cookie Secure flag fixed. |
| 2026-05-11 | True Full E2E [10] COMPLETE. 31/35 PASS (89%). Bugs: AGT-001 (PATCH 405), AGT-002 (Settings blank), AGT-003 (Calendar empty), AGT-004 (bibliography empty), AGT-007/009 (mobile touch targets). Reports/TRUE-E2E-FULL-2026-05-11.md + AUDIT_GAPS.md created. |
