# Project Status - Tutor
Last Updated: 2026-06-10 (continuare: BAC Mate M1 grile Faza A COMPLETĂ 83/14 + Faza B pilot 2024 simulare)

## Current State (Sesiunea 2026-06-10 — continuare mesh: Faza A complete + Faza B pilot)

### Done (LIVE pe etutor.ro, verificat)
1. **BAC Mate M1 grile — Faza A COMPLETĂ 14/14 lucrări** (`abbf891`) — +8 lucrări (48 grile noi): 2023 sim/var-01/var-06/var-07 + 2024 sim/var-03/var-09/var-10. **0 itemi sări** (toate 48 transcriabile; itemii „Arătați că" proof — vectori, perpendicularitate — reframate ca MCQ concret ancorat în barem, ex. „dreptele sunt: perpendiculare"). 3 misread-uri prinse la cross-check (L10): 2023sim I.4 = „cel mult două cifre" (0–99=100) NU „două cifre"; 2023v01 I.5 A(4,0) NU A(0,4); 2024v10 I.4 set {1,2,4,6,8,9} (ratase „8"). Import idempotent VPS2 → **83 grile / 14 lucrări LIVE** (API `etutor.ro/api/public/practice/subjects` → „Matematică M1 (Mate-Info)" count=83). `/code-review` = recalcul matematic independent al tuturor 48 → ALL 48 OK, zero buguri.
2. **BAC Mate M1 SIMULĂRI — Faza B pilot 2024 simulare** (`b3e86b4`) — creat `scripts/import-exam-bac-matematica-m1-batch.mjs` (scaffold `PAPERS[]`, clonă din `-model`). Lucrare completă: SI 6×SHORT+finalAnswer+rubric; SII (matrice A(x) det/inversă + lege compoziție x∗y) + SIII (analiză f=(x+6)√(x²+4) monotonie + integrale/șir Iₙ) câte 2×OPEN cu rubric a/b/c, transcris VERBATIM din subiect+barem CNPEE. Math II+III re-verificat independent (agent) → ALL OK. Import VPS2 → ExamPaper 67→68 (2024 model+simulare, 10 items fiecare, isActive). Verif: DB query (structură identică cu 2024 model care randează în UI).
3. **TODO** — adăugat item UX tooltips explicative (mouseover) pe pagina de Practică (cerere user, `64906f8`).

### RĂMAS (în TODO_PERSISTENT.md)
- Faza B simulări: **12 lucrări** rămase (2022 model/sim/v01/v03 + 2023 model/sim/v01/v06/v07 + 2024 v03/v09/v10) — append în `PAPERS[]` per rețeta dovedită de pilot.
- BAC M2 + M3: grile + simulări (domenii create, goale).
- UX tooltips pe /dashboard/practice.

### Backups DB VPS2
- `tutor-pre-mate-m1-faza-a-2026-06-10.dump` (pre grile Faza A)
- `tutor-pre-mate-m1-simulare-2026-06-10.dump` (pre Faza B pilot)

### Lessons Learned (sesiunea 2026-06-10 continuare)
- **none novel** — reîntărit **L10** (cross-check subiect+barem+calcul a prins 3 misread-uri noi). Rafinare politică grile (nu lecție nouă): itemii „Arătați că/proof" sunt reframabili ca MCQ concret ancorat în barem → 0 skips Faza A (vs. ~5 skips estimați inițial). Aplicate: barem-anchored grile, idempotent import VPS2, adversarial math re-verify prin agent înainte de deploy.

## Current State (Sesiunea 2026-06-10)

