# AUDIT_GAPS — Tutor
> Persistent ledger of open gaps. Items stay OPEN until resolved with evidence (commit hash + date).
> Source audit: `Reports/TRUE-E2E-FULL-2026-05-11.md`

---

## Open Gaps

### G-TUT-AUDIT-2026-09-05 — Șase constatări din True E2E [10] — **Eliminated 2026-09-05 (`483427f`, LIVE + verificat)**
`/api/public/practice/subjects` pe regula veche (slug) · ordinea 400/404 la self-enroll · `joinCode` serializat oricărui ADMIN de materie (verificat live: superadmin vede codul, adminul de materie nu, rotate → 403) · dublu-submit pe cod → 500 citit ca „cod invalid" · materie oprită listată în `enrolled` · `/dashboard/progress` pornea hardcodat pe `aviation` (privată → 404 pentru neînscriși).

### G-TUT-JOINCODE-REACTIVATE-001 — Codul de acces reactivează o înscriere veche cu rolurile ei — OPEN (P2)
- `POST /api/domains/join` pe o înscriere `isActive=false` o repune activă **păstrându-i rolurile**: un cont căruia i s-a revocat rolul ADMIN/INSTRUCTOR pe o materie privată și-l recapătă cu un cod destinat elevilor. Sursă: /review (CONFIRMED).
- Fix: la reactivare, forțează `roles: ["STUDENT"]` (sau refuză reactivarea rolurilor privilegiate). `src/app/api/domains/join/route.ts`.

### G-TUT-JOINCODE-LIFECYCLE-001 — Codul de acces n-are expirare, limită de utilizări sau audit la răscumpărare — OPEN (P2)
- `Voucher` din aceeași schemă are `expiresAt`/`maxUses`/`usedCount`/`isActive`; `Domain.joinCode` n-are niciunul, iar înscrierea prin cod nu se distinge de una făcută de admin (fără urmă pe `Enrollment`, fără `AdminAuditLog`). Emiterea e auditată, folosirea nu.
- Relevant înainte de a da codul agenților REAL (W6): un cod scurs rămâne valabil la nesfârșit.

### G-TUT-GATE-COVERAGE-001 — Nimic nu împiedică o rută nouă `/api/[domain]/*` să uite poarta — OPEN (P2)
- Inventarul celor 29 de rute a fost făcut cu `find`, o dată. Poarta e per-handler; nu există test/lint care să eșueze dacă un handler nou nu cheamă `resolveDomainOrForbid`. Sursă: /review (unghiul altitudine).
- Fix propus: un test care enumeră `src/app/api/[domain]/**/route.ts` și cere prezența importului în fiecare fișier — plasa care lipsește azi.

### G-TUT-FEEDBACK-PRIVATE-WIDENED-001 — „Materialul propriu se editează automat" s-a lărgit de la 2 la 9 materii — OPEN (P1, decizie)
- `feedback-review.ts` folosea o listă de 2 sluguri (`aptitudini-aviatie`, `licenta-rares`); acum citește `visibility === "PRIVATE"`, deci regimul de auto-corectare/auto-ascundere acoperă și `aviation`, `drept-penal`, `chimie`, `biologie`, `istorie`, `geografie`. Lărgire reală, introdusă de unificarea definiției (`b51d528`).
- Se leagă direct de itemul deschis „Verdictul pe feedback-ul elevului nu mai are voie să fie final fără om". Decizie de produs: fie se revine la o listă explicită, fie se acceptă lărgirea odată cu omul-în-buclă.

### G-TUT-ADMIN-SCOPE-001 — Un ADMIN de materie vedea materiile private străine — **Eliminated 2026-09-05 (`70534c5`, LIVE)**
- Găsit de True E2E [10], rolul ADMIN: `test_admin` (ADMIN pe `aviation`) → `GET /api/licenta-rares/progress` 200, `/api/aptitudini-aviatie/leaderboard` 200, `/api/licenta-rares/bibliography` 200, iar catalogul lista materiile private.
- Cauză: `canSeePrivateDomains` moștenise „orice înscriere cu rol ADMIN = admin global" din vechiul `canSeeRestrictedDomains` (nu regresie, dar contrazice „privat = invizibil").
- Fix: doar `isSuperAdmin`; un admin al lui X ajunge în Y ca oricine — printr-o înscriere în Y. Verificat live post-deploy: aceleași trei rute → 404, materia proprie → 200, catalog fără privat. Niciun cont real afectat.

