# Project Status - Tutor
Last Updated: 2026-04-16 15:30

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
