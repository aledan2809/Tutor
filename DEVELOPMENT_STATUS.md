# Project Status - Tutor
Last Updated: 2026-04-15 13:00

## Current State

### Working
- Auth: Login via Google OAuth, Magic Link, Credentials (NextAuth)
- Admin Dashboard: Full nav with Overview, Questions, Review Queue, Domains, Tags, Import, AI Generate, Exam Formats, Escalation Templates, SuperAdmin
- Domain CRUD: Create/Edit/Delete domains, Aviation domain active with 57 published questions
- Question Import: PDF/DOCX/CSV + **Image import (JFIF/PNG/JPG/WebP)** via 2-step AI Vision (Groq transcribe → Mistral structure)
- Question Edit: Prev/Next navigation between questions
- Exam Formats: Generic per-domain (replaced hardcoded Aviation Exams)
- User Management: Create users, Enroll on domains with role upgrade/downgrade
- Role-based access: ADMIN sees admin+questions, INSTRUCTOR sees instructor panel, STUDENT sees practice/exams
- Domain cards: Clickable with role-based action buttons (Practice, Exams, Questions, Edit Domain)
- Practice: Sessions with spaced repetition (SM-2), options render correctly (string[] normalized)
- Exams: Exam simulator with timer
- Student self-enroll: Fixed CUID vs UUID validation
- Rate limiting: 20 req/min auth, 60 req/min API
- Deployed: tutor.knowbest.ro (VPS2, port 3013, PM2 + ecosystem.config.cjs)

### Users Created
- Alex Danciulescu (alexdanciulescu@gmail.com) — SuperAdmin
- Anto (vladalionescumariaantonia@gmail.com) — ADMIN+INSTRUCTOR+STUDENT on Aviation
- Rares (rares.danciulescu2004@gmail.com) — STUDENT on Aviation
- Test users: test_admin@test.com, test_instructor@test.com, test_student@test.com, test_watcher@test.com (TestPass123!)

### In Progress
- (none currently)

### Not Started
- Forgot Password: email delivery needs SMTP config on VPS (logic done, email skipped if no SMTP)
- Web Push: VAPID keys set, needs real browser testing with user opt-in

## Recent Changes (2026-04-11 — 2026-04-15)

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