### Done (toate LIVE pe etutor.ro, verificate autentificat)
1. **BAC Matematică — taxonomie 3 programe** (`03c0bef`) — `scripts/band-matematica-bac.mjs` creează 3 domenii distincte `matematica-{m1,m2,m3}-ix-xii` (NICIODATĂ mixate, cerere user). Fiecare program = domeniu + `subjectKey` (`matematica_m{n}`) + tag grile (`bac-grile-mate-m{n}:`) proprii.
2. **Pilot M1 model 2024** (`03c0bef`) — 6 grile (Subiectul I, barem-anchored) + simulare completă (10 itemi, I+II+III, 90+10). Verificat live: notația Unicode randează intact (UI fără KaTeX), grupat sub „Bacalaureat → Matematică M1 (Mate-Info)".
3. **Batch grile M1 — 6/14 lucrări** (`16b6006`) — +2022 model/simulare/var-01/var-03 + 2023 model = **35 grile LIVE**. Toate cross-checked manual (L10 a prins 2 misread-uri barem: 2022v03 I.3=`{−3/2,1}`, 2023mod I.1 b=−2). Toate 13 lucrările batch = fără figuri (Mate-Info algebră+analiză).
4. **Dropdown Categorie→Subcategorie pe Simulări** (`0915029`) — `src/components/exam-bank/exam-bank-browser.tsx` (client) + server page rebuild: `<select>` optgroup nivel + option materie (ca la Grile), fără scroll lung. Verificat live (optgroups EN_VIII+BAC, opțiuni randate).

### RĂMAS (documentat în TODO_PERSISTENT.md secțiunea BAC Matematică)
- Faza A grile: 8 lucrări (2023 sim/v01/v06/v07 + 2024 sim/v03/v09/v10).
- Faza B simulări: 13 lucrări (II+III multi-part + rubric).
- BAC M2 (`~/Downloads/Temp/BAC-Mate M2 Stiintele naturii/`) + BAC M3 (`~/Downloads/Temp/BAC-MATE - M3 Tehnologic/`) — domenii deja create, goale.

### Lessons Learned (sesiunea 2026-06-10)
- **L10** — în `knowledge/lessons-learned.md`: pentru un examen de matematică, transcrie din PDF RANDAT la PNG (citit vizual), nu din dump-ul fitz (math dezordonată); cross-check obligatoriu subiect+barem+calcul manual pe fiecare semn (a prins „=−1" vs „1", b=2 vs b=−2, `{−2,1}` vs `{−3/2,1}`); UI fără KaTeX → Unicode inline; „3 subcategorii nemixate" = 3 domenii + 3 subjectKeys (constraint unique altfel se ciocnește).

## Current State (Sesiunea 2026-06-09)

### Done (toate LIVE pe etutor.ro, verificate autentificat)
1. **Topics + Weak Areas granulare** (`439eb1b`) — `scripts/lib/macro-topic.mjs` (micro→capitol determinist, 72/72 smoke), importer re-clasifică 596 grile, `session-engine.ts` timer decuplat de secțiune. L08.
2. **TF_GRID → 48 grile A/F** (`69149e3`) — 8 griduri RO expandate în MCQ Adevărat/Fals, RO 56→104.
3. **Promo pricing** (`0b88b40`+`fe99ecd`) — preț normal tăiat roșu + wording „revin la normal", data-driven (`src/lib/pricing.ts`, auto-expiră 2026-09-01), /preturi + /parinte RO+EN.
4. **Categorisire dropdown homepage + pagini logate** (`303f877`+`1495b48`+`02ba02e`) — `src/lib/exam-level.ts` (slug/examType→EN_VIII/BAC). Demo homepage + Grile picker (`/dashboard/practice`) grupate pe nivel (Aviation/Drept/Istorie/goale ascunse) + Simulări (`/dashboard/exam-bank`) nested nivel→materie→an.
5. **BAC Română COMPLET** — `47776c4`→`60c242e`:
   - **75 grile** ancorate în barem (`scripts/import-grile-bac-ro.mjs`), domeniu `romana-ix-xii`, vizibile sub „Bacalaureat" în dropdown + Grile. 13 lucrări × (6 grile, 2023×5).
   - **13 simulări-eseu complete** (`scripts/import-exam-ro-bac-batch.mjs` pt 11 + 2 scripturi individuale pt model/simulare 2025) — Subiectul I (text+A+B) + II + III, 90+10, în Simulări.
   - L09.

