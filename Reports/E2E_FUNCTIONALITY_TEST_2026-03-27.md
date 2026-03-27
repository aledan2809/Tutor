# Tutor E2E Functionality Test Report
**Date:** 2026-03-27
**URL:** https://tutor.knowbest.ro
**VPS:** 72.62.155.74 | Port 3013 | PM2: `tutor`

---

## EXECUTIVE SUMMARY

**Scor general: 2/10 — Aplicatia este NEFUNCTIONALA pe productie.**

Cauza principala: Build-ul deployed pe VPS contine DOAR ruta `/api/auth`. Toate celelalte 75+ rute API (admin, student, domain, notifications, instructor, etc.) returneaza **404**. Aplicatia nu poate fi folosita — login functioneaza, dar dupa autentificare niciun flux nu merge.

---

## 1. PROBLEME CRITICE (P0 — Blocker)

### 1.1 TOATE rutele API returneaza 404 (cu exceptia /api/auth)
- **Impact:** Aplicatia este complet nefunctionala dupa login
- **Cauza:** Build-ul pe VPS (`/var/www/tutor/.next/server/app/api/`) contine DOAR directorul `auth/[...nextauth]`
- **Rute afectate (75+):**
  - `/api/admin/*` (domains, questions, users, plans, tags, vouchers, revenue, ads, audit, stripe)
  - `/api/student/*` (dashboard, domains, lessons, assessment, sessions)
  - `/api/dashboard/instructor/*` (analytics, goals, groups, messages, reports, sessions, students, thresholds)
  - `/api/dashboard/watcher`
  - `/api/notifications/*` (list, preferences, by ID)
  - `/api/[domain]/*` (achievements, calendar, daily-challenge, exam, leaderboard, progress, session, streak, xp)
  - `/api/cron/escalation`
  - `/api/escalation/[userId]`
  - `/api/settings/study-hours`
  - `/api/calendar/callback`
- **Fix:** Rebuild complet pe VPS: `cd /var/www/tutor && npm run build && pm2 restart tutor`

