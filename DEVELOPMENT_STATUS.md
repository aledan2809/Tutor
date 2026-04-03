# Project Status - Tutor

Last Updated: 2026-03-28

## Current State
- Phase 1 COMPLETE - project builds and database seeded
- Phase 2 COMPLETE - Admin Dashboard & Content Management
- Phase 3 COMPLETE - Learning Engine & Session System
- Phase 8 COMPLETE - Exam Simulator
- Phase 12 COMPLETE - Testing, Security, PWA, SEO, CI/CD & Deploy
- Next.js 15.3.3 with App Router, TypeScript strict, Tailwind CSS v4, dark theme
- PostgreSQL (Neon) + Prisma ORM - 40+ models, all enums, full schema deployed
- NextAuth v5 configured with Google OAuth + Resend email magic links + Credentials
- Role-based authorization system (multi-role per user per domain)
- Middleware: next-intl locale routing + auth protection for dashboard routes
- Bilingual setup (RO+EN) with next-intl, full message files (368+ keys)
- PWA manifest + service worker skeleton in place
- Database seeded: aviation domain, 8 users, 233 questions, 5 exam formats, 12 escalation templates
- Neon DB: project `round-forest-01709273` (eu-central-1)

## Phase 2 Deliverables
- [x] Admin dashboard overview with rich stats, content pipeline, quick actions, domain table, recent questions
- [x] Question CRUD with markdown + code blocks editor (MarkdownPreview component)
- [x] Question list with filters: status, source (Manual/AI), domain, text search
- [x] Bulk select + batch approve/publish/delete on question list
- [x] Bulk import from PDF/DOCX/CSV (server-side parsing via pdf-parse, mammoth, csv-parse)
- [x] Manual content auto-approved (source:MANUAL -> status:APPROVED)
- [x] AI content generation via ai-router with Tutor preset (claude default, gemini+mistral fallback)
- [x] AI-generated content saved as DRAFT, shown in review queue
- [x] Review queue with batch approve/delete, inline editing, expand/collapse
- [x] Domain management: create/edit with auto-created ExamConfig defaults
- [x] Exam format configuration per domain (question types, time limit, question count, passing score, shuffle options)
- [x] Question tagging: tags with categories (domain, subject, topic, general)
- [x] Tag management page: create/delete tags, filter by category
- [x] Admin nav updated with Tags link
- [x] i18n keys added for all Phase 2 features (en + ro)
- [x] Build verification passed

## Phase 3 Deliverables
- [x] SM-2 spaced repetition algorithm (lib/sm2.ts) with quality grading from correctness + response time
- [x] Session engine (lib/session-engine.ts): 6 session types (micro 2m/5q, quick 10m/15q, deep 20m/30q, repair 15m/20q, recovery 10m/15q, intensive 20m/30q)
- [x] Adaptive question selection: 60% due SM-2 reviews + 40% new questions, shuffled
- [x] Repair sessions: questions from weak area topics, ordered by error rate
- [x] Recovery sessions: 50% overdue easy reviews + 50% easy questions for confidence rebuilding
- [x] Session recommendation engine: recovery (2+ days inactive), intensive (exam <14 days), repair (weak areas), default quick
- [x] API: GET /api/{domain}/session/next - recommendation with stats
- [x] API: POST /api/{domain}/session/start - creates session, selects questions, returns sanitized (no answers)
- [x] API: POST /api/{domain}/session/answer - response_time tracking, SM-2 progress update, XP award
- [x] API: POST /api/{domain}/session/complete - score calculation, weak areas update, gamification XP
- [x] API: GET /api/{domain}/progress - per-topic/subject/domain progress with weak areas and recent sessions
- [x] API: PATCH /api/student/progress - manual progress update with enrollment verification
- [x] API: POST /api/student/sessions/quick - quick session start with optional topic filter
- [x] API: POST /api/student/sessions/continue - resume incomplete sessions
- [x] WeakAreas detection: topics with <60% accuracy (min 5 attempts) auto-flagged, auto-removed when improved
- [x] Session timer component with color-coded countdown (green >50%, yellow >25%, red <25%), pauses during feedback
- [x] Question renderer: multiple choice with A/B/C/D selection + open answer textarea
- [x] Immediate feedback display with correct/incorrect indicator, correct answer reveal, explanation
- [x] Session results: score percentage, correct/incorrect counts, duration, XP earned, level ups, achievements
- [x] Practice page with domain selector, session type recommendation, all types grid
- [x] Active session page: question progression, timer, answer submission, feedback loop, auto-complete
- [x] Progress page: overall stats, weak areas list, subject breakdown with accuracy bars, topic table with status badges, recent sessions
- [x] Session data persisted via localStorage for page navigation resilience
- [x] Build verification passed (TypeScript + Next.js build clean)