### Lessons Learned (sesiunea 2026-06-09)
- **L07/L08/L09** — deja în `knowledge/lessons-learned.md`. L07 (official-verbatim>AI + i18n + owner-preview); L08 (group analytics pe capitol nu secțiune + decuplare câmp repurposat); L09 (grile dintr-un examen de eseu = ancorate în barem, nu AI + „show X in surface Y" cere ca Y să poată randa X + onorează jumătatea negativă a instrucțiunii).


## Session 2026-06-04 (PM) — Exam-bank CNCE import: 2022 Mate complete (Test_01..06) + Română queued

### Done
- Imported EN VIII **2022 Mate Test_01..06** (6 papers) end-to-end via the playbook recipe — closes the whole `pro-matematica2` CNCE series (2021 Test_02..15 + 2022 Test_01..06).
- Per paper: transcribe verbatim → `import-exam-mate-2022-test-0N.mjs` + `spec-2022-test-0N.json` → `--validate` → fig_inspect → **figures via 4uPDF `/api/extract-region`** @ 300 DPI → montage-verify → commit+push → VPS2 pull + prod import + `pm2 restart tutor` → **authenticated score verify on etutor.ro** (all 60/60 + finalCheck) → **mesh `/review`** (math re-derivation + policy, all `[]`).
- Commits: T01 `9976b78`, T02 `78f21e9`, T03 `92f82b6`, T04 `a9c9fb2`, T05 `fdecb71`, T06 `c3d7b86`.
- **Prod DB: 46 papers / 828 items** (2021 Test_02..15 + 2022 Test_01..06). Backup pre-import `/root/backups/tutor-pre-exambank-2022test01-2026-06-04.dump`.
- New reusable tooling: `scripts/exam-figures/extract_4updf.py` (JSON-spec 4uPDF region extractor + montage) + `/tmp/verify-paper.mjs` (generic authenticated score verifier from a prod map).
- 2 barem/source anomalies caught + handled (see Lessons L04/L05): Test_04 SII.6 official barem typo (printed "a", correct 8√2=b — used math-correct, confirmed by /review); Test_05 SII.4 OCR dropped √ (BC=5 → BC=√5, back-solved from key).
- **Limba română EN VIII** added to TODO_PERSISTENT with the full confirmed structure (2 passages + 9A + 8B + 1 composition; 8 papers in `heiprofu-romana`). Scoped from 2025 Simulare; not yet imported.

### Pending
- **Limba română EN VIII — 8 papers** (`heiprofu-romana`): 2024 var_07, 2025 var_07/model/simulare/rezerva/sesiune-speciala, 2026 model/simulare. Bigger lift each (verbatim literary text passages + comprehension + composition rubrics, mostly OPEN). Recipe + structure in TODO_PERSISTENT. 4uPDF venv `/tmp/4updf-venv` + token `/tmp/figtoken.txt` + backend :8099 left running for resume.
- Bigger Tutor feature items + homepage demo restriction (unchanged in TODO_PERSISTENT).

## Lessons Learned (sesiunea 2026-06-04 PM)
- **L04** — official barem answer-key can be wrong; math-prove every MCQ key, override + document a typo (Test_04 SII.6: barem "a", correct 8√2=b).
- **L05** — a "geometrically impossible" MCQ usually means a dropped √/symbol in OCR — back-solve from the barem key before trusting the text (Test_05 SII.4: BC=5 → BC=√5).
- (knowledge/lessons-learned.md L04, L05)

---

## Session 2026-06-04 (AM) — Exam-bank CNCE import: 2021 batch complete (Test_03..15)

### Done
- Imported EN VIII 2021 Mate training tests **Test_05..15** (11 papers) end-to-end via the proven playbook recipe. Test_03/04 done earlier same day; Test_02 the prior session.
- Each paper: transcribe verbatim (barem = ground truth) → `scripts/import-exam-mate-2021-test-NN.mjs` (copy template) → `--validate` → fig_inspect bboxes → **figures via 4uPDF `/api/extract-region`** @ 300 DPI (tested 4uPDF backend functionality per user request) → montage-verify → commit+push → VPS2 pull + prod import + `pm2 restart tutor` → **authenticated score verify on etutor.ro** (all 60/60 + finalCheck) → **mesh `/review`** (2 agents: math re-derivation vs barem + logic/template) — all returned `[]`.
- Commits: T05 `108963f`+`f64ddbe`, T06 `afb9f47`, T07 `4d65d52`, T08 `07050e1`, T09 `6def162`, T10 `8a81b94`, T11 `8c296e3`, T12 `8f11206`, T13 `469d677`, T14 `7ef02ee`, T15 `03f1b30`; TODO sync `317c4be`.
- **Prod DB: 40 papers / 720 items** (2021 Test_02..15 complete). Backup pre-batch `/root/backups/tutor-exambank-pre-test14-2026-06-04.dump`.
- Validated 4uPDF extract-region across figure types incl. **vector pie chart** (T15 s1-6) — renders fine, no raster xref needed.

### Pending
- **2022 Test_01..06** (6 papers) — user chose to stop here; same recipe. 4uPDF venv `/tmp/4updf-venv` + token `/tmp/figtoken.txt` + backend on :8099 left running for resume.
- Bigger Tutor feature items + homepage demo restriction (unchanged in TODO_PERSISTENT).

## Lessons Learned (sesiunea 2026-06-04)
- **L03** — 4uPDF `/api/extract-region` `page` param = physical PDF page (= fig_inspect PAGE N, no offset); renders vector figures (pie chart) too; montage-verify is the cheap catch. (knowledge/lessons-learned.md)

---

# Project Status - Tutor
Last Updated: 2026-04-22 (Anto Approve/Delete permissions fix)

## Session 2026-04-22 (late) — Bug fix: Anto couldn't Approve/Delete questions

### Context
User Anto (`vladalionescumariaantonia@gmail.com`, roles `[ADMIN, INSTRUCTOR, STUDENT]` on Aviation, `isSuperAdmin=false`) got 403 Forbidden when clicking Approve or Delete on any question in `/dashboard/admin/questions`. Task was originally routed to AIP2 pipeline but pipeline scope-crept (modified 75 unrelated files) — killed + reverted, fix done Direct mode. Full incident analysis in Master/DEVELOPMENT_STATUS.md.

### Root Cause
`src/app/api/admin/questions/[id]/route.ts` PUT (status change / Approve) and DELETE handlers both called `requireAdmin()` from `src/lib/admin-auth.ts`, which enforces `session.user.isSuperAdmin === true`. Domain admins/instructors were rejected even when acting on questions within their own domain.

### Fix (commit `1029663`)
1 file changed, +19/-5 lines:
- `src/app/api/admin/questions/[id]/route.ts`:
  - Import `requireDomainAdmin` alongside `requireAdmin`
  - `_PUT` + `_DELETE`: fetch `question.domainId` first → call `requireDomainAdmin(question.domainId)` → then apply update/delete. Returns 404 if question not found; 403 only if user is neither superAdmin nor ADMIN/INSTRUCTOR of that domain.
  - `_GET` unchanged (superAdmin-only, not part of the reported bug)

### Deploy (VPS2, `tutor.knowbest.ro`)
- VPS2 had 6 uncommitted local edits (admin-auth.ts, questions/route.ts, question-list.tsx, instructor-nav.tsx, en/ro.json, package-lock) — content matched exactly the prior commit `ec08c8d` (someone had manually hot-fixed during a past session). Stashed via `git stash push --include-untracked -m "Pre-deploy backup of duplicated hot-fix work matching ec08c8d (2026-04-22)"` (stash@{0}).
- `git pull origin master` brought `ec08c8d` + `1029663`. Build PASS. PM2 restart tutor (PID 653912). HTTP 307 redirect response confirms app online.

### Verifications
1. **Journey audit (E2E mode 8)** — logged in as `instructor-test@tutor.app` (INSTRUCTOR-only on Aviation, similar role to Anto). 14 sidebar pages walked:
   - 12 OK (Dashboard, Lessons, Bibliography, Practice, Assessment, Exams, Progress, Domains, Notifications, Gamification, Instructor Questions, Admin Questions)
   - 2 EMPTY (Calendar, Settings — both `bodyLen=195`, no crash, just sparse content for test user)
   - 0 errors / 0 gated / 0 crashes
   - Reports + full-page screenshots in `journey-audit-results/tutor/`
2. **Targeted API verification** (puppeteer login + fetch):
   - Login as instructor-test succeeded
   - `GET /api/admin/questions?status=APPROVED&limit=1` returned 200 with question `cmnyl2v7m001c139jjg4q52w1` (Fizică, Aviation)
   - `PUT /api/admin/questions/cmnyl2v7m001c139jjg4q52w1` with `{status: "APPROVED"}` returned **200** (pre-fix: 403)
   - Fix confirmed end-to-end. Anto (more roles than instructor-test) satisfies `requireDomainAdmin` a fortiori.

### Files Created/Modified
- `src/app/api/admin/questions/[id]/route.ts` — modified (committed `1029663`)
- `.journey-audit.json` — NEW (root config for Tester `journey-audit` CLI, based on `tradeinvest.json` template; nav list + auth path `/en/auth/signin` + emailEnv/passwordEnv)
- `journey-audit-results/tutor/` — NEW (generated by audit run; 14 screenshots + `report.json`)

### Not Done / Follow-ups
- `.journey-audit.json` + `journey-audit-results/` are currently untracked — decide if `results/` should be gitignored and `.journey-audit.json` committed. Template suggests: commit the config, ignore the results.
- Anto likely wants confirmation. No notification sent — she can retest manually on `tutor.knowbest.ro`.

### Technical Notes
- `requireDomainAdmin(domainId)` in `src/lib/admin-auth.ts` is the correct helper for any per-question/per-domain admin action; `requireAdmin()` should stay reserved for cross-domain operations (e.g. global domain management, user impersonation).
- The bundler-independent pattern (fetch existing entity first, then authorize on its domain) is also how `requireAdminOrInstructor` is used in the list endpoint `/api/admin/questions/route.ts`.

---

## Current State

### Working
- Auth: Google OAuth, Magic Link, Credentials, Forgot Password, Self-Registration
- JWT role refresh on every token refresh (no logout/login needed after role change)
- Admin: Overview, Questions (card list, sorted by bookOrder), Review Queue (mobile-friendly), Domains, Tags, Subjects/Topics, Import, Import Book (scanned PDF OCR), AI Generate, From Content, Lessons, Bibliography, Exam Formats, Templates, SuperAdmin
- Question flow: DRAFT → APPROVED → PUBLISHED, quick-action buttons (Approve/Publish) on cards
- Source references with [Topic] + book page + Q number + answer page (editable by admin)
- Bibliography per-domain (DRAFT→APPROVED→PUBLISHED), student sees only approved, button on domain card
- Import Book pipeline with full fallback chain (text PDF → scanned PDF → 4uPDF OCR → AI structure → preserve bookOrder)
- Web Push (VAPID configured), Bulk import, AI Generate, From-Content (upload theory → AI generates questions)
- Domain CRUD, 2 active domains: Aviation (57 Q), Drept Penal și Procedura Penală (1385 Q from Udroiu 2023)
- Students: Practice (SM-2), Exams, Bibliography, Progress, Gamification (XP, streaks, leaderboard)
- Role-based + mobile-first UI + bottom nav
- Deployed: tutor.knowbest.ro (VPS2, port 3013, PM2 + ecosystem.config.cjs)

### Users Created
- Alex Danciulescu (alexdanciulescu@gmail.com) — SuperAdmin
- Anto (vladalionescumariaantonia@gmail.com) — ADMIN+INSTRUCTOR+STUDENT on Aviation & Drept Penal
- Alina (student) — tested Drept Penal successfully after answer-prefix fix
- Rares (rares.danciulescu2004@gmail.com) — STUDENT on Aviation
- Test users: test_admin / test_instructor / test_student / test_watcher (TestPass123!)

### In Progress
- (none)

### Not Started
- Forgot Password: email delivery needs SMTP config on VPS (logic done, email skipped if no SMTP)
- Web Push: VAPID keys set, needs real browser user opt-in testing
- Content for other domains (EN, BAC subjects — ready to import with new Import Book pipeline)

## Recent Changes (2026-04-11 — 2026-04-16)

### 2026-04-16 (Book Import Pipeline + Bibliography + Answer Fix)
- feat: STRATEGY.md v1.2 — full product strategy with 8 phases, Referral Engine (perpetual commission 2 levels), Content Sourcing plan, IVP, per-subject pricing with seasonal vouchers
- feat: Question schema with bookOrder, pdfPage, bookPage, qNumberInBook, chapterIndex for preserving book order on import
- feat: All import pipelines (bulk-import, from-content, ai-generate) auto-populate bookOrder using aggregate max
- feat: New /admin/questions/import-book page — specialized UI for scanned PDFs with pipeline details
- feat: Question list + Review Queue sorted by bookOrder — instructors see questions in exact book order
- feat: Bibliography CRUD with DRAFT→APPROVED→PUBLISHED workflow, per-domain
- feat: Student Bibliography view + button on each enrolled domain card
- feat: Udroiu 2023 seeded as initial bibliography entry for Drept Penal (APPROVED)
- feat: Editable sourceReference field in question edit form (amber input, Admin/Instructor only)
- feat: Source references now include [Topic] — "Udroiu..., p.3-4 [Principiile aplicării legii penale], Q1 / Answers p.8-9"
- feat: 1385 Drept Penal questions imported from Udroiu (OCR + AI + letter-verified answers)
- feat: Vision-verified page formula (book = pdf*2 - 18) via Anthropic Claude Haiku 4.5 Vision on 281 PDF pages
- fix: Session answer check — strip letter prefix (a)/b)/c) from both answer and correctAnswer before comparison
- fix: Options stripped of "a. ", "b. " prefixes; correctAnswer re-prefixed with letter for instructor clarity
- fix: pdf-parse downgraded to v1.1.1 (v2 broke API); use pdf-parse/lib/pdf-parse.js to bypass test file lookup
- fix: Scanned PDF auto-detected (< 200 chars extracted) → routed through 4uPDF OCR service
- fix: All uploaded files (PDF/DOCX/CSV/images) saved to uploads/ for reprocessing safety

