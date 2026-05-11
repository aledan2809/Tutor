# AUDIT_GAPS — Tutor
> Persistent ledger of open gaps. Items stay OPEN until resolved with evidence (commit hash + date).
> Source audit: `Reports/TRUE-E2E-FULL-2026-05-11.md`

---

## Open Gaps

### AGT-001 — No PATCH handler on admin/questions/[id]
**Status**: OPEN
**Priority**: HIGH
**Component**: `src/app/api/admin/questions/[id]/route.ts`
**Evidence**: `PATCH /api/admin/questions/{id}` → 405 Method Not Allowed
**Description**: Route exports GET, PUT, DELETE but no PATCH. Frontend or API consumers expecting PATCH for partial updates will fail silently with 405.
**Fix**: Add `export const PATCH = withErrorHandler(async (req, { params }) => { ... })` — partial update (title/text/options/status field-by-field). Alternative: document that PUT must be used for all updates.
**Audit**: 2026-05-11

---

### AGT-002 — Settings page blank at desktop viewport
**Status**: OPEN
**Priority**: MEDIUM
**Component**: `src/app/[locale]/dashboard/settings/`
**Evidence**: Journey audit G1 (student, 1440×900) → EMPTY. Mobile (390×844) showed content.
**Description**: Settings page renders blank at desktop viewport but has content at mobile. Likely a responsive CSS issue or a conditional render based on viewport.
**Fix**: Investigate `settings/page.tsx` — check for `useEffect` with client-only state that doesn't hydrate correctly at wider viewports.
**Audit**: 2026-05-11

---

### AGT-003 — Calendar page empty (requires Google Calendar OAuth)
**Status**: OPEN
**Priority**: MEDIUM
**Component**: `src/app/[locale]/dashboard/calendar/`
**Evidence**: Journey audit G1, G2 → EMPTY for student and instructor roles
**Description**: Calendar page renders empty — no events shown. Likely requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALENDAR_*` env vars to be configured in production.
**Fix**: (a) Add env vars for Google Calendar OAuth in VPS2 `/var/www/tutor/.env`, OR (b) add graceful "Connect Google Calendar" CTA for users who haven't authorized. Currently shows empty with no explanation.
**Audit**: 2026-05-11

---

### AGT-004 — Aviation bibliography not seeded
**Status**: OPEN
**Priority**: LOW
**Component**: database / seed scripts
**Evidence**: `GET /api/aviation/bibliography` → `{"items":[]}` despite bibliography CRUD working
**Description**: Aviation domain has no bibliography items. E4 scenario shows correct empty state but the feature is untestable without data.
**Fix**: Run `POST /api/admin/bibliography` with aviation domain items or add to seed script.
**Audit**: 2026-05-11

---

### AGT-005 — admin-test Puppeteer login blocked
**Status**: OPEN
**Priority**: LOW
**Component**: auth / rate-limiting
**Evidence**: Puppeteer login for admin-test@tutor.app redirects to `/api/auth/error` after multiple attempts in headless mode. API-level (E11-E15) tests all PASS.
**Description**: After multiple consecutive auth attempts (stress testing + G3/G4 attempts), admin-test account may be rate-limited or CSRF session state is inconsistent in headless Puppeteer.
**Fix**: (a) Clear rate-limit state for admin-test account, OR (b) use separate admin account for Puppeteer tests (e.g., create `puppeteer-admin@tutor.app`), OR (c) increase rate-limit window for test accounts.
**Audit**: 2026-05-11

---

### AGT-006 — No JSON bulk import for questions
**Status**: OPEN
**Priority**: LOW
**Component**: `src/app/api/admin/questions/bulk-import/`
**Evidence**: `POST /api/admin/questions/bulk-import` is an image/OCR endpoint — processes uploaded question images via AI vision, not JSON array
**Description**: No programmatic JSON bulk import for admin workflow. If admin needs to import 50+ questions from a spreadsheet/JSON, they must do it one by one via POST /api/admin/questions.
**Fix**: Add `POST /api/admin/questions/bulk-import-json` accepting `[{text, options, correctAnswer, domainSlug, lessonId?, tags?}]` array.
**Audit**: 2026-05-11

---

### AGT-007 — Mobile touch targets on dashboard content pages
**Status**: OPEN
**Priority**: MEDIUM
**Component**: dashboard content pages (practice, exams, assessment)
**Evidence**: Sidebar nav links fixed (min-h-[44px]) from prior session. Content page buttons NOT audited.
**Description**: Buttons on `/en/dashboard/practice`, `/en/dashboard/exams`, `/en/dashboard/assessment` may be below 44px touch target minimum on mobile viewports.
**Fix**: Per-page audit of action buttons — add `min-h-[44px] min-w-[44px]` to interactive elements.
**Audit**: 2026-05-11

---

### AGT-008 — a11y violations (a11y-scanner 55/100)
**Status**: OPEN
**Priority**: HIGH
**Component**: dashboard pages (multiple)
**Evidence**: Prior audit 2026-05-11 — a11y-scanner 55/100
**Description**: axe-core violations on dashboard pages. Likely missing ARIA labels, contrast issues, or heading hierarchy violations.
**Fix**: Run `npx @aledan007/tester journey-audit --headed` with a11y assertions enabled. Fix violations per page — priority: interactive elements, form labels, color contrast.
**Audit**: 2026-05-11

---

### AGT-009 — Mobile-tester 75/100
**Status**: OPEN
**Priority**: HIGH
**Component**: dashboard content pages (mobile viewport)
**Evidence**: Prior audit 2026-05-11 — mobile-tester 75/100 after sidebar fix (was lower before)
**Description**: Dashboard content pages have sub-optimal mobile experience. Likely touch targets, font sizes, or layout issues on content pages beyond the sidebar.
**Fix**: Use Website Guru (`POST guru.techbiz.ae/api/fix`) — trigger TWG fix loop on AGT-007 + AGT-009 combined.
**Audit**: 2026-05-11

---

## Eliminated Gaps

| Gap ID | Description | Status | Commit | Date |
|--------|-------------|--------|--------|------|
| (none yet) | — | — | — | — |

---

*Last updated: 2026-05-11*