## Phase 8 Deliverables
- [x] Exam engine (lib/exam-engine.ts): selectExamQuestions with sections/type distribution, scoreExam with topic breakdown, sanitizeQuestions for client
- [x] Certificate generation (lib/certificate.ts): PDFKit A4 landscape PDF with verification code (SHA256), stored in public/certificates/
- [x] API: POST /api/{domain}/exam/start - creates ExamSession, selects questions by format, returns sanitized (no answers in REAL mode)
- [x] API: POST /api/{domain}/exam/submit - scores exam, generates certificate if passed, awards XP via gamification
- [x] API: GET /api/{domain}/exam/history - paginated history with trends (total attempts, avg score, pass rate, best score)
- [x] API: GET /api/{domain}/exam/formats - lists active ExamSimulation formats for domain
- [x] API: GET/PUT /api/admin/domains/[id]/exam-config - admin domain-level exam defaults
- [x] API: GET/POST/PUT/DELETE /api/admin/domain/aviation/exam-format - full CRUD for ExamSimulation formats
- [x] Admin UI: ExamFormatManager component with create form, activate/deactivate toggle, session counts
- [x] Admin page: /dashboard/admin/aviation/exam-formats with subject question counts overview
- [x] Student UI: /dashboard/exams - domain selector, trends overview (4-stat grid), score trend mini-chart, available formats grid with Practice/Real mode toggle, exam history with all/passed/failed filter tabs
- [x] Active exam UI: /dashboard/exams/[sessionId] - question counter, timer with auto-submit on timeout, question navigator (10-col grid with current/answered/flagged states), flag for review, previous/next navigation, confirm submit dialog with unanswered/flagged warnings
- [x] Exam results component: status banner (Excellent/Well Done/Passed/Almost There/Keep Practicing), score with threshold comparison bar, 4-column breakdown (correct/incorrect/unanswered/time), topic breakdown with accuracy bars, XP/achievements/level-up toasts, certificate download link
- [x] Practice vs Real mode: Practice allows hints/explanations, Real is timed with no hints
- [x] WizzAir aviation: 5 exam formats seeded, 233 questions across aviation subjects
- [x] DB models: ExamConfig, ExamSimulation, ExamSession, ExamCertificate
- [x] Gamification integration: XP awards on exam completion (awardExamCompleteXp)
- [x] Time limit enforcement with 1-minute grace period, TIMED_OUT status
- [x] Build verification passed (TypeScript + Next.js build clean)

## Phase 12 Deliverables
- [x] Vitest test infrastructure: 9 test suites, 103 unit tests, all passing
- [x] Unit tests: SM-2 algorithm (18 tests), gamification constants/logic (25 tests), escalation config (11 tests), timing (4 tests), exam engine sanitization (5 tests), session types (10 tests), cache (8 tests), sanitization (12 tests), rate limiting (8 tests)
- [x] Playwright E2E test setup: auth flow, PWA features, security headers
- [x] DB indexes added: Question (status, subject/topic, type, difficulty), Session (userId/domainId, startedAt), Attempt (sessionId, userId/questionId), Notification (isRead, createdAt), Enrollment (domainId/isActive), UserGamification (domainId/level, lastActivityDate), LeaderboardEntry (domainId/groupId/week/year)
- [x] In-memory cache (lib/cache.ts) with TTL support for leaderboard, level config, domain list, daily challenge, user XP
- [x] Rate limiting middleware: 5 req/min auth, 3 req/min payment, 60 req/min general API with 429 responses
- [x] XSS sanitization utilities (lib/sanitize.ts): escapeHtml, stripHtml, sanitizeInput, sanitizeUrl
- [x] Security headers: X-Frame-Options, X-Content-Type-Options, HSTS, CSP, Permissions-Policy, X-DNS-Prefetch-Control, X-Permitted-Cross-Domain-Policies
- [x] PWA: Service worker v4 with offline sync queue (IndexedDB), POST request queuing for quiz/exam submissions, install prompt component, offline indicator, offline fallback page
- [x] SEO: sitemap.ts route (9 pages), OpenGraph + Twitter Card meta tags, viewport config, keyword meta tags, robots.txt
- [x] GitHub Actions CI/CD: lint, typecheck, unit tests, build, E2E tests, auto-deploy to VPS via SSH
- [x] Deployed to tutor.knowbest.ro via PM2 on VPS (72.62.155.74)