### 2026-04-16 (Mobile UX + Admin flow)
- feat: Question List redesigned as cards (was 10-col table) — clickable, mobile-friendly, Approve/Publish buttons
- feat: Review Queue shows all options immediately (no expand), correct answer highlighted by letter index
- feat: Instructor can edit questions regardless of status (removed ADMIN-only restriction from requireAdmin)
- fix: Double-locale /en/en redirect — stripped locale from callbackUrl in middleware
- feat: Added sourceReference to PUT/POST schemas + editable input in edit form

### 2026-04-15 (Auth features)
- feat: Forgot Password flow — email with reset link, token validation, password update
- feat: Self-registration page — name, email, password, optional domain enrollment
- feat: Public domains API (/api/domains/public) for registration domain picker
- feat: "Forgot password?" and "Create account" links on signin page
- fix: Added /auth/register, /auth/forgot-password, /auth/reset-password as public routes

### 2026-04-15 (Tester audit)
- fix: Lessons page crash — domainId validated with .uuid() but Prisma uses CUID
- fix: session/start and exam/start crash with 500 when called without JSON body
- fix: Daily challenge always unavailable — difficulty threshold lowered (>= 4 → >= 3 with fallback)
- fix: Exam page empty — created Aviation Standard Exam format (20 questions, 30 min, 75% passing)
- fix: Escalation cron missing CRON_SECRET env var — added to .env