### G-TUT-ADMIN-QUESTIONS-001 — Trei politici de acces pe aceeași resursă (`/api/admin/questions`) — OPEN (P2, pre-existent)
- Găsit de True E2E [10], rolul ADMIN: lista `GET /api/admin/questions` → 200 scoped (`requireAdminOrInstructor`); `GET /api/admin/questions/<id>` → 403 (`requireAdmin` = superadmin-only); `PUT/DELETE /<id>` → `requireDomainAdmin`; `POST` → 403 pentru un ADMIN de domeniu, deși corpul rutei conține o verificare per-domeniu (enrollment ADMIN/INSTRUCTOR pe `domainId`) care nu se mai execută niciodată — cod mort.
- Efect: un ADMIN de domeniu vede panoul (layout-ul îl lasă) dar nu poate crea/citi individual întrebări. Nu e scurgere; e funcție promisă și nelivrată pentru rolul ADMIN.
- Unde: `src/app/api/admin/questions/route.ts` (POST) + `[id]/route.ts` (GET). Decizie: fie `requireDomainAdmin` peste tot pe întrebări, fie se scoate rolul ADMIN de domeniu din UI. Ține de workstream-ul D (roluri).

### G-TUT-DOMAIN-INACTIVE-001 — O materie oprită (`isActive=false`) apare încă în `enrolled`, deși rutele ei răspund 404 — OPEN (P3/UX)
- Găsit de True E2E [10], rolul SUPERADMIN (V2): elevul înscris vede materia în `GET /api/student/domains` → `enrolled`, dar orice `/api/<slug>/*` → 404 (poarta, corect). UI-ul ar arăta o materie pe care nu o poți deschide. Tot acolo: comutarea `isActive` prin `PUT /api/admin/domains/[id]` nu scrie în audit log (doar `visibility` e auditat).
- Fix mic: `enrolled` filtrat pe `domain.isActive` pentru non-admini (sau marcat „oprită"); audit și pe `isActive`.

### AGT-001 (PATCH `/api/admin/questions/<id>` → 405) — **Eliminated** (verificat 2026-09-05: PATCH e alias la PUT; pe id inexistent răspunde 404, nu 405)

### G-TUT-LEGAL-EN-001 — Termenii și Confidențialitatea în ENGLEZĂ servite pentru eTutor sunt ale altui produs (4pro-eat)
- **Status**: OPEN (găsit 2026-09-05, True E2E [10] — journey `/en/terms` HAS_ERRORS → citit conținutul)
- **Severitate**: P1 (conformitate). Un utilizator pe locale EN acceptă la înscriere termeni despre „AI-assisted food logging", „nutritional analysis", „body weight and composition goals", „Health and Nutrition Data (Art. 9 GDPR)" — nimic din asta nu există în eTutor. Versiunea RO e corectă.
- **Dovadă (sursă, nu simptom)**: `GET https://legal.knowbest.ro/api/v1/public/legal/tutor/tos?locale=en` → 9 potriviri „nutri/food logging", 1 „body weight"; `.../privacy?locale=en` → la fel; `?locale=ro` → 0 pe ambele; `cookies` curat pe ambele locale. Randat identic pe `https://etutor.ro/en/terms` și `/en/privacy` (v2.1, „Effective from 31 May 2026").
- **Cauză probabilă**: la crearea variantei EN a documentelor pentru `tutor` în Legal Hub s-a pornit din documentul lui `4pro-eat` și nu s-a mai adaptat.
- **Unde se repară**: în **Legal Hub** (NO-TOUCH CRITIC — propose-confirm-apply per CLAUDE.md §2d): o versiune nouă (v2.2) EN pentru TOS + PRIVACY ale app-ului `tutor`, tradusă din RO v2.1. Tutor nu are nimic de schimbat (`src/lib/legal-doc.ts` doar randează ce primește).
- **Colateral de decis (produs, nu bug)**: ambele locale cer „18 ani sau peste" (RO: 4 potriviri) pe o platformă folosită de elevi de clasa a VIII-a; textul RO permite 16-18 cu acordul părintelui, dar sub 16 nu e acoperit deloc. De discutat cu consilierul juridic înainte de v2.2.


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

## Gaps deschise — True E2E Full Audit [10], 2026-08-15

Raport complet: `Reports/TRUE-E2E-FULL-2026-08-15.md`.

| ID | Gap | Severitate | Status | Dovadă |
|---|---|---|---|---|
| AGT-011 | Rate-limit `/api/auth` numără `/api/auth/session` (citire făcută de NextAuth la fiecare pagină) în aceeași găleată de 20/min ca tentativele de login, iar cheia e doar IP-ul → o clasă/familie în spatele unui NAT împarte bugetul și elevii sunt delogați în timpul exersării | P1 | **Fixed** — 2026-08-18 `5d24242` (galeti separate citire/scriere + cheie pe sesiune; anonimul ramane pe IP) | 60 cereri `/api/auth/session` în 18 rute, 23×429, primul la #18 — `Tester-Gateway/reports/tutor/2026-08-15T12-53-07-796Z-k5y0/network.json`; cod `src/middleware.ts:66-72` · **VERIFICAT PE PROD** 2026-08-18: 60 citiri de sesiune -> 60x200, zero 429 (inainte 23). Iar 26 tentative anonime de login -> 7 respinse, deci galeata de 20 tine |
| AGT-012 | Ținte de atins sub 44×44 px pe mobil — **63/100** măsurat azi (cifra 75 din TODO vine din text, nu dintr-o măsurătoare comparabilă → scăderea e plauzibilă, nu demonstrată); pe `/dashboard` 14 din 18 butoane sunt sub prag, pe 3 dispozitive | P2 | **Fixed** — 2026-08-18 `ba6efb9` (antet, subsol, dashboard; link-urile din propozitii lasate intentionat, excepție WCAG 2.2) | `Reports/AUDIT_E2E_2026-08-15.md` §mobile-tester (înlocuiește AGT-007/009, marcate Eliminated dar reapărute) · **VERIFICAT PE PROD** la 375px: 3/22 sub 44px (inainte 11/26). Cele 3 ramase sunt exact link-urile din propozitii, exceptate de WCAG 2.2 - lasate intentionat |
| AGT-013 | **Cinci** pagini randează titluri hardcodate în română indiferent de limbă (`bibliography`, `progress`, `gamification`, `exam-bank`, `admin/exam-bank`). Traducerile NU lipsesc — 859↔859 chei, zero diferențe, iar pentru toate cinci există valoare engleză distinctă. Corectat de la 6 la 5: `licenta` are aceeași valoare în en.json și ro.json (nume propriu al examenului), deci nu e defect de traducere | P2 | **Fixed** — 2026-08-18 `dcf34f6` (chei dedicate, romana pastrata litera cu litera) | `src/app/[locale]/dashboard/bibliography/page.tsx:66` · **VERIFICAT PE PROD** pe /en: Bibliography, Statistics, Achievements, Simulations - official exams; pagina de admin isi pastreaza titlul distinct · **COMPLETAT** dupa re-verificare: cautarea initiala acoperea doar page.tsx si ratase 2 layout-uri de admin cu h1 hardcodat in ENGLEZA (afisat si pe /ro) + 1 componenta. Fixate in `1450525` (18 aug); verificat pe prod: /ro da [Administrare, Banca examene (vizualizare)], /en da [Admin Dashboard, Exam bank (view only)] |
| AGT-014 | `escapeHtml` din `src/lib/legal-doc.ts` nu escapează ghilimelele, iar linkul markdown intră direct în `href="$2"` → evadare din atribut. Pe Tutor **blocat de CSP** (`script-src` fără `unsafe-inline`), deci neexploatabil azi — dar protecția depinde integral de acel CSP | P3 | **Fixed** — 2026-08-18 `4cf2076` (escapare ghilimele + lista de scheme permise; 8 cazuri verificate) | rulat pe funcția reală: `[x](" onmouseover="alert(1))` → `<a href="" onmouseover="alert(1"` |
| AGT-015 | Parola n-are `.max()`; bcrypt taie tăcut la 72 de octeți → o parolă de 87 de caractere se autentifică cu primele 72 | P3 | **Fixed** — 2026-08-18 `617fbdb` (.max(72) pe toate cele 4 scheme, nu doar cele 2 raportate) | `register/route.ts:17`, `reset-password/route.ts:10`; verificat empiric cu bcryptjs · **VERIFICAT PE ENDPOINT-UL REAL** (nu doar pe schema izolata): POST /api/auth/register cu 72 caractere -> 201, cu 73 si 100 -> 400 |
| AGT-016 | Parolele a 3 conturi de test din `TODO_PERSISTENT.md` sunt invalide (`test_student`, `test_instructor`, `test_watcher`). Rolul WATCHER a fost totuși testat — provisionat prin suprafețele aplicației (`POST /api/admin/users` + `/[id]/enroll` cu `roles:["WATCHER"]`), fără scriere directă în baza de date | proces | **Eliminated** — 2026-08-15, **10/10 PASS** | watcher pur fără copii asociați vede **0 elevi** (scoping-ul promis se ține); citirea unui elev nelegat → **403**; 3/3 rute de admin refuzate. Conturile de test create au fost dezactivate prin `PATCH /api/admin/users/[id]`. Parolele celor 3 conturi vechi rămân invalide — de resetat manual dacă se vor refolosi |
| AGT-018 | Furnizorul de autentificare `google-one-tap` e **mort**: hardening-ul CSP (`72765fc`) a scos permisiunea One Tap din `style-src`, dar a lăsat ȘI furnizorul înregistrat în NextAuth, ȘI scriptul `accounts.google.com/gsi/client` încărcat pe **fiecare pagină**. Rezultat: 2 erori de consolă pe orice pagină + a 3-a (`FedCM NetworkError`) pe /auth/signin. Autentificarea Google normală (`/api/auth/signin/google` → 302) NU e afectată. În plus, scriptul terț se încarcă **înainte** de alegerea pe bannerul de cookie-uri — relevant pentru o platformă cu utilizatori minori | P2 | **Fixed** — 2026-08-24 `64d3d7a` (origine repusă în `style-src` + scriptul GSI mutat în spatele bannerului de cookie-uri) | reprodus în browser pe fereastră curată; `/api/auth/providers` listează `google-one-tap`; Tester a numărat exact aceleași 2 erori pe 30 de scenarii · **VERIFICAT PE PROD** 2026-08-24 pe tab curat: înainte de consimțământ **0 mesaje de consolă** (erau 2) + niciun `script[src*=accounts.google.com]` + `window.google` inexistent; după **Accept** scriptul se încarcă fără reîncărcare, `window.google.accounts.id` e prezent, `link[href=accounts.google.com/gsi/style]` intră în document și **eroarea CSP a dispărut**; după **Respinge** niciun script terț. Cele două erori FedCM rămase („Not signed in with the identity provider" + `NetworkError`) apar doar când browserul n-are sesiune Google — mediu, nu defect. **Nedovedit**: prompt-ul plutitor propriu-zis, care cere o sesiune Google reală în browser |
| AGT-017 | Accesibilitatea paginilor `/` și `/dashboard` e **nemăsurată** — `a11y-scanner` raportează 100/100 dar CSP i-a blocat injectarea scriptului fix pe cele două pagini principale | proces | **Fixed** — 2026-08-18 `3694323` (masurat cu axe+bypassCSP: select fara nume + contrast 4.16:1; ambele reparate) | `Reports/AUDIT_E2E_2026-08-15.md` §a11y-scanner · **VERIFICAT PE PROD** cu axe: 0 incalcari / 0 noduri pe ambele pagini (inainte 14 noduri, unul critic) |

*Last updated: 2026-08-24 (audit 15 aug; fix-uri AGT 18 aug; accesibilitate dashboard 23 aug) (True E2E Full Audit [10] — 95/100 CODE, 18/19 journey, izolare pe domenii verificată)*
