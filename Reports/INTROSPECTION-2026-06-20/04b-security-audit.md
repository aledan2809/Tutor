# Audit Securitate (Cyber) — Tutor

**Data:** 2026-06-20 · **Proiect:** Tutor / etutor.ro · **Tip:** audit read-only, propunere-only (zero modificări; orice fix așteaptă review-ul tău)
**Acoperire:** 122 rute API, 55 modele Prisma, middleware, next.config, dependențe, fluxuri parinte↔elev.

---

> ## 🗣️ Pe înțelesul tău (citește întâi asta)
>
> Mi-am pus pălăria de „spărgător de site-uri" și am încercat să găsesc unde ar putea intra cineva rău sau unde ar putea vedea date care nu sunt ale lui. Vestea bună: **fundamentele de securitate sunt solide** — parolele sunt criptate corect, nu există „uși din spate" în baza de date, anteturile de protecție sunt puse, iar majoritatea rutelor verifică „cine ești" înainte să-ți dea date.
>
> **Dar există o problemă serioasă de intimitate care implică minori:** în portalul de părinte (numit „Watcher"), un părinte care supraveghează la o materie **vede TOȚI elevii înscriși la acea materie — nu doar copilul lui**. Practic, părintele Maria vede progresul, emailul și numele copilului familiei Popescu. Pe un public de elevi minori, asta e și încălcare GDPR, și o problemă de încredere gravă. **Nu e furt de la exterior — e o ușă internă lăsată larg deschisă.** Asta e prioritatea #1 de securitate.
>
> Restul: niște biblioteci învechite cu vulnerabilități cunoscute (de actualizat), un mic detaliu de „cookie-uri fără banner" (legal, nu tehnic), și câteva întăriri minore. Toate au propuneri mai jos — **nimic nu se aplică acum, totul așteaptă decizia ta.**

---

## Sumar pe severități

| Severitate | Nr. | Pe scurt |
|---|---:|---|
| 🔴 **CRITIC / HIGH** | **3** | Watcher leak (date minori) · GDPR fără consimțământ pe minori · dependență Next.js cu CVE critic (middleware bypass) |
| 🟠 MEDIUM | 4 | Dependențe nodemailer/xmldom/postcss/next-intl · CSP cu `unsafe-inline/unsafe-eval` · domain access fără verificare de înscriere · privacy nedescoperit din homepage |
| 🔵 LOW / INFO | 3 | Email placeholder în cod · CRON fără rate-limit dedicat (acoperit de secret) · escalation/ack intenționat neautentificat (risc neglijabil) |

**Total: 10 constatări** (3 critice/high, 4 medium, 3 low/info).

---

## A. Autentificare & Autorizare (Authz)

### 🔴 A1 [HIGH/CRITIC] — Watcher (părinte) vede TOȚI elevii dintr-o materie, nu doar copilul lui — scurgere de date despre minori

- **Severitate:** HIGH ca clasă tehnică (Broken Object-Level Authorization / IDOR-de-grup); **CRITIC ca impact** pentru că ținta sunt date despre minori (GDPR Art. 8).
- **Dovadă:**
  - `src/app/api/dashboard/watcher/route.ts` — interogarea filtrează DOAR pe domeniu:
    ```
    where: { domainId: { in: domainIds }, roles: { hasSome: ["STUDENT"] }, isActive: true, userId: { not: userId } }
    include: { user: { select: { id, name, email, image } } }
    ```
    Niciun filtru de tip „acest elev este copilul acestui watcher". Returnează numele, **emailul** și progresul tuturor studenților din domeniu.
  - `src/app/api/dashboard/watcher/[id]/route.ts` — același tipar: verifică doar că studentul e înscris într-un domeniu unde watcher-ul are rol, NU că există o relație părinte→copil. Orice `studentId` din domeniu e accesibil.
  - `prisma/schema.prisma` — **nu există** model `Guardian` / `FamilyGroup` / `FamilyMember`, nici câmp `parentId`. Singura legătură watcher↔elev e co-înscrierea la același `domainId` (enum `EnrollmentRole.WATCHER`).
  - `src/lib/watcher-instructor-auth.ts` — `requireWatcher()` confirmă DOAR că userul are rolul `WATCHER` undeva; nu restrânge la „proprii copii".
- **Impact:** un părinte cu cont WATCHER pe „Matematică" vede progresul + emailul + numele tuturor elevilor de la Matematică. Pe minori = încălcare GDPR + erodare gravă a încrederii. Se leagă direct de P0-1/P0-2 din `01-gap-strategy-vs-code.md` (planurile Family/Duo/Trio vândute live pe `/preturi` fără mecanica de bază).
- **PROPUNERE (în așteptarea review-ului tău):**
  1. Introdu un model de legătură explicită — `Guardian` / `FamilyGroup` (părinte ↔ unul sau mai mulți copii, multi-părinte permis).
  2. În `watcher/route.ts` + `watcher/[id]/route.ts`, restrânge interogarea la elevii din grupul familial al watcher-ului (`studentId IN (copiii mei)`), NU la tot domeniul.
  3. Distincție de rol: păstrează vederea „pe tot domeniul" DOAR pentru `INSTRUCTOR`/`ADMIN` (legitim pedagogic); `WATCHER` = strict proprii copii.
  4. Minimizează datele expuse către WATCHER (ex. nu trimite `email`-ul altor elevi decât e strict necesar).
  > Aceasta este o schimbare de schemă + autorizare — necesită migrare DB + revizuire atentă. **Nu se aplică acum.**

### 🟠 A2 [MEDIUM] — Rutele `[domain]/*` verifică doar că domeniul EXISTĂ, nu că userul e ÎNSCRIS în el

- **Severitate:** MEDIUM (conținutul de practică e în mare parte gratuit / produsul în sine, dar e o graniță de acces neaplicată).
- **Dovadă:** `src/app/api/[domain]/session/start/route.ts` — după `getSession()`, face doar `prisma.domain.findUnique({ where: { slug: domainSlug } })` și pornește sesiunea; nu verifică un `Enrollment` activ al userului pe acel domeniu. Tipar replicat în peers (`progress`, `leaderboard`, `exam/*`).
- **Impact:** orice user autentificat poate practica / accesa orice domeniu, inclusiv unele care ar putea fi „premium"/restricționate în viitor. Azi impact mic; devine real când introduci materii plătite per-domeniu.
- **PROPUNERE (în așteptarea review-ului tău):** un helper `requireDomainAccess(domainSlug)` care verifică `Enrollment` activ (sau acces public explicit) înainte de a servi conținut per-domeniu. *(Nu se aplică acum.)*

### ✅ A3 [POZITIV] — Restul autorizării e corect implementat

- Rutele `admin/*` folosesc consecvent `requireSuperAdmin` / `requireAdmin`; `dashboard/instructor/*` folosesc `requireInstructor` (cu enforcement de graniță pe `domainSlug` în `requireInstructor(domainSlug)`).
- Rutele de elev (`student/*`, `notifications/*`, `settings/*`, `[domain]/*`) folosesc `getSession()` din `@/lib/authorization` și verifică ownership (`userId === session.user.id`) înainte de a returna/modifica — verificat pe `notifications/[id]`, `settings/study-hours`, `student/progress`.
- `escalation/[userId]` aplică corect self-or-privileged (admin/instructor) înainte de a expune istoricul de escaladare.

---

## B. Secrete & Configurare

### 🔵 B1 [LOW] — Email placeholder expus în output (`you@example.com`)

- **Dovadă:** AIWebAuditor raportează `exposed_emails: ["you@example.com"]`. E un **placeholder/demo**, nu un email real → risc de spam neglijabil; problemă de curățenie.
- **PROPUNERE (în așteptarea review-ului tău):** înlocuiește cu un email de contact real sau elimină placeholder-ul. *(Nu se aplică acum.)*

### ✅ B2 [POZITIV] — Niciun secret real expus, NEXT_PUBLIC folosit corect

- `git ls-files | grep .env` → doar `.env.example` urmărit (niciun `.env` cu secrete reale în git).
- Singurele variabile `NEXT_PUBLIC_*` „sensibile" sunt `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (cheie **publică** VAPID pentru web-push — corect să fie publică, prin design). Niciun `NEXT_PUBLIC_*SECRET/KEY/TOKEN/PASSWORD` privat scurs.
- AIWebAuditor: `exposed_api_keys: false`.

---

## C. Injection / XSS

### ✅ C1 [POZITIV] — Singurul `dangerouslySetInnerHTML` este sigur

- **Dovadă:** `src/app/[locale]/grile/[subject]/page.tsx:80` —
  `dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}`. Conținutul e un obiect JSON-LD construit server-side, serializat cu `JSON.stringify` (nu input de utilizator reflectat). Tipar standard + sigur pentru schema.org. **Fără acțiune.**

### ✅ C2 [POZITIV] — Zero SQL raw periculos

- **Dovadă:** singurele `$queryRaw` sunt `prisma.$queryRaw\`SELECT 1\`` în `health/route.ts` + `health/ready/route.ts` (health-check, fără input de utilizator). Restul accesului DB e prin Prisma (parametrizat, fără concatenare). Niciun `$executeRaw`.

### 🟠 C3 [MEDIUM] — CSP permite `unsafe-inline` + `unsafe-eval` pe `script-src`

- **Dovadă:** `next.config.ts:29` —
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`.
- **Impact:** CSP există (bine!), dar `unsafe-inline/unsafe-eval` slăbesc semnificativ protecția împotriva XSS — dacă vreodată apare o injecție de script, CSP nu o mai blochează. (Deseori cerut de Next.js fără nonce; nu e un bug, dar e o slăbire reală.)
- **PROPUNERE (în așteptarea review-ului tău):** migrează spre CSP cu `nonce` per-request (Next.js suportă prin middleware) și elimină `unsafe-inline`/`unsafe-eval` de pe `script-src` acolo unde se poate. Efort mediu, testare necesară. *(Nu se aplică acum.)*

---

## D. Dependențe (biblioteci învechite)

### 🔴 D1 [CRITIC] — `next` cu CVE critic: bypass de Middleware/Proxy (App Router)

- **Dovadă:** `npm audit --omit=dev` → **1 critical**: *"Next.js has a Middleware / Proxy bypass in App Router applications via segment-prefetch routes — Incomplete Fix Follow-Up"* (GHSA-26hh-7cqf-hhc6).
- **Impact:** Tutor se bazează parțial pe `middleware.ts` pentru gating de rute publice + rate limiting. Un bypass de middleware poate ocoli aceste protecții. **Cea mai serioasă vulnerabilitate de dependență.** (Atenuant: gating-ul real de date e per-rută cu `getSession()`/`requireX`, nu doar middleware — deci impactul e limitat, dar tot trebuie patchuit.)
- **PROPUNERE (în așteptarea review-ului tău):** actualizează `next` la versiunea care include fix-ul complet. **Testează build + auth flow după upgrade** (Next.js major/minor poate avea breaking changes — vezi notele de migrare). *(Nu se aplică acum — necesită testare.)*

### 🟠 D2 [HIGH×2 / MEDIUM] — Alte dependențe vulnerabile

| Pachet | Severitate | CVE / problemă |
|---|---|---|
| `nodemailer` (<=9.0.0) | HIGH | CRLF injection în antetele `List-*` → injecție de antete arbitrare (GHSA-268h-hp4c-crq3). **Relevant** — Tutor trimite emailuri (reset parolă, notificări). |
| `@xmldom/xmldom` (<=0.8.12) | HIGH | XML injection via CDATA serialization (GHSA-wh4c-j3r5-mjhp). Probabil tranzitiv. |
| `postcss` (<8.5.10) | MEDIUM | XSS via `</style>` în CSS stringify (GHSA-qx2v-qp2m-jg93). Tranzitiv prin Next. |
| `next-intl` (<=4.9.1) | MEDIUM | Open redirect (GHSA-8f24-v5vv-gm5j). **Relevant** — Tutor folosește `next-intl` pentru i18n + middleware. |

- **Total `npm audit --omit=dev`:** 6 vulnerabilități (1 low, 2 moderate, 2 high, 1 critical).
- **PROPUNERE (în așteptarea review-ului tău):** rulează `npm audit fix` pentru cele non-breaking (nodemailer, postcss, xmldom, next-intl) + actualizează `next` separat cu testare. *(Nu se aplică acum.)*

---

## E. GDPR / Confidențialitate (accent pe MINORI)

### 🔴 E1 [HIGH] — Tracking (Google Analytics) fără consimțământ, pe public de minori

- **Dovadă:** AIWebAuditor GDPR score **20/100** — `cookie_banner_present: false`, `google_analytics: true`, „GA încărcat înainte de consimțământ" (severitate HIGH), `opt_out_option: false`, `data_retention_info: false`.
- **Impact:** GDPR cere consimțământ pentru cookie-uri non-esențiale ÎNAINTE de încărcare. Publicul Tutor sunt în mare parte **elevi minori** (BAC/Evaluare Națională) → GDPR Art. 8 cere protecție întărită + (pentru minori sub 16) bază legală/consimțământul reprezentantului. Tracking fără consimțământ pe minori = expunere legală mai mare (ANSPDCP).
- **PROPUNERE (în așteptarea review-ului tău):** banner de cookie consent care **blochează GA până la accept** (consent-mode); documentează retenția datelor; oferă opt-out. Notă: există deja integrare cu **Legal Hub** (`legal.knowbest.ro`, `@map`-uri în cod + memory `feedback-legal`) — propunerea e să folosești infrastructura existentă, nu să construiești de la zero. *(Nu se aplică acum.)*

### 🟠 E2 [MEDIUM] — Pagina de Confidențialitate nu e descoperită din homepage

- **Dovadă:** AIWebAuditor `privacy_policy_link: false` (CRITIC în raportul lor), dar codul ARE rute `/privacy` + `/terms` în `publicPaths` (`src/middleware.ts`). Concluzie: pagina **există** dar nu e linkată vizibil din footer/homepage → auditorul (și un vizitator) n-o găsește.
- **Impact:** legal, trebuie să fie ușor accesibilă; practic, scade trust.
- **PROPUNERE (în așteptarea review-ului tău):** link vizibil „Confidențialitate" + „Termeni" în footer pe toate paginile. *(Nu se aplică acum.)*

### 🔴 E3 [legat de A1] — Minimizarea datelor în portalul de părinte

- Vezi **A1**: emailurile altor elevi (minori) sunt expuse către watcheri care nu sunt părinții lor. Acesta e **cel mai grav incident de date** al platformei. Tratat la A1 ca authz, dar e și o încălcare directă a principiului GDPR de minimizare + a protecției minorilor.

---

## F. Anteturi / Hardening

### ✅ F1 [POZITIV] — Anteturi de securitate complete

- **Dovadă:** `next.config.ts` setează pe `/(.*)`: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo off), `Strict-Transport-Security` (HSTS, max-age 1 an + preload), `Content-Security-Policy` (prezent), `X-Permitted-Cross-Domain-Policies: none`.
- AIWebAuditor confirmă: `hsts_enabled: true`, `csp_enabled: true`, `x_frame_options: true`, `x_content_type_options: true`, `cookies_secure: true`, `cookies_httponly: true`, HTTPS + SSL valid (66 zile până la expirare — auto-renew Let's Encrypt).
- **Singura slăbire:** CSP cu `unsafe-inline/unsafe-eval` (vezi C3).

### ✅ F2 [POZITIV] — Rate limiting + webhook-uri fail-closed

- `src/middleware.ts` — rate limiting in-memory: 60 req/min general, **20/min pe `/api/auth`** (anti-brute-force login), **3/min pe `/api/(admin/)stripe`**. Store mărginit (purge la 10.000 intrări).
- `src/app/api/webhooks/telegram/route.ts` — **fail-closed** pe secret: respinge dacă lipsește `TELEGRAM_WEBHOOK_SECRET` sau header-ul `x-telegram-bot-api-secret-token` nu se potrivește (dublă verificare via `parseWebhook`).
- `src/app/api/admin/stripe/webhook/route.ts` — verifică semnătura Stripe.
- `src/app/api/cron/*` + `health/ready` — protejate prin `CRON_SECRET`.

### 🔵 F3 [INFO] — `escalation/ack` intenționat neautentificat (risc neglijabil)

- **Dovadă:** `src/app/api/escalation/ack/route.ts` rulează din contextul service-worker (cookie-ul de sesiune nu e fiabil atașat). Documentat în cod: `escalationEventId` e un cuid neghicibil, iar singurul efect e **suprimarea unei notificări de urmărire** (nu expune date, nu modifică nimic sensibil). Folosește `updateMany` idempotent (fără throw pe id necunoscut). **Decizie de design corectă** — fără acțiune.

---

## Acțiuni care necesită USER

> Niciun fix nu a fost aplicat. Următoarele necesită decizia / acțiunea ta:

1. **🔴 [decizie produs + DB] Watcher leak (A1/E3) — date despre minori.** Necesită model nou `Guardian`/`FamilyGroup` + migrare DB + rescriere autorizare watcher. Se leagă de planurile Family/Duo/Trio deja vândute pe `/preturi` (P0-1/P0-2 în raport 01). **Recomandare: prioritate maximă** înainte de a împinge planurile de familie. Decizie: aprobi designul legăturii părinte↔copil?
2. **🔴 [GDPR/legal] Banner cookie + consent-mode GA (E1) pe public de minori.** Necesită decizie pe soluție (folosim Legal Hub existent?) + posibil aviz juridic dat fiind publicul minor. Risc de amendă ANSPDCP cât timp e neacoperit.
3. **🔴 [upgrade testat] `next` — CVE critic middleware bypass (D1).** Necesită upgrade Next.js + testare build/auth (posibile breaking changes). Aprobi fereastra de upgrade + test?
4. **🟠 [npm audit fix] Dependențe nodemailer/xmldom/postcss/next-intl (D2).** Mai multe sunt non-breaking. Aprobi rularea `npm audit fix`?
5. **🟠 [config] Întărire CSP — eliminare `unsafe-inline/unsafe-eval` (C3) via nonce.** Necesită testare că nu se rup scripturile inline. Aprobi?
6. **🟠 [authz] `requireDomainAccess` pe rutele `[domain]/*` (A2).** Decizie: vrei să restrângi accesul per-înscriere acum sau abia când introduci materii plătite?
7. **🟠 [UI/legal] Link vizibil Privacy/Terms în footer (E2).** Mic, dar legal relevant — aprobi adăugarea?
8. **🔵 [curățenie] Înlocuiește/elimină emailul placeholder `you@example.com` (B1).**

---

## Concluzie securitate

Fundamentele sunt **solide**: parole criptate, zero SQL raw periculos, zero XSS exploatabil, anteturi complete (HSTS/CSP/X-Frame), rate-limiting, webhook-uri fail-closed, autorizare corectă pe `admin/*` + `instructor/*` + majoritatea rutelor de elev. **Singura problemă gravă** e scurgerea de date despre minori în portalul de părinte (A1/E3) — o ușă internă lăsată deschisă, nu un atac extern — urmată de conformitatea GDPR pe cookie-uri (minori) și CVE-ul critic Next.js. Toate au propuneri concrete; **nimic nu s-a aplicat — totul așteaptă review-ul tău.**
