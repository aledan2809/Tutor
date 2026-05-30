# TRUE E2E FULL AUDIT — Tutor — 2026-05-30

**Mode**: [10] True E2E Full Audit (Max-Speed Y) · **Target**: `https://etutor.ro` (VPS2:3013, local PG `tutor`/`tutor_app`)
**Trigger**: re-audit after the **etutor.ro domain cutover (2026-05-27)** + 3 new features since the 2026-05-11 baseline.
**Branch**: `master` @ `49f3559` · **Predecessor**: `TRUE-E2E-FULL-2026-05-11.md`

## Verdict: ✅ PASS — 0 real P0/P1

The domain cutover and all new features are validated working on the live domain. No new regressions. Every "failure" surfaced by the tooling was triaged to a non-bug (heuristic noise or self-inflicted rate-limit). Pre-existing minor a11y/mobile polish on the **signin page** is the only real open item (P2/P3).

---

## Scope-vs-Completed matrix

| Phase | Tool | Result |
|------|------|--------|
| 0 — `/review` baseline | manual review of 5 cutover/feature commits | ✅ clean — admin CRUD properly SuperAdmin-gated; CSRF dormant-but-safe |
| 1 — Pre-reqs (A1-A3) | prod DB + 8 test accounts + 1409 questions verified via SSH/psql | ✅ |
| 2 — [7] E2E CODE | `e2e-audit-runner --url etutor.ro --db-url <tunnel>` | ✅ **91/100**, 10 plugins, triaged |
| 3 — [8] Journey | `npx @aledan007/tester journey-audit` (SuperAdmin + Student) | ✅ SuperAdmin **17/17 OK**, Student 14 OK + 1 false-positive + 2 thin |
| 4 — TRWG-GW | Tester-Gateway `/run tutor` (13 screenshots) | ✅ ran; 0 real P0/P1 (all = 429 rate-limit artifacts, proven) |
| 5 — TWG loop | n/a | ⏭️ skipped — no real P0/P1 to fix |
| 6 — Workflow E1-E17 | inherited (logic unchanged since 2026-05-11) + UI re-confirmed via journey | ✅ |
| 7 — Concurrency F1-F2 | inherited (session/practice APIs untouched by the 5 commits) | ✅ |
| 8 — Browser real G1-G5 | journey walks per role (SuperAdmin + Student) + signin screenshots | ✅ |
| 9 — Parity H1-H3 | live curl matrix | ✅ RO locale 200, unauth→signin+callbackUrl, old/www domains 301→etutor.ro |
| 10 — Stress I1-I2 | inherited | ✅ |

---

## New features validated live (the actual delta since 2026-05-11)

| Feature | Commit | Evidence |
|---|---|---|
| **L178 CSRF route move** (`/api/auth/csrf` → `/api/csrf`, unbreaks NextAuth login) | `5b9cc3c` | Clean login → **HTTP 302 + valid session** (Admin Test, isSuperAdmin, aviation enrollment). `/api/csrf` → 200+token. `/api/auth/csrf` now owned by NextAuth catch-all. |
| **etutor.ro cutover** | `1abd226`,`e484470`,`bf8c460` | `/` `/ro` `/en/privacy` `/ro/privacy` 200; `tutor.knowbest.ro/` **301→etutor.ro**; `www.etutor.ro` **301→etutor.ro** (Hostico www typo appears resolved); SSL OK. |
| **Creator waitlist page** | `295e143`,`f60cd8d` | `/ro/creatori` → **200**. |
| **Creator waitlist admin CRUD** | `49f3559` | `POST /api/admin/creatori` unauth → **403**; route source confirms `requireSuperAdmin()` on POST/PATCH/DELETE + input validation + P2002/P2025 handling. |
| **Show/hide password toggle** | `f15c8e1` | Visible + functional in TG signin screenshots. |

---

## Findings triage (why every "failure" is not a bug)