### 2026-04-15
- feat: Domain cards clickable with role-based action buttons (Practice, Exams, Questions, Edit Domain)
- fix: Options rendering empty in practice — normalize string[] to {label,value}[]
- fix: Self-enroll button not working — CUID vs UUID validation
- feat: Show all questions (incl DRAFT) for ADMIN/INSTRUCTOR on student domains page
- feat: Role upgrade/downgrade on enrollment — sets exact roles, pre-populates existing
- fix: Auth rate limit increased from 5 to 20 req/min
- feat: Prev/Next navigation on question edit page

### 2026-04-14
- feat: Multi-file upload for image import
- feat: 2-step AI Vision extraction (Groq transcribe → Mistral structure)
- Processed 7 handwritten images → 57 questions saved
- feat: Images saved on server for debugging/reprocessing

### 2026-04-11
- feat: Generic Exam Formats page per domain (replaces hardcoded Aviation Exams)
- feat: Multi-provider AI chain: Gemini → Groq → Mistral → Anthropic → OpenAI
- Deployed OCR service on VPS2 (tesseract + FastAPI)
- Multiple iterations on OCR/Vision approach

### 2026-04-07 — 2026-04-09
- ABIP2 completed: 9 phases, 65 security fixes (Critical, High, Medium, Low)
- fix: 502 on homepage — PM2 port mismatch (3000 vs 3013)
- feat: Image import with OCR + AI extraction
- Prisma migrations resolved on VPS2
- API keys configured (Gemini, Mistral, Groq, Anthropic, OpenAI)