### 1.2 Codul sursa pe VPS posibil desincronizat
- Nu s-a putut confirma `git log` pe VPS — posibil deploy manual incomplet
- `.env` contine doar: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` — lipsa posibila env vars

---

## 2. PROBLEME MAJORE (P1)

### 2.1 favicon.ico returneaza 404
- Browser-ul arata tab fara icon
- **Fix:** Adauga `favicon.ico` in `public/` sau configureaza in `app/layout.tsx`

### 2.2 robots.txt returneaza HTML in loc de text
- Google/crawlere nu pot citi robots.txt
- Acum serveste landing page cu locale "robots.txt" (next-intl interpreteaza "robots.txt" ca locale)
- **Fix:** Adauga `public/robots.txt` static sau `/app/robots.ts` Route Handler

### 2.3 Zero security headers
- Lipsesc TOATE header-ele de securitate:
  - `X-Frame-Options` — pagina poate fi embedded in iframe (clickjacking)
  - `Content-Security-Policy` — lipsa protectie XSS
  - `Strict-Transport-Security` — nu forteaza HTTPS
  - `X-Content-Type-Options` — MIME sniffing posibil
  - `Referrer-Policy` — leak informatii prin referrer
  - `Permissions-Policy` — acces nerestrictat la API-uri browser
- **Fix:** Adauga headere in `next.config.ts` sectiunea `headers` sau in middleware

### 2.4 API routes nu returneaza 401 corespunzator
- Toate rutele protejate returneaza 404 HTML in loc de JSON `{"error": "Unauthorized"}` cu status 401
- Cauza: Build incomplet (vezi P0), dar si dupa rebuild, unele rute (cron, POST endpoints) trebuie verificate

### 2.5 Ruta inexistenta `/en/dashboard/exams` returneaza 200
- Ar trebui sa returneze 404
- Middleware-ul redirecteaza la signin (307) pentru pagini protejate, dar dupa login va servi 200 pentru rute inexistente din dashboard
- **Fix:** Adauga not-found handling in dashboard layout

---

## 3. PROBLEME MEDII (P2)

### 3.1 Sign-in page lipseste linkuri importante
- Nu exista link catre:
  - Terms of Service
  - Privacy Policy
  - Forgot password/help
- **Impact:** Posibila problema legala (GDPR) fara privacy policy vizibila

### 3.2 Meta description generica
- Toate paginile au: "AI-driven adaptive learning platform"
- Lipsa meta descriptions per-pagina afecteaza SEO
- **Fix:** Adauga metadata diferita in fiecare page.tsx

### 3.3 Landing page fara imagini
- Zero imagini pe landing page (doar text si card-uri CSS)
- **Impact:** Aspect sarac vizual, rata de conversie scazuta
- **Fix:** Adauga imagini/ilustratii hero section si feature cards

### 3.4 manifest.json exista dar favicon lipseste
- PWA manifest e valid (200), service worker e valid (200)
- Dar fara favicon, PWA install prompt va arata icon generic

---

## 4. TESTE PASS

### 4.1 Pagini publice — PASS
| URL | Status | Rezultat |
|-----|--------|----------|
| `/en` | 200 | Landing page EN — corect |
| `/ro` | 200 | Landing page RO — tradusa corect |
| `/en/auth/signin` | 200 | Sign-in page — Google + Email |
| `/ro/auth/signin` | 200 | Sign-in RO — tradusa ("Autentificare") |
| `/en/auth/verify` | 200 | Verify page — functionala |

### 4.2 Pagini protejate — PASS (redirect 307)
| URL | Status | Redirect |
|-----|--------|----------|
| `/en/dashboard` | 307 | → `/en/auth/signin` |
| `/en/dashboard/practice` | 307 | → `/en/auth/signin` |
| `/en/dashboard/progress` | 307 | → `/en/auth/signin` |
| `/en/dashboard/calendar` | 307 | → `/en/auth/signin` |
| `/en/dashboard/notifications` | 307 | → `/en/auth/signin` |
| `/en/dashboard/settings` | 307 | → `/en/auth/signin` |
| `/en/dashboard/admin` | 307 | → `/en/auth/signin` |
| `/en/dashboard/instructor` | 307 | → `/en/auth/signin` |
| `/en/dashboard/watcher` | 307 | → `/en/auth/signin` |
| `/en/dashboard/admin/questions` | 307 | → `/en/auth/signin` |
| `/en/dashboard/admin/domains` | 307 | → `/en/auth/signin` |
| `/en/dashboard/admin/superadmin` | 307 | → `/en/auth/signin` |

### 4.3 Auth endpoints — PASS
| URL | Status | Rezultat |
|-----|--------|----------|
| `/api/auth/providers` | 200 | Google + Resend (email) |
| `/api/auth/csrf` | 200 | CSRF token generat corect |

### 4.4 i18n — PASS
- EN: "AI-Powered Adaptive Learning", "Get Started", "Sign In"
- RO: "Invatare Adaptiva Bazata pe AI", "Incepe acum", "Autentificare"
- Locale switch functioneaza: `/en/*` ↔ `/ro/*`

### 4.5 Infrastructure — PARTIAL PASS
| Asset | Status |
|-------|--------|
| manifest.json | 200 — OK |
| sw.js | 200 — OK |
| SSL/HTTPS | OK — Certbot |
| Nginx proxy | OK — port 3013 |

---

## 5. REZUMAT RUTE API (75+ rute din cod, TOATE 404 pe productie)

### Admin (20 rute)
- `/api/admin/domains` (GET, POST)
- `/api/admin/domains/[id]` (GET, PUT, DELETE)
- `/api/admin/domains/[id]/exam-config`
- `/api/admin/questions` (GET, POST)
- `/api/admin/questions/[id]` (GET, PUT, DELETE)
- `/api/admin/questions/ai-generate` (POST)
- `/api/admin/questions/bulk-import` (POST)
- `/api/admin/users` (GET)
- `/api/admin/users/[id]` (GET, PUT)
- `/api/admin/users/[id]/impersonate` (POST)
- `/api/admin/plans` (GET, POST) + `/api/admin/plans/[id]`
- `/api/admin/tags` (GET)
- `/api/admin/vouchers` (GET, POST) + `/api/admin/vouchers/[id]`
- `/api/admin/revenue` (GET)
- `/api/admin/ads` (GET, POST) + `/api/admin/ads/[id]`
- `/api/admin/audit` (GET)
- `/api/admin/stripe/checkout` (POST)
- `/api/admin/stripe/webhook` (POST)
- `/api/admin/domain/aviation/*` (ai-generate, exam-format, seed-demo, templates)

### Student (8 rute)
- `/api/student/dashboard` (GET)
- `/api/student/domains` (GET) + `/api/student/domains/[id]`
- `/api/student/assessment` (POST)
- `/api/student/lessons` (GET) + `/api/student/lessons/[id]`
- `/api/student/sessions/continue` (POST)
- `/api/student/sessions/quick` (POST)

### Domain-specific [domain] (21 rute)
- `/api/[domain]/achievements` (GET)
- `/api/[domain]/calendar/*` (connect, events, free-slots, schedule, status, students)
- `/api/[domain]/daily-challenge` (GET)
- `/api/[domain]/exam/*` (formats, history, start, submit)
- `/api/[domain]/leaderboard` (GET)
- `/api/[domain]/progress` (GET)
- `/api/[domain]/session/*` (answer, complete, next, start)
- `/api/[domain]/streak` (GET) + `/api/[domain]/streak/recover`
- `/api/[domain]/xp` (GET)

### Instructor (12 rute)
- `/api/dashboard/instructor` (GET)
- `/api/dashboard/instructor/analytics` (GET)
- `/api/dashboard/instructor/goals` (GET, POST)
- `/api/dashboard/instructor/groups` (GET, POST) + `[id]`
- `/api/dashboard/instructor/messages` (GET, POST)
- `/api/dashboard/instructor/reports` (GET)
- `/api/dashboard/instructor/sessions` (GET)
- `/api/dashboard/instructor/settings` (GET, PUT)
- `/api/dashboard/instructor/students` (GET) + `[id]`
- `/api/dashboard/instructor/thresholds` (GET, PUT)

### Other (7 rute)
- `/api/dashboard/watcher` (GET)
- `/api/notifications` (GET) + `[id]` + `preferences`
- `/api/cron/escalation` (POST)
- `/api/escalation/[userId]` (GET)
- `/api/settings/study-hours` (GET, PUT)
- `/api/calendar/callback` (GET)

---

## 6. PLAN DE ACTIUNE (prioritizat)

### Imediat (P0)
1. **Rebuild pe VPS:** `cd /var/www/tutor && git pull && npm install && npx prisma generate && npm run build && pm2 restart tutor`
2. **Verifica .env complet** — asigura-te ca DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXTAUTH_URL, si toate env vars necesare sunt prezente
3. **Verifica DB migrations** — `npx prisma migrate deploy` pe VPS
4. **Re-test toate API endpoints** dupa rebuild

### Saptamana aceasta (P1)
5. Adauga `public/favicon.ico`
6. Adauga `public/robots.txt` (sau `app/robots.ts`)
7. Adauga security headers in `next.config.ts`
8. Fix not-found handling pentru dashboard routes inexistente
9. Verifica API-urile returneaza 401 JSON (nu 404 HTML) fara auth

### Luna aceasta (P2)
10. Adauga Terms of Service + Privacy Policy linkuri pe sign-in
11. Imbunatateste meta descriptions per pagina
12. Adauga imagini/ilustratii pe landing page
13. Testeaza complet fluxurile autentificate dupa rebuild

---

## 7. NOTA TEHNICA

- **Middleware matcher:** `["/", "/(en|ro)/:path*"]` — NU intercepteaza `/api/*` (corect)
- **Auth:** NextAuth cu Google OAuth + Resend email magic link
- **Build system:** Next.js App Router cu `next-intl` plugin
- **VPS PM2 processes:** `tutor` (fork) + `knowbest` (cluster) — ambele online
- **Nginx:** Reverse proxy pe port 3013, SSL via Certbot