### TRWG-GW reported 2 P0 + 2 P1 — ALL rate-limit artifacts (self-inflicted)
Root cause: the audit suite (2 full journey walks ≈ 34 page loads + dozens of curl checks + TG auth attempts, all from one IP within ~15 min) tripped the legitimate per-IP auth rate-limiter at `src/middleware.ts:89` (429 "Too many requests").
- **P1 `POST /api/auth/callback/credentials → 429`** and **P1 `GET /api/auth/session → 429`** = the rate-limiter firing. (2026-05-11 also logged session-429 as "SAME".)
- **P0 "Login did not reach expected URL"** = downstream of the 429 (throttled login can't reach /dashboard). After-submit screenshot shows form still filled on signin page.
- **P0 "Uncaught page error: Failed to construct 'URL': Invalid URL"** = NextAuth client choking on the 429 response body (expects JSON, gets 429). The signin page itself contains **no `new URL(` call**.
- **Proof it's not a real bug**: after a 75s cooldown, a single clean credentials login → **HTTP 302 + valid session JSON**. Login works. A real user from one IP never approaches this threshold.

### [8] Journey "Exams HAS_ERRORS" (Student) — false positive
`errorMarkers=3` is a body-text heuristic matching the word **"FAILED"** in the student's legitimate Exam History badges (2 past 0% attempts) + the "Failed" filter tab. Screenshot confirms a fully-working Exam Simulator (stats, Start Practice, history). Same heuristic noise as 2026-05-11. httpStatus=200.

### [8] Journey "Calendar / Settings EMPTY" (Student) — thin pages, known
Low `bodyLen` (~206). Pre-existing thin-content pages; SuperAdmin classified them OK. AGT-002/003 territory (loading-state polish), not functional breakage.

### [7] CODE "Stripe/OAuth creds in package.json" (P1) — AI summarizer hallucination
The security-scanner plugin scored **100/0 issues**. `package.json` only lists `@stripe/stripe-js` as a dependency — no secrets. Discard.

### [7] CODE a11y/mobile "on /dashboard" — actually the SIGNIN page
The runner audits unauthenticated, so `/dashboard` 307-redirects to `/en/auth/signin` and the plugins measure the signin page:
- "10/10 touch targets <44px" = signin footer links (Forgot password / magic link / Create one / ToS / Privacy).
- "color contrast 4 instances" + "links distinguishable without color" = muted signin text ("Or continue with", "Use magic link instead", "By signing in…").
- axe "focus trap" = low-confidence automated finding on the centered card.
These are **minor signin-page a11y/mobile polish (P2/P3)** — NOT authenticated-dashboard regressions. The real authenticated dashboard + content pages render correctly (verified via real-login journey walk, 17/17) and their AGT-007/008/009 fixes from 2026-05-11 stand.

---

## Role coverage matrix

| Role | Account | Coverage | Result |
|---|---|---|---|
| SUPER_ADMIN | `admin-test@tutor.app` | journey 17/17 + clean login 302 + admin CRUD gating | ✅ |
| STUDENT | `test_student@test.com` | journey 14 OK (+1 FP, +2 thin) | ✅ |
| INSTRUCTOR / ADMIN / WATCHER | (accounts exist, verified A1) | inherited from 2026-05-11 E7-E15; APIs untouched by the 5 commits | ✅ inherited |

> Honest note: INSTRUCTOR/ADMIN/WATCHER deep flows were **not** re-walked interactively this session. The 5 commits since 2026-05-11 touched only signin / creatori / csrf / domain-URLs — none of the group/question/monitoring APIs — so those flows are unchanged. SuperAdmin (superset) journey + clean login cover the auth surface that the cutover actually risked.

---

## Open gaps after this audit

| Gap | Severity | Note |
|---|---|---|
| AGT-010 (new) | P2/P3 | Signin-page a11y/mobile polish: footer links <44px touch target + muted-text contrast (`Use magic link instead`, `By signing in…`). Surfaced by [7] via unauth /dashboard→signin redirect. |
| CSRF cleanup (carryover) | P3 | `/api/csrf` system is dormant (httpOnly cookie + no server-side validation). Decide: re-implement properly (non-httpOnly cookie + middleware validate) OR delete route+interceptor+lib. Harmless as-is. |
| L178 anti-pattern sweep (carryover) | P3 | grep ecosystem for custom routes under `/api/auth/*`. |

No P0/P1 open.

---

## Artifacts
- [7] CODE report: `Reports/AUDIT_E2E_2026-05-30.md` (91/100)
- [8] Journey: `journey-audit-results/tutor/report.json` + screenshots
- TRWG-GW: `Tester-Gateway/reports/tutor/2026-05-30T22-31-52-707Z-gmul/` (13 screenshots + summary)
- TG config updated to live domain: `Tester-Gateway/apps/tutor.json` (baseUrl `tutor.knowbest.ro`→`etutor.ro`, loginUrl `/auth/login`→`/en/auth/signin`)

## User-side carryover (from 2026-05-28 handoff, non-blocking)
1. Google OAuth Console — add `https://etutor.ro` origin + `…/api/auth/callback/google` + `…/api/calendar/callback` (Google login + Calendar sync 404 until then; email+password login works).
2. Resend domain verify for `etutor.ro` (magic-link + reset emails).
3. certbot dry-run check ~2026-08-15 (cert expires 2026-08-25).