### 2026-04-06
- E2E Audit by Tester: 65 issues identified (10 Critical, 20 High, 20 Medium, 15 Low)
- Domain "Aviation" created
- Tutor deployed on tutor.knowbest.ro

## Technical Notes

### Deploy
- VPS2: 72.62.155.74, SSH: root@72.62.155.74
- PM2 with ecosystem.config.cjs (reads .env, sets PORT=3013)
- Build: `npx next build`, Restart: `pm2 delete tutor; pm2 start ecosystem.config.cjs`
- OCR service: PM2 "ocr-model", port 8000, Python venv
- DB: Neon PostgreSQL (eu-central-1), pooler endpoint

### API Keys on VPS (.env)
- GEMINI_API_KEY (new account — may have quota issues)
- MISTRAL_API_KEY (free tier, works for vision + text)
- GROQ_API_KEY (free, fast, reliable for vision)
- ANTHROPIC_API_KEY (credit exhausted)
- OPENAI_API_KEY (quota exceeded)

### Architecture
- Next.js 15.3.3, NextAuth, Prisma, Neon PostgreSQL
- i18n: next-intl (en/ro), all routes prefixed with locale
- Image import: 2-step (Vision AI transcribes → Text AI structures questions)
- Rate limiting: in-memory Map (resets on restart)

