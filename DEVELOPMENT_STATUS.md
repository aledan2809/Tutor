# Project Status - Tutor

Last Updated: 2026-03-28

## Current State
- Phase 1 COMPLETE - project builds and database seeded
- Phase 2 COMPLETE - Admin Dashboard & Content Management
- Phase 3 COMPLETE - Learning Engine & Session System
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

## TODO
- [x] Phase 1: Project scaffold, auth, database, i18n
- [x] Phase 2: Admin Dashboard & Content Management
- [x] Phase 3: Learning Engine & Session System
- [ ] Phase 4-12 implementation (per big pipeline)
- [ ] Configure Resend API key for email magic links
- [ ] Add Google OAuth redirect URI for production domain
- [ ] Replace placeholder PWA icons with real ones

## Recent Changes
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