## TODO
- [x] Phase 0-11: All 12 Big Pipeline phases complete
- [x] Phase 12: Testing, Security, PWA, SEO, CI/CD & Deploy
- [x] Credentials auth (email+password login)
- [x] SuperAdmin user created (alexdanciulescu@gmail.com)
- [x] Plans CRUD (create/edit/delete/toggle)
- [x] Users CRUD (create with password, ban/unban, impersonate)
- [x] Enroll User in Domain with role selection
- [x] Deploy pe VPS2 tutor.knowbest.ro cu SSL
- [ ] Google OAuth — lipsesc AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET in .env VPS
- [ ] Resend email (magic link) — de configurat
- [ ] Stripe payments — STRIPE_SECRET_KEY gol in .env VPS
- [ ] WhatsApp/SMS escalation — credentials neconfigurate
- [ ] Mobile responsive sidebar (hamburger menu)
- [ ] i18n incomplete — unele stringuri hardcodate
- [ ] Error boundaries (error.tsx) lipsesc
- [ ] Rate limiting pe toate API endpoints
- [ ] Seed aviation demo data
- [ ] Replace placeholder PWA icons

## Recent Changes
- 2026-03-28: Phase 12 complete - Testing, Security, PWA, SEO, CI/CD & Deploy (103 tests, rate limiting, offline sync, sitemap, GitHub Actions, deployed to tutor.knowbest.ro)
- 2026-03-28: Phase 8 verified complete - Exam Simulator (all API routes, exam engine, certificate PDF generation, student/admin UI, practice/real modes, gamification integration, WizzAir formats)
- 2026-03-28: Phase 3 complete - Learning Engine & Session System (SM-2 spaced repetition, 6 session types, adaptive question selection, weak areas detection, progress tracking, timer, question rendering, feedback, results)
- 2026-03-28: Phase 2 complete - Admin Dashboard & Content Management
- 2026-03-28: Enhanced admin overview with stats grid, content pipeline, quick actions, domain table, recent questions
- 2026-03-28: Enhanced review queue with batch approve/delete, inline editing, checkbox selection
- 2026-03-28: Enhanced question list with source filter, bulk select, batch approve/publish/delete, tag display
- 2026-03-28: Fixed domain creation API to auto-create default ExamConfig
- 2026-03-28: Added tag management API (GET/POST/DELETE) and admin page
- 2026-03-28: Added TagManager component with category filtering
- 2026-03-28: Added "Tags" to admin nav, added i18n keys (en+ro)
- 2026-03-27: Created Neon database (round-forest-01709273), pushed schema, seeded data
- 2026-03-27: Generated migration SQL (0001_init, 1009 lines)
- 2026-03-27: Updated Master credentials with real DATABASE_URL
- 2026-03-26: Phase 1 scaffold created
- 2026-03-26: Fixed next.config.ts with next-intl plugin
- 2026-03-26: Created middleware.ts with i18n + auth protection
- 2026-03-26: Pinned Next.js to 15.3.3 (avoiding 16.x middleware deprecation)
- 2026-03-26: Populated Google OAuth credentials from Master

## Technical Notes
- Next.js pinned to 15.3.3 (not 16.x) - Next.js 16 deprecated middleware.ts in favor of proxy convention, causes Turbopack crash
- Prisma version 5.22.x used (hook normalized from 6.x)
- Auth uses JWT strategy with enrollments embedded in token
- SuperAdmin bypasses all role checks
- Session cookie names: `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod)
- Neon Project ID: round-forest-01709273 (region: aws-eu-central-1)
- AI generation uses ai-router (npm link file:../AIRouter) with Tutor preset: claude default provider, gemini+mistral fallback
- Manual content gets status:APPROVED directly; AI content gets status:DRAFT requiring review
- Domain creation auto-creates default ExamConfig (20 questions, 75% pass, multiple choice, shuffle enabled)