## Lessons Learned

### OCR/Image Import
1. **Tesseract OCR + text AI = poor quality** for handwritten notes. AI hallucinates when OCR text is garbled.
2. **Direct AI Vision (2-step) works much better**: Step 1 transcribe faithfully, Step 2 structure into questions. Prevents hallucination.
3. **Node.js FormData + Blob doesn't upload correctly to FastAPI** — files arrive empty. Direct tesseract call or vision API is simpler.
4. **Free API tiers exhaust quickly** during development. Chain multiple providers (Gemini → Groq → Mistral) with retry on 429.
5. **Groq Vision (Llama 4 Scout) is the most reliable free vision provider** — fast, accurate, no rate limit issues.

### Deployment
6. **PM2 doesn't read .env automatically** — must use ecosystem.config.cjs that reads .env and passes as env vars.
7. **`rm -rf .next` before rebuild is dangerous** — if PM2 restarts during build, site is down. Always stop PM2 first.
8. **ESLint errors block Next.js build silently** — unused variables cause build to fail without clear error.
9. **Neon DB cold start** can cause intermittent 502s. Connection pooler helps but first request after sleep may timeout.

### Auth & Roles
10. **Enrollment upsert overwrites roles** — fixed to set exact roles (allows upgrade AND downgrade).
11. **JWT session caches roles** — user must logout/login after role change for it to take effect.
12. **Rate limit 5/min on auth was too aggressive** — testing tools exhaust it. Increased to 20.
13. **Zod .uuid() rejects CUIDs** — Prisma uses CUIDs by default, not UUIDs. Use .min(1) instead.

### UI/UX
14. **Options stored as string[] but renderer expected {label,value}[]** — always normalize data format at render boundary.
15. **Student vs Admin pages look similar** — users confused about which page they're on. Domain cards need role-based action buttons.
16. **"Aviation Exams" was hardcoded** — should always be generic per-domain from the start.
17. **Static code analysis is NOT real testing** — Playwright with real browser login is the only way to verify UI works.

### Pipeline (ABIP2/AIP2)
18. **ABIP2 watcher needs manual start** on macOS — `node big-pipeline-watcher.js <id>`
19. **Pipeline CI checks ALL pre-existing errors**, not just new code — blocks progress on unrelated issues.
20. **Codex dev agent sometimes doesn't commit changes** — verify with `git status` after pipeline completes.
21. **Pipeline clarification questions repeat** — deploy question appears on every phase, automate answering.

### Book Import & OCR (2026-04-16 session)
22. **Preserve book order at extraction time** — save `bookOrder`, `pdfPage`, `bookPage`, `qNumberInBook`, `chapterIndex` as the pipeline processes. Chunk-by-chunk AI output is not in book order; `createdAt` is useless. Retrospective recomputation from sourceReference is messy.
23. **pdf-parse v2 broke API** — exports PDFParse class, not function. Downgrade to v1.1.1 AND import from `/lib/pdf-parse.js` subpath to bypass the test-file lookup bug at initialization.
24. **Scanned PDF detection is trivial** — if `pdf-parse` extracts < 200 chars from a > 10KB file, it's scanned (image-only). Route to OCR service.
25. **Always save uploaded files to `uploads/`** BEFORE processing. Import can fail at any step; without the file you have to ask the user to re-upload (bad UX).
26. **OCR + fuzzy content match caps at ~74%** — AI-corrected text doesn't match garbled OCR. For 100%, use Vision AI directly on each page.
27. **Vision AI per-page is the only way to get book page numbers reliably** — header OCR on corners is too noisy. Anthropic Haiku 4.5 on 281 pages ≈ $0.50 with 93% inliers via RANSAC linear fit.
28. **Page number formula emerges from Vision data** — `book_left = 2*pdf - 18` for this specific book (2 pages per PDF scan). Linear regression with RANSAC finds it automatically from anchor data.
29. **OpenRouter has free vision models** — gemma-3-12b-it, nvidia/nemotron-nano-12b-v2-vl, gemma-4-26b-a4b-it. Rate-limited (50/day free) but good fallback when Mistral/Gemini/OpenAI are blocked.
30. **Q numbers reset per chapter** — "Q1" appears in every chapter. Need chapter scoping OR sequential index (bookOrder) to avoid ambiguity.
31. **Answer key pages detectable by heuristic** — short average line length (< 40 chars) + many `N.a/b/c` patterns (> 10). Works reliably.
32. **Letter-verified answer matching** — cross-reference AI-structured `correctAnswer` letter with answer key text `QNum.letter`. 540/1385 (39%) letter-verified on Udroiu.
33. **Question-to-page mapping needs 2 anchors + interpolation** — LNDS on high-confidence content matches gives monotonic anchors; linear interpolation fills gaps between them.
34. **Don't trust single data source for page numbers** — OCR text numbers, PDF corners, Vision readings all have errors. Use triangulation + sanity checks (monotonicity, diff between adjacent pages should be 2).

### UI/UX (2026-04-16 session)
35. **Wide tables don't work on mobile** — 10 columns force horizontal scroll, right-side action buttons become unreachable. Rewrite as card layout.
36. **Review Queue cards must show ALL options by default** — expand-to-see-options requires 2 clicks per question, unusable on 1385 items.
37. **Answer comparison must be format-agnostic** — DB stores "a) text", UI sends "text". Strip letter prefix on both sides before comparing.
38. **Option letter must be preserved in correctAnswer** for instructor clarity — "a) text" is unambiguous, just "text" requires matching against options array to know which letter is correct.
39. **double-locale /en/en bug** — `/en` without trailing slash doesn't match `startsWith('/en/')`. Use `startsWith('/en')` OR strip locale from callbackUrl before redirect.
40. **JWT role cache needs refresh-on-every-request** — not just login — for role changes to take effect without forcing logout. Move DB lookup outside `if (user)` block.

### Pricing & Strategy
41. **Per-subject pricing beats flat tiers** for education market — users want to pay only for what they study. Seasonal prices (BAC prep, summer voucher) drive conversion.
42. **Referral with perpetual commission** builds viral growth. 2-level tier + anti-fraud (30-day activity + same-household detection) is industry standard.
43. **Bibliography is legally required** for educational content in Romania — must be per-domain, approved before student sees, with full citation details (author, title, edition, publisher, year, ISBN, notes).
44. **Instructor context beats Q number collision** — adding `[Topic]` to sourceReference solves ambiguity when same Q number appears in multiple chapters.
