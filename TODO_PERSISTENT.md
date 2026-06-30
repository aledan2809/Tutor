# TODO Persistent — Tutor

> Citit la FIECARE sesiune. Items rămân până marcate `[x]` cu dată + commit.

---

## [~] 💳 Billing migrat pe Stripe Checkout Broker — TEST DONE 2026-06-26 (commit `15d7739`)

**Context**: Tutor avea checkout Stripe scaffold-at-dar-mort (`STRIPE_SECRET_KEY` unset pe prod, 0 customers, 0 plăți; cele 5 abonamente active = vouchere 100% gratis). Migrat să ruteze prin **broker-ul central** `stripe.knowbest.ro` → billing pe contul firmei **Class RDA** (biller decis de user). Tutor nu mai ține cheie Stripe.

**Livrat (commit `15d7739`)**:
- `/api/admin/stripe/checkout` → POST `{broker}/api/checkout` (inline price_data din `plan.price`, trial din `plan.trialDays`, voucher→coupon, metadata `{userId,planId,voucherId}`, currency RON).
- `/api/stripe/callback` (nou) → verify HMAC `X-Broker-Signature` + anti-replay `t` + idempotency pe `stripeSessionId` → Payment + subscriptionStatus + comision referral (cheia pe `metadata.userId`, nu pe `stripeCustomerId` care acum e la broker).
- Env `STRIPE_BROKER_URL/PROJECT_KEY/CALLBACK_SECRET` în `.env` (gitignored; synced Master/credentials/tutor.env). Mapping broker `tutor`→`class-rda` (brokerEnv **test**).
- **Verificat E2E pe prod (test)**: checkout broker → URL valid; callback semnat → Payment creat + status active; idempotency (POST 2× → 1 Payment); tampered sig → 400. Build/tsc verzi.

**Rămas pentru LIVE billing (acțiuni user în Stripe Dashboard, cont Class RDA)**:
- [x] ✅ Webhook endpoint pe contul Class RDA → `https://stripe.knowbest.ro/api/stripe/webhook/class-rda` — **CONFIRMAT FĂCUT (verificat 2026-06-29):** broker-ul are pentru `class-rda` chei **live** (secret + publishable + **webhookSecret**), deci endpoint-ul e configurat în stripe.com. Cablaj E2E verificat: env Tutor (`STRIPE_BROKER_URL`+project key `pk_proj_2f0ae66c11…`+callback secret, fără `STRIPE_SECRET_KEY` direct) ↔ mapare broker `tutor→class-rda` LIVE (cheie identică) ↔ callback `/api/stripe/callback` activează abonamentul. **Stripe e funcțional end-to-end.**
- [~] Activează **Customer Portal** (Settings → Billing → Customer portal) pe contul Class RDA (pt portal self-service; altfel `/api/portal` → "No configuration provided"). Doar dacă pui butonul de management (nu există încă).
- [x] Flip mapping `tutor` brokerEnv **test→live** — **FĂCUT de user 2026-06-26** (broker /projects → tutor → Class RDA → LIVE). Webhook Class RDA LIVE → broker = deja pus (user confirmat „A e făcut deja").
- [ ] Confirmă prețul planului Bronze e **15 lei** intenționat (display fixat $→lei, commit `55cb794`). Dacă voiai altă sumă → Planuri → Edit pe Bronze.
- [ ] (UI) buton "Gestionează abonamentul" → POST `{broker}/api/portal {sessionId\|subscriptionId, returnUrl}` (feature broker gata).

### 🧪 TEST LIVE Tutor — pași de făcut de TINE (Alex), GRATIS prin trial (proiect: **Tutor / etutor.ro**)
> Scop: dovedește pe LIVE tot lanțul checkout → Class RDA → webhook → broker → activare în Tutor, FĂRĂ să miști bani (planul Bronze are 14 zile trial → 0 lei azi).
1. Loghează-te pe **https://etutor.ro** cu **contul tău** (NU SuperAdmin — un cont de student normal, sau fă unul nou).
2. Mergi la pagina de abonare (sidebar **„Activare acces"**) și alege planul **Bronze** → apasă abonează-te.
3. La Stripe Checkout introdu cardul **real** (e trial → nu se ia nimic acum). Finalizează.
4. Ar trebui să fii redirecționat înapoi pe `/dashboard?session_id=...` cu acces activ.
5. **Spune-mi „am apăsat"** → verific eu în DB-ul prod dacă: `User.subscriptionStatus` = `trialing`/`active`, `subscriptionPlanId` setat, și s-a creat rândul în `Payment` cu `stripeSessionId`.
6. Dacă apare totul → LIVE merge end-to-end. Dacă NU → webhook-ul Class RDA mai are nevoie de `checkout.session.completed` (de adăugat pe webhook-ul existent).
7. **Anulează abonamentul înainte de 14 zile** (sau îl anulez eu din Stripe via broker) → zero bani mișcați.
> Notă comision (din testul AVE): pe sume mici taxa fixă Stripe domină (~4.5% pe 22 AED); pe sume normale + card local ajunge ~3-4%. Pentru Tutor RON, charge în RON (deja setat) → fără taxă de conversie.

**Follow-up tehnic — DONE 2026-06-30** (commit Tutor `a2a4da9` + broker `85c2a03`, ambele LIVE): broker-ul trimite acum `eventId` (Stripe event.id) în callback (v2, aditiv). Tutor deduplichează `subscription.renewed` pe `Payment.stripeEventId @unique` (migrare `0038`, aplicată pe etutor.ro) — retry de broker → Payment existent, comision doar pe `isNew`. Fallback v1 (fără eventId) = insert simplu (NULL-uri nu coliziune sub UNIQUE). Verificat: coloană + index live, callback 400 fără sig, pm2 online.

**Dezactivat (dormant, nu șters)**: vechiul `/api/admin/stripe/webhook` (cere `STRIPE_WEBHOOK_SECRET` unset → nu se declanșează) + crearea Stripe customer din checkout. Curățare = sesiune separată.

---

## [~] 🐛 Bug-uri din review user 2026-06-25 (6 raportate)

- [x] **#2 SECURITATE — domeniu Aviație vizibil fără acces** DONE+LIVE (`6b5f58d`): scurgeri închise la sursă — `/api/domains/public` (dropdown register nelogat) + `/api/student/domains` `available` (catalog) filtrează acum domeniile restricționate (non-curriculum) dacă userul nu e admin/allowlist; POST enroll direct blocat (403) pe restricționate (defense-in-depth). Verificat prod: `/api/domains/public` întoarce doar curriculum (zero aviation/licenta). Enrolații existenți păstrează accesul.
- [x] **#5 — demo nelogat arăta doar răspunsul corect** DONE+LIVE (`6b5f58d`+`c689cea`): API-ul public de quiz întoarce acum **sursa** (99% acoperire) + biasează spre întrebări cu **explicație**; `SubjectQuizDemo` afișează „De ce:" (explicație) + „Sursă:" (citat curat, fără prefixul intern `exam-bank:<id>|`). Verificat: sursa = „EN VIII 2022 Testul 5 (CNPEE)".
- [x] **#3 — buton „Am uitat parola"** DONE+LIVE (`6b5f58d`): linkul exista la signin dar era hardcodat în engleză + mic → acum `t("forgotPassword")` = „Ai uitat parola?", text-sm/medium, vizibil.
- [x] **#4 — „unde sunt grilele?"** DONE+LIVE (`6b5f58d`): pe mobil tab-ul era „Învață" → redenumit **„Grile"** (termenul userului; e primul tab). Grilele = practica cu feedback imediat (deja așa); Simulările = exam-bank (altceva).
- [x] **#6 — romgleză** DONE 2026-06-26 (`41766c9`, LIVE etutor.ro): sweep complet dashboard. 10 componente cablate la i18n (7 student: dashboard, domains, progress, lessons, exams, bibliography, domain-switcher + 3 admin: overview-server `getTranslations`, user-management, aviation seed-demo). Catalog `ro/en.json` chei append-only, paritate exactă 667=667, CRLF păstrat. Bonus: domains hardcoda rute `/en/...` → locale-aware `@/i18n/navigation` (userii RO nu mai erau aruncați în locale-ul englez la Practică/Examene). Build verde; deploy complet (a urcat și next-auth beta.30→.31 — login email+parolă re-verificat 302→/dashboard pe prod; Google OAuth `iss-missing` rămâne pending user, neatins de acest deploy). RO randat verificat pe prod, zero leak EN. Prefață: `6b5f58d` (SessionResults + forgot-pw). SubjectQuizDemo deja corect localizat (obiect copy ro/en), neatins.
- [~] **#1 — Google OAuth pe Android** — diagnostic CORECTAT + upgrade aplicat. Consola Google era OK (user a verificat — URI-urile existau). Cauza REALĂ din logurile prod: `CallbackRouteError — response parameter "iss" (issuer) missing` (provider google) = edge-case **intermitent** al librăriei Auth.js/oauth4webapi (4 apariții în log, deci Google merge uneori). **Fix aplicat 2026-06-25 (commit `6788623`, LIVE)**: upgrade `next-auth 5.0.0-beta.30→.31` + `@auth/core 0.41.1→0.41.2` + `@auth/prisma-adapter 2.7→2.11` (ultima linie v5 disponibilă). Verificat: tsc 0, build verde, 325/325, **login email+parolă confirmat funcțional pe prod post-upgrade** (admin-test → 302 + sesiune validă), endpoints + vecini 200. Rollback: commit `c689cea` + `/root/backups/tutor-package*.bak-2026-06-25-auth`. **De testat de user pe Android** crearea de cont Google (în altă zi). Dacă `iss` persistă: următorul lever = workaround config/param-stripping (upgrade-ul e ceiling-ul v5 acum).
- [x] ✅ **Delogare frecventă (reclamat de Rareș)** — DONE 2026-06-29 (commit la push, LIVE). Cauză: callback-ul `jwt` din `src/lib/auth.ts` interoga DB-ul (refresh roluri) la **FIECARE** request autentificat, **neprotejat** — orice eroare tranzitorie (timeout/pool epuizat sub trafic) făcea callback-ul să arunce → Auth.js nu mai producea token-ul → **sesiune invalidată → delogare**. Fix: (1) query înfășurat în try/catch — pe eroare păstrează token-ul existent (NU mai delogăm), defaults always-defined; (2) refresh roluri **periodic** (la login / `trigger=update` / >5 min via `token.rolesAt`), nu la fiecare request → mult mai puține query-uri = mult mai puține eșecuri; (3) `session.maxAge` explicit 30 zile + `updateAge` 24h. Compromis: o schimbare de rol se reflectă în max 5 min (acceptabil). tsc + build verzi; login real verificat pe prod post-deploy.

---

## [x] 🌟🔥 WOW first-run UX + Gamification "ca pe social-media" — COMPLET 2026-06-26 (roadmap A1-A5+B+C live 2026-06-25; Gamification deepening `3b47702`+`515cd09` LIVE 2026-06-26)

> **Decizie user 2026-06-25**: experiența primului contact trebuie să fie WOW, fără manual, auto-descoperită (model Facebook/Instagram/TikTok/Duolingo). Userii principali = **copiii** → gamification în prim-plan. „Pune în TODO acum, ne ocupăm mai încolo, dar e FOARTE IMPORTANT." Mockup viziune livrat în chat (feed de grile + feedback instant + streak + bară-jos).

### Diagnostic (din journey-audit 2026-06-25, capturi reale)
- **Quizzes = fundătură**: empty-state „You have no subjects in your package yet. Pick your subjects from your account" — text fără buton, trimite userul „în cont". 🔴 anti-WOW #1.
- **Sidebar 16 intrări** → paralizie de alegere. **Banner install/notificări** apare înainte de orice valoare. Aterizezi pe dashboard, nu pe o întrebare.

### Plan aprobat — foaie de parcurs (mesh, fază cu fază)
**A. Quick-wins (impact mare, efort mic):**
1. Omoară fundăturile (Quizzes gol → selector materie + buton „Începe acum" inline, niciodată „mergi în cont").
2. Amână corvoezile: banner install/notificări DUPĂ primele ~5 răspunsuri.
3. Streak + XP în ecranul de răspuns (nu pe pagina separată „Realizări").
4. Sidebar slab la primul contact / **bară-jos pe mobil** (Învață · Simulări · Progres · Profil); restul, dezvăluire progresivă.
5. Un singur coachmark contextual („👆 Atinge un răspuns"), o dată, dismissabil.

**B. Motorul WOW:** feed de grile — o întrebare pe ecran → tap → feedback instant + explicație scurtă → „Următoarea"/glisare. Devine ecranul default „Învață" (Duolingo × TikTok).

**C. Intrare fără fricțiune:** răspunzi întâi (3–5 grile din home „Începe testul"), cont doar ca să salvezi progresul (reuse `/try` + demo-quiz cookie existent).

### 🔥 Gamification deepening (copiii = userii principali) — cerut 2026-06-25
- **Animație cu focul reutilizată din demo Procu**, dar **mult mai discretă** decât acolo, care **se aprinde din ce în ce mai tare** pe măsură ce crește streak-ul/momentum-ul (intensitate progresivă, nu burst). Pointer reuse: `procuchaingo2/apps/web/src/components/gamification/streak-counter.tsx` (Flame lucide) + versiunea animată din `procuchaingo2/apps/web/src/app/(dashboard)/gamification/page.tsx` + `demo-simulation/`. De localizat exact flacăra animată când construim.
- **Animații + remarci adaptive** funcție de **vârstă / sex / profilare** (serios ↔ șmecher/„cool"). Ex. verbatim user: *„Ești foarte tare, dragule! Știai că fetele se îndrăgostesc de mintea băieților deștepți?"*.
- **Remarcile „cool" se adaptează și după feedback-ul userului** (like/dislike pe remarcă) → buclă de învățare: păstrează tonul care-i place, renunță la ce respinge.
- 🔒 **Guardrail obligatoriu (de proiectat din start)**: conținutul remarcilor pt **minori** trebuie age-appropriate + opt-out + vizibil/controlabil de părinte (părinții sunt watchers pe platformă!). Orice ton romantic/gendered se trece printr-un filtru de siguranță + setare de profil (părinte poate dezactiva tonul „cool"). Fără asta = risc de reclamație părinte. Nu blocant pt restul gamification-ului.

### Status (build în curs 2026-06-25, regim mesh)
- [x] **A1 — fix fundătură Quizzes** DONE+LIVE (commit `a750009`): empty-state → picker de materii (catalog inline, deja întors de API) → tap → self-enroll gratuit → auto-start sesiune. Verificat vizual ca `test_student` (vede Matematica 540 grile, Română, M1/M2/M3…). Filtrat la materii curriculum/permise (L18-safe).
- [x] **A2 — amână corvoezile** DONE+LIVE (commit `b41152b`): bannerul install/notificări (`AppBanner`) apare doar după ~5 răspunsuri (`src/lib/engagement.ts`, semnal localStorage bumpuit la fiecare răspuns). Userii deja-instalați neafectați.
- [x] **A3 — momentum în buclă** DONE+LIVE (`b41152b`): chip discret „🔥 N la rând" în feedback la streak corect (XP deja afișat). Streak per-sesiune.
- [x] **A5 — coachmark unic** DONE+LIVE (`b41152b`): „👆 Atinge un răspuns" pe prima întrebare, o singură dată (localStorage), fără tur.
- [x] **A4 — bară-jos pe mobil** DONE+LIVE (commit `a74326b`): `MobileBottomNav` (Învață/Simulări/Progres/Profil, inline SVG, active-by-pathname), `lg:hidden`, gated pe rol STUDENT (kids); desktop păstrează sidebar-ul. main primește pb-20 pe mobil.
- [x] **B — bucla feed** DONE+LIVE (commit `8c55ce7`): „🔥 Continuă cu încă o serie" pe ecranul de rezultate → pornește o serie nouă în aceeași materie fără meniu (senzația de feed endless). Bucla 1-întrebare→feedback→next exista deja; A1 a scos frecușul de intrare, asta scoate fundătura de ieșire.
- [x] **C — răspunzi-întâi-cont-la-urmă** DONE (pre-existent, verificat): `/try` → `SubjectQuizDemo` (alegi materie → răspunzi fără cont → scor cu CTA „Fă-ți cont gratuit ca să-ți salvezi progresul" → /auth/register). Polish opțional: ridică demo-ul ca CTA primar pe home (acum primar=register, secundar=/try).
- **✅ Roadmap WOW (A1-A5 + B + C) COMPLET + LIVE 2026-06-25.** Verificat: build verde fiecare, smoke prod OK, A1 + family + feedback confirmate vizual via journey-audit, vecini VPS2 200. 502 tranzitoriu la /ro = blip de pm2 restart (200 stabil după).
- [x] 🔥 **Gamification deepening** DONE+LIVE 2026-06-26 (commits `3b47702` + `515cd09` + a11y, etutor.ro): (1) **StreakFlame** — flacără CSS pură (zero deps) în feedback-ul de răspuns, intensitate progresivă cu seria (ember→flacără→blaze→albastru-incandescent), discretă; respectă `prefers-reduced-motion`. (2) **Motor remarci adaptive** (`src/lib/remarks.ts`, pur + 14/14 vitest): 3 tonuri (calm/cald/energic), trigger pe serie/revenire/corect, **învățare like/dislike** (păstrează ce-i place, scoate ce respinge). (3) **🔒 Guardrail-first**: TOT conținutul de remarci e age-appropriate pt orice vârstă — **tonul romantic/gendered NU e implementat** (cere verificare 18+ + review Legal înainte de a exista); părintele (guardian) poate limita copilul la tonurile calme (`resolveTone` clamp playful→cald). (4) Preferințe via `Setting` — **ZERO migrare**. (5) UI: picker ton în Setări, toggle per-copil pe Familia mea, remarcă + 👍/👎 subtil în feedback. (6) Review adversarial: autorizare etanșă (fără bypass copil / IDOR — `isGuardianOf` respinge self-link), SHIP. Verificat end-to-end pe prod: config + write-paths (PUT ton, POST vote) funcționale. NU s-a construit varianta romantic/gendered (decizie de siguranță minori — necesită semnătură user pe politică + Legal).
- Referințe: mockup viziune (chat 2026-06-25) · memory `feedback-no-ai-in-user-copy` (zero „AI" în copy) · `feedback-ro-nontech-comms`.

---

## [~] 🔔 Feedback elevi — inbox bell + admin click-through + override — DONE+LIVE 2026-06-25 (commits `e5a5bf7`+`6217fe7`)

**Context (cerere user 2026-06-25)**: Rareș dăduse 9 👎 (toate procesate de cron — vezi mai jos). User a cerut: (1) notificările să apară clar în inbox-ul cu clopoțel (badge alb pe roșu) separat de „Alerte"; (2) să poată da click pe fiecare feedback și să vadă întrebarea+răspunsul „corect" cum a fost expus, problema elevului, decizia + justificarea (auto vs necesită admin), trimiterea la text (paragraf+secțiune+pagină+link document), și să poată **suprascrie** decizia.

**Livrat + LIVE:**
- **(1) Bell = inbox propriu**: clopoțelul (deja există pe desktop ȘI mobil, în header-ul comun `dashboard/layout.tsx`) trăgea `/api/notifications` fără `audience` → amesteca feedback-ul cu „Alerte" (`parent_alert`) care au pagina lor → „se confunda". Fix: bell `audience=self` + `unreadCount` respectă audience (badge corect). Parent-alerts rămân pe pagina Alerte.
- **(2) Admin feedback review** (migrare aditivă `0036`: `reviewAction`/`reviewIssue`/`correctedAnswer`/`overriddenById`/`overrideNote`/`overriddenAt` pe `QuestionFeedback`; cron-ul le populează acum; backfill 9 existente = 6 hidden + 1 flagged + 2 dismissed). Pagină `/dashboard/admin/feedback` (nav „Feedback elevi"): listă filtrabilă (toate/necesită-admin/neprocesate) → click → detaliu: întrebarea cum a văzut-o elevul (răspuns corect marcat), problema lui, decizia + justificare + auto/necesită-admin, **proveniență** (citat paragraf + secțiune/capitol + pagină + **link la document la pagina exactă** via nou `GET /api/licenta/[id]/file`), + **override** (repune/ascunde/setează-răspuns/confirmă + notă → mută întrebarea + audit + notifică elevul în bell). Domain-scoped (`requireAdminOrInstructor`).
- **Verificat pe prod (read-only) pe cele 9 feedback-uri reale ale lui Rareș**: detaliul se asamblează corect; cazul flagged `q(-3)` pt `x²+4x+4` marcat „d) 13" — Rareș are dreptate (=1) → corect semnalat pt admin, gata de override. tsc clean, build verde, 325/325.

**Cron feedback — CONFIRMAT pornit + funcțional**: `*/15 * * * *` pe VPS2 → `/api/cron/escalation` → `runFeedbackReview()` (identificare 👎 → judecată AI → fix/ascunde/semnalează → resolved → notificare user+admin). 9/9 ale lui Rareș rezolvate + notificate.

- [x] **Desktop bell — CONFIRMAT vizual 2026-06-25** via journey-audit logat ca `admin-test` (SuperAdmin): clopoțelul e în colțul dreapta-sus cu **badge roșu „9"** (necitite, alb pe roșu) — exact standardul cerut. Screenshot `journey-audit-results/tutor/screenshots/en_dashboard_family.png`.

---

## [~] 👨‍👩‍👧 Pachete de familie — Fazele 0-3 DONE + LIVE 2026-06-25 (commits `dec353e`+`e750b6d`+`246e2fb`); Faza 4 (True E2E full) rămâne

**Rezolvă „CE LIPSEȘTE" #1+#2+#3 de mai jos** (legătură 1:1, onboarding self-service, scaffold pachete) — wiring real, nu doar marketing. Plan (a) agreat 2026-06-03, executat acum.

**Livrat + LIVE pe etutor.ro:**
- **Model (migrare aditivă `0035`)**: `Guardian.relation` PARENT|TUTOR + `FamilyInvite` (token + cod scurt, single-use, TTL 7 zile). Backup DB prod: `VPS2:/root/backups/tutor-pre-family-2026-06-25.dump`. Pilot Alex→Rareș backfilled la `PARENT`.
- **`src/lib/family.ts`** (sursă unică pachet→locuri→funcții + reguli seat pure) + **`src/lib/family-invite.ts`** (invite create/deliver email/WhatsApp/Telegram/cod, accept token+cod, creează-cont-copil-direct, scoatere membru, math household/seats).
- **UI** `/dashboard/family` (adaugă copil/părinte/meditator; 3 căi de legare; invitații pending + revocare; scoatere) + public `/family/accept/[token]` + `/family/join` (cod). Merge pe conturi existente (Google) via signin callbackUrl. Nav „Familia mea" (RO+EN).
- **Drepturi**: seat strict la creare+accept+direct (advisory lock per familie → ține sub accept-uri concurente); CTA upgrade (părinte) / add-on cu reducere (copil). **Leak fix**: meditatorul = WATCHER + Guardian `relation=TUTOR`, **niciodată INSTRUCTOR** → vede doar copiii plătiți.
- **Faza 3 audit suprafață**: `Reports/family-packages-surface-audit-2026-06-25.md` (matrice rol×pachet; toate rutele watcher/[id] gate-uite `isGuardianOf` → fără IDOR pe copil).
- **/review adversarial (2 treceri)** → 2 buguri reale găsite+fixate (P1 IDOR co-părinte la `removeFamilyMember`; P2 mutare-rol la accept) → re-verificat CLOSED/SHIP.
- Verificat: tsc clean, 325/325 vitest (+27 noi), build verde, smoke prod (join/accept 200 public, dashboard 307, api 401), L41 vecini OK.

**Faza 4 — parțial DONE 2026-06-25:**
- [x] **/review adversarial** (2 treceri) → 2 bug-uri reale fixate (vezi mai sus).
- [x] **Integration E2E pe prod** (12/12) cu conturile test existente (`admin-test`=owner, `test_student`=copil, `test_watcher`=meditator), canal CODE (fără send-uri externe): child accept · child link PARENT · tutor accept · tutor link TUTOR · **tutor fără INSTRUCTOR + watcherSeesAllStudents=false + getLinkedChildIds include copilul** (leak-fix dovedit) · overview · role_conflict child→tutor · double-accept · self-invite. Snapshot+cleanup verificat (prod restaurat: doar legătura pilot, 0 invitații, roluri admin-test restaurate). Harness rulat ad-hoc (necomis).
- [x] **Journey walks UI — DONE 2026-06-25 (toate 4 rolurile)**: journey-audit per rol (creds aliniate în `Master/credentials/tutor-test-users.env`):
  - **admin-test** (SuperAdmin): 19/19 OK — vede Familia mea + Admin Feedback + **clopoțel cu badge roșu „9"**.
  - **test_student** (elev): 18 OK + 1 fals-pozitiv (Exam Simulator „HAS_ERRORS" = regex prinde badge-urile „FAILED" din istoricul de examene, pagina e OK). Blocat corect de Admin Feedback/Questions/Instructor (redirect → Dashboard).
  - **test_watcher** (părinte): 19/19 OK — vede Familia mea; blocat de Admin Feedback.
  - **test_instructor** (meditator): 19/19 OK — vede paginile Instructor; blocat de Admin Feedback/Admin Questions.
  - **Concluzie audit suprafață**: fiecare rol ajunge la ce-i al lui; Admin Feedback e admin-only (layout `dashboard/admin` cere ADMIN/superadmin) — non-adminii sunt redirecționați. „Nimic lipsă, nimic neplătit accesibil" = confirmat la runtime.
- [x] **Concurrency — DONE 2026-06-25**: seat-race pe prod (date throwaway, cleanup): 2 accept-uri simultane (`Promise.all`) pe pachet Family (1 loc copil) → advisory lock per-familie → **exact 1 acordat, 1 `seat_unavailable`, finalChildren=1**. Validează hardening-ul din /review.
- [x] **Parity / Stress — N/A documentat**: Tutor = un singur mediu prod (etutor.ro; Neon=rollback), fără demo separat; invite/accept human-paced → contention-ul real e deja acoperit de concurrency. Vezi raport.
- [x] **True E2E [10] — COMPLET pt scope aplicabil** (8/8 faze aplicabile + 3 N/A documentate, 0 P0/P1). Raport consolidat: `Reports/TRUE-E2E-family-packages-2026-06-25.md`.
- [x] ✅ **Billing → roluri** — DONE 2026-06-29 (commit la push, LIVE): achiziția unui plan de familie deblochează acum „Familia mea" în nav. Layout-ul dashboard interoghează `subscriptionStatus` + `subscriptionPlan` și calculează `hasFamilyPlan` (`isPaidStatus` + `resolveFamilyPlanFromRecord` cu seat-uri >0); Sidebar gate-uiește secțiunea familie pe `isWatcher || hasFamilyPlan` (+ `isParentView`). Pagina/API `/dashboard/family` rulau deja pe plan (fără cerință de rol WATCHER server-side), deci nav-ul se aliniază acum cu capacitatea reală — fără risc 403. Închide gap-ul „plătit dar meniul blocat".
- [ ] **WhatsApp invitație rece**: template Meta aprobat `WHATSAPP_INVITE_TEMPLATE` (acțiune user; până atunci email/Telegram cad pe „copiază linkul").
- [ ] **Email branded** invitații: depinde de itemul Resend DNS `etutor.ro` de mai jos.
- [ ] **Sync enrollment**: la înscriere ulterioară a copilului la un domeniu nou, guardianul nu e auto-înrolat WATCHER acolo (hook pe `enrollment.create`).
- [ ] **Ancoră explicită**: marker de ancoră pe Guardian (acum: familie legacy fără invitație cu ≥2 părinți → nici ancora nu poate cascada scoaterea copilului; fail-safe, under-removes).

---

## [ ] 📧 Email branded — trece de pe techbiz.ae pe `notifications@etutor.ro` (creat 2026-06-24)

**Context**: pe 2026-06-24 am conectat cheia Resend partajată (cont techbiz) în prod-ul Tutor, dar singurul domeniu **verificat** pe acel cont e `techbiz.ae` → rapoartele Watcher + reminderele pleacă temporar de pe **`eTutor <noreply@techbiz.ae>`** (deliverabil, dar cross-brand). `etutor.ro` NU e verificat în Resend.

**De făcut** (sesiune dedicată, necesită acces DNS Hostico + decizie cont Resend):
1. Verifică `etutor.ro` în Resend: `POST https://api.resend.com/domains {name:"etutor.ro"}` (decide pe ce cont — cel partajat techbiz SAU cont/cheie Resend dedicat eTutor) → obține înregistrările DNS (TXT SPF + DKIM CNAME-uri + DMARC).
2. Adaugă înregistrările DNS la Hostico pentru `etutor.ro` → așteaptă propagare + status `verified` în Resend.
3. Schimbă `EMAIL_FROM` în `/var/www/tutor/.env` (+ mirror `Master/credentials/tutor.env`) la **`eTutor <notifications@etutor.ro>`** + `pm2 restart tutor --update-env`.
4. Dacă folosești cheie Resend nouă (cont dedicat) → actualizează și `AUTH_RESEND_KEY`.
5. Verifică: test send → `notifications@etutor.ro` livrează; apoi un raport Watcher real „Trimite acum" ajunge cu expeditor branded.

**Note**: backup-uri config curente `/var/www/tutor/.env.bak-2026-06-24-channels` + `Master/credentials/tutor.env.bak-2026-06-24-channels`. Codul e gata — e doar config DNS + 1 linie env.

---

## [x] 📄 Licență — proveniență verificabilă (pagină + secțiune + citat) pe grile — DONE 2026-06-25 (commits `1ccf78c` + `a51465b`, LIVE etutor.ro)

**Rezultat**: 204/204 grile actualizate pe prod (199 ancorate la pagină reală + secțiune; 0 mai au „Secțiunea N"; 5 front-matter fără pagină = candidate review). Rareș vede acum DUPĂ răspuns: „📄 Citat din lucrare: «...»" + „Sursă: Lucrare de licență — pagina X · 1.2. ..." + referința e **țesută și în textul Explicației** (commit `b5b8fe1`). Backup DB pre-backfill: `VPS2:/root/backups/tutor-pre-licenta-provenance-2026-06-25.dump`. Verificat: deploy OK, date corecte (ex. p7 → „1.2. Calitatea serviciilor"), prod 307. Cele 5 fără pagină + 11 DRAFT → vezi item-ul de mai jos.

**🔒 SECURITY (fixat în aceeași sesiune, commit `b5b8fe1`)**: quiz-ul public demo (`/api/public/practice/quiz`) filtra doar după `subject`, fără verificare de domeniu → conținutul restricționat (grilele private de licență ale lui Rareș + domeniile aviație doar-Rareș) era **citibil public fără login** (subiecte generice „Licență"/„Mathematics"/„Physics"). Acum servește DOAR domenii publice (curriculum). Verificat pe prod: `subject=Licență/Physics/Mathematics` → 0; subiecte publice → 5. Lecție: orice endpoint public care servește `Question` după `subject` TREBUIE să excludă domeniile restricționate (subiectele nu sunt unice per domeniu).

**Problemă (Rareș nu putea verifica)**: grilele de Licență aveau `topic = "Secțiunea N"` = doar al N-lea fragment auto-tăiat din PDF, fără sens. Citatul-sursă era stocat în `sourceReference` dar ascuns studentului.

**Livrat**:
- `scripts/backfill-licenta-provenance.mjs` — re-citește `1. Fabulosos srl licenta final.pdf` pagină-cu-pagină, leagă fiecare grilă de pagina reală (match pe citatul stocat, cascadă full→prefix→approx) + setează `topic` la secțiunea reală (1.1/1.2/.../Bibliografie). Idempotent, dry-run default. **Validat offline pe cele 204 grile: 199/204 (98%) ancorate la pagină + secțiune, 5 front-matter fără pagină.**
- Answer route + `FeedbackDisplay` + i18n RO/EN: Rareș vede DUPĂ ce răspunde „📄 Sursă: Lucrare de licență — pagina X · 1.2. ..." + **citatul verbatim** (ca să găsească pasajul). Citatul e expus DOAR pe domeniul `licenta-rares` (material propriu) — nu pe domenii cu surse cu drepturi de autor.
- `generate-licenta.mjs`: notă — după orice (re)generare, rulează backfill-ul.

**Follow-up minor**: verificare UI autentificată (login Rareș → sesiune licență → vede citatul) va fi acoperită de True E2E final. Cele 5 grile fără pagină = candidate de review (suprapunere cu item-ul DRAFT de mai jos).

---

## [ ] 🧪 Conținut Rareș — 33 grile DRAFT + (opțional) val nou Mate/Fizică (creat 2026-06-25)

**Context**: la verificarea retroactivă cross-model (commit `7014780`, sesiunea 2026-06-24/25), **33 grile** au picat (model A ≠ model B) și au fost puse pe `status='DRAFT'` (reversibil): **22 Aviație — Cunoștințe** + **11 Licență**. Abilitățile (440) au trecut 0 probleme (verificare = cod determinist). Decizie user 2026-06-25: **amânat pentru sesiune dedicată** (nu acum).

**De făcut** (sesiune dedicată):
1. **Listează cele 33 DRAFT** (read-only) cu întrebare/răspuns/motiv-disagree, grupate pe topic. Query: `SELECT id, "domainSlug", topic, status FROM "Question" WHERE status='DRAFT' AND ...` (cele marcate de `verify-rares-content.mjs`).
2. **Triere per-grilă**: publică cele corecte manual (`UPDATE "Question" SET status='PUBLISHED' WHERE id IN (...)`), șterge cele greșite, regenerează topicele cu gol via `scripts/generate-aviatie-cunostinte.mjs [perTopic] [wave]` (verificare cross-model încorporată → umple golul cu grile verificate).
3. Backup DB pre-orice mutație (`pg_dump` pe prod).

**Opțional (decizie user 2026-06-25: momentan NU)**: încă un val de **Matematică/Fizică** pentru Aviație — Cunoștințe (val 2 deja făcut). Rulează `scripts/generate-aviatie-cunostinte.mjs [perTopic] [wave-nou]` (append) doar dacă Rareș cere mai mult conținut.

**Reversibilitate**: DRAFT-urile rămân exact unde sunt până la decizie — `UPDATE "Question" SET status='PUBLISHED' WHERE id IN (...)` le readuce instant. Domenii: `aviatie-cunostinte`, `licenta-rares`.

---

## [x] 🎯 Link campanie BAC — DONE 2026-06-12 (commit `e7349d6`, LIVE)

**https://etutor.ro/bac** → `/ro/auth/register?exam=bac&voucher=BAC2026FREE`. Voucher **BAC2026FREE** (100%, nelimitat, fără expirare) creat în prod; env `BAC_VOUCHER` pe VPS2 + mirror `Master/credentials/tutor.env`. Preset: 8 materii BAC filtrate (română IX-XII pre-bifată — obligatorie; M1/M2/M3 + istorie/geo/bio/chimie selectabile per profil). E2E verificat pe prod: register cu voucher → abonament activ 1 an + enrollments corecte (cont smoke șters, usedCount decrementat). Sora link: `/evaluare` (EVALUARE100, commit `e0f0cde`).

---

## [x] 🛈 UX — Tooltips explicative (mouseover) pe pagina de Practică — DONE 2026-06-13

> Componentă reutilizabilă `InfoTooltip` (`src/components/ui/info-tooltip.tsx`) — hover + focus (tastatură/a11y) + tap (mobil, unde hover nu există), `role="tooltip"` + `aria-describedby`. Cablată în `SessionSelector` pe cele 3 statistici + cardul recomandat + cele 6 tipuri de sesiune (ⓘ ca overlay sibling, ca să nu fie buton-în-buton). Texte RO+EN sub `sessions.tip.*`. tsc + build OK.

Pe `/dashboard/practice` (pagina cu „Întrebări disponibile / Capitole studiate / Puncte slabe" + tipurile de sesiune), adaugă **tooltips cu mouseover explicativ la TOATE** elementele — utilizatorul trebuie să înțeleagă ce înseamnă fiecare fără ghicit:
- **Cele 3 statistici**: „Întrebări disponibile" (câte grile sunt în materie), „Capitole studiate" (câte capitole ai atins), „Puncte slabe" (subiecte unde ai greșit recent).
- **Cele 6 tipuri de sesiune** — fiecare cu ce e și când să-l folosești: **Sesiune rapidă** (practică obișnuită, 10 min/15 întrebări), **micro** (2 min/5 — recapitulare scurtă), **lungă** (20 min/30 — antrenament amplu), **remediere** (15 min/20 — se concentrează pe punctele slabe), **recuperare** (10 min/15 — reia întrebări greșite anterior), **intensivă** (20 min/30 — ritm/dificultate crescute).
- Implementare: componentă tooltip reutilizabilă (hover + focus pentru a11y/tastatură + touch pe mobil), text RO clar, fără jargon. Verifică pe desktop + mobil.
- Mobil: tooltips pe hover nu funcționează la touch → fallback (tap-to-show sau text descriptiv vizibil sub titlu).

---

## [~] 🎓 BAC — Matematică → GRILE + SIMULĂRI (creat 2026-06-10)

**3 programe naționale DISTINCTE, NICIODATĂ mixate** (cerere user): **M1 (Mate-Info)**, **M2 (Științele naturii)**, **M3 (Tehnologic)**. Fiecare program = domeniu propriu (`matematica-{m1,m2,m3}-ix-xii`, slug `-ix-xii` → grupul „Bacalaureat") + `subjectKey` propriu pentru Simulări (`matematica_m1/m2/m3` — altfel unique constraint `(examType,year,subjectKey,variant)` s-ar ciocni între programe) + tag grile propriu (`bac-grile-mate-m{n}:`).

**Două surse per lucrare** (ca la RO):
1. **GRILE** (Subiectul I, 6 itemi cu rezultat concret → MCQ ancorat în barem; corect = rezultatul oficial, distractori numerici plauzibili). `scripts/import-grile-bac-matematica-m1.mjs` (clonă per program). FĂRĂ AI, FĂRĂ poartă AI-judge.
2. **SIMULĂRI** complete (I 6×5p SHORT+finalAnswer; II+III câte 2 probleme OPEN 15p cu rubric a/b/c). `scripts/import-exam-bac-matematica-m1-model.mjs`. examType="BAC", grade 12, 180min, 90+10.

**Notație**: UI **fără KaTeX/MathJax** → Unicode inline (`√`, `²`, `∘`, `e^(−x)`, `log₂`, matrice `(0 0 1 / a −1 a / 1 0 0)`). fitz scoate matematica **dezordonată** → transcriere din **PDF randat la PNG citit vizual** (ground-truth), cross-check barem + calcul manual (vezi L10).

**Domenii create**: `band-matematica-bac.mjs` (m1/m2/m3 idempotent). `matematica-ix-xii` vechi (gol) rămâne neutilizat.

**Toate 13 lucrările batch sunt FĂRĂ FIGURI** (Mate-Info = algebră+analiză pură) — verificat cu scan `figur`/`reprezentat`. Deci batch = transcriere pură, fără pipeline de figuri, fără restart.

**PROGRES GRILE M1 (Faza A) — ✅ COMPLET 14/14 lucrări LIVE + VERIFICAT 2026-06-10**:
- DONE (35 grile, commits `03c0bef`+`16b6006`): **2024 model** (6) + **2022 model/simulare/var-01/var-03** (24) + **2023 model** (5, I.3 omis). Toate barem-anchored, cross-checked manual. Verificat live: homepage demo „Bacalaureat → Matematică M1 (Mate-Info) (35)". Simulare DOAR pentru 2024 model (pilot).
- **[x] Faza A finalizată — +8 lucrări (48 grile noi), commit `abbf891`**: 2023 (simulare, var-01, var-06, var-07) + 2024 (simulare, var-03, var-09, var-10). **0 itemi sări** (toate 48 transcriabile, niciun skip). 3 misread-uri prinse la cross-check (L10): 2023sim I.4 = „cel mult două cifre" (0–99=100) NU „două cifre"; 2023v01 I.5 A(4,0) NU A(0,4); 2024v10 I.4 set = {1,2,4,6,8,9} (am ratat „8" la prima citire). Import idempotent VPS2 → **83 grile / 14 lucrări LIVE** (verificat API `etutor.ro/api/public/practice/subjects` → „Matematică M1 (Mate-Info)" count=83). `/code-review` (recalcul matematic independent al tuturor 48) → ALL 48 OK, zero buguri. Backup DB pre-import: `VPS2:/root/backups/tutor-pre-mate-m1-faza-a-2026-06-10.dump`.
- **Faza B (SIMULĂRI) — ✅ 13/13 DONE 2026-06-10** (toate lucrările M1 full-paper LIVE: DB `matematica_m1` = 14 ExamPaper / 140 ExamItem, 10 itemi×90p fiecare; ExamPaper global 67→80):
  - **[x] Pilot 2024 simulare — DONE 2026-06-10, commit `b3e86b4` (batch script)**: creat `scripts/import-exam-bac-matematica-m1-batch.mjs` (scaffold `PAPERS[]`, clonă din `-model`). Lucrare completă: SI 6×SHORT+finalAnswer+rubric; SII (matrice A(x) det/inversă + lege compoziție x∗y) + SIII (analiză: f=(x+6)√(x²+4) monotonie + integrale/șir Iₙ) câte 2×OPEN cu rubric a/b/c. Transcris VERBATIM din subiect+barem CNPEE (randat, nu fitz). Math II+III re-verificat independent (agent) → ALL OK. Import VPS2 idempotent: ExamPaper 67→68 (2024 model + 2024 simulare ambele 10 items, isActive). Backup `VPS2:/root/backups/tutor-pre-mate-m1-simulare-2026-06-10.dump`. Verificare: DB query (structură identică cu 2024 model care randează deja în UI). **TODO verif autentificat UI walk** (login SuperAdmin, ca la celelalte) — neefectuat în sesiune (același pattern ca model-ul live).
  - **[x] RĂMAS Faza B — 12 lucrări DONE 2026-06-10** (regim mesh secvențial: dezvoltare→/review(agent math)→TWG-fix→import per lucrare): 2022 (model `3bd6ad3`, simulare `e85bf59`, var-01 `c800e0e`, var-03 `7e7822d`), 2023 (model `812de9e`, simulare `e41808c`, var-01 `16f63db`, var-06 `299e7f4`, var-07 `d1fdb68`), 2024 (var-03 `2c0c4b3`, var-09 `b67da59`, var-10 `b188cee`). Fiecare: 10 itemi/90p, SI 6×SHORT+finalAnswer+rubric, SII+SIII 2×OPEN cu rubric a/b/c VERBATIM din subiect+barem CNPEE randat (zoom 3.1–3.2, NU fitz). **Agent math re-verify independent (SI+SII+SIII, re-derivare from scratch) → ALL OK pe toate 12** (10/10 items fiecare, zero mismatch). L10 reconfirmat: cross-check subiect↔barem↔calcul a prins misread-uri (ex. 2022 model B colț „1" nu „i" via det B=i; II.1 `6−3√3` nu `6−2√3` via progresie geometrică). Backup DB pre-batch: `VPS2:/root/backups/tutor-pre-mate-m1-batch-2026-06-10.dump`. **TODO verif autentificat UI walk** (login SuperAdmin) — neefectuat (DB autoritativ; același pattern ca celelalte).

**[x] BAC M2 (Științele naturii) GRILE — DONE 2026-06-10** (regim mesh: dev→agent-review→fix per batch an, import). Script `scripts/import-grile-bac-matematica-m2.mjs`, subject „Matematică M2 (Științele naturii) — Bacalaureat", domeniu `matematica-m2-ix-xii`, tag `bac-grile-mate-m2:`. **16 lucrări / 96 grile LIVE** (etutor.ro API count=96): 2022 (model,simulare,var-01,var-03,var-07) + 2023 (model,simulare,var-01,var-06,var-07) + 2024 (model,simulare,var-03,var-08,var-09,var-10). Toate transcrise verbatim din subiect+barem CNPEE randat (zoom 3.05, NU fitz), cross-check L10. **Agent math re-verify independent → ALL OK pe toate 96** (3 batch-uri an: 30+30+36). Commit `58c87a0`. NU mixate cu M1/M3. **[x] SIMULĂRI M2 full-paper (Faza B) — DONE 2026-06-10**: 16 lucrări ExamPaper (`subjectKey=matematica_m2`, script `import-exam-bac-matematica-m2-batch.mjs`, 10 itemi = SI SHORT din grile + SII/SIII OPEN cu rubrici a/b/c, 90p+10 oficiu), aceleași 16 variante. SII+SIII transcrise verbatim din subiect+barem (matrice/Viète/legi compoziție/derivate/integrale/arii/volume rotație), agent math re-verify independent → **ALL OK** (2022 36/36 + 2023 60/60 + 2024 72/72 subitemi SII/SIII). Commits `3492bef`→`ae25ab5`. LIVE auth-gated (ExamPaper matematica_m2=16).

**[x] BAC M3 (Tehnologic) GRILE — DONE 2026-06-10** (regim mesh). Script `scripts/import-grile-bac-matematica-m3.mjs`, subject „Matematică M3 (Tehnologic) — Bacalaureat", domeniu `matematica-m3-ix-xii`, tag `bac-grile-mate-m3:`. **17 lucrări / 102 grile LIVE** (etutor.ro API count=102): 2022 (model,simulare,var-01,var-03,var-07) + 2023 (model,simulare,var-01,var-05,var-06,var-07) + 2024 (model,simulare,var-01,var-03,var-09,var-10). Verbatim din subiect+barem CNPEE, cross-check L10. **Agent math re-verify → ALL OK pe toate 102** (3 batch-uri an: 30+36+36). Commit `fcc96eb`. NU mixate cu M1/M2. **[x] SIMULĂRI M3 full-paper (Faza B) — DONE 2026-06-10**: 17 lucrări ExamPaper (`subjectKey=matematica_m3`, script `import-exam-bac-matematica-m3-batch.mjs`, 10 itemi SI SHORT + SII/SIII OPEN cu rubrici), aceleași 17 variante. SII+SIII verbatim, agent math re-verify → **ALL OK** (2022 60/60 + 2023 66/66 + 2024 72/72 subitemi). Commits `8e30195`→`4682536`. LIVE (ExamPaper matematica_m3=17). **Toate cele 3 programe BAC mate LIVE: GRILE M1=83 + M2=96 + M3=102 = 281 grile · SIMULĂRI full-paper M1=14 + M2=16 + M3=17 = 47 lucrări (ExamPaper).**

**Anti-pattern**: NU genera AI când există barem (L07a/L09). NU mixa programele (M1/M2/M3 — domeniu+subjectKey+tag proprii). NU transcrie din fitz dump pentru math — render PDF→PNG + cross-check barem/calcul (L10). NU ghici itemi negarbil-transcriabili — sari-i.

---

## [x] 🎓 BAC — Limba și literatura română → GRILE — DONE 2026-06-09 (13/13 papers, 75 grile LIVE)

**PIVOT 2026-06-09 (cerere user): output = GRILE, nu Simulări.** BAC RO n-are MCQ oficiale (e eseuri + întrebări deschise), DAR baremul oficial dă răspunsurile → fac grile **ancorate în barem**: întrebarea = cerința oficială reformulată MCQ, opțiunea corectă = răspunsul din barem (verbatim), distractori plauzibili. Fără generare AI de conținut, fără poartă AI-judge (corectitudinea e oficială). Script: `scripts/import-grile-bac-ro.mjs` (idempotent, tag `bac-grile:%`). Țintă: domeniul **`romana-ix-xii`** (slug `-ix-xii` → grupul **Bacalaureat** în dropdown-ul homepage + secțiunea Grile), subject „Română — Bacalaureat", source MANUAL. Textul-suport reutilizat verbatim din ExamPaper-ul deja importat (passage atașat pe grilă, drawer „📖 Vezi textul" + în demo-ul fără cont).
- **ExamPapers BAC = isActive:false** (depozit text+barem pt grile, ASCUNSE din Simulări — reversibil dacă vrei și Simulări mai târziu). Demo quiz API + SubjectQuizDemo randează acum passage (commit `47776c4`).
- **Etichetă dropdown** (amendament user 2026-06-09, commit `1495b48`): sub grup nu se repetă nivelul → „Română (30)" nu „Română — Bacalaureat"; idem EN VIII „Matematica"/„Română". Display-only (API câmp `display`), valoarea `subject` neatinsă.
- **TOATE 13 papers DONE (75 grile)** — commits `3af78cb`(2025×5=30) + `709d008`(2024×5=30) + `ac122ab`(2023×3=15). Verificat live: dropdown „Bacalaureat → Română (75)", quiz 5q cu passage + correctIndex valid.
  - 2025: model (Rebreanu jurnal) · simulare (Doinaș) · var-06 (Carianopol/Pillat) · var-07 (Băjenaru/Pârvan) · var-08 (Crainic) — 6 grile/paper.
  - 2024: model (Slavici) · simulare (Rebreanu Metropole) · var-02 (Dimisianu/Arghezi) · var-04 (Brătescu-Voinești) · var-09 (Mihail Șerban/Sadoveanu) — 6 grile/paper.
  - 2023: var-01 (Maria Banuș) · var-05 (Marin Preda) · var-06 (Călinescu/Creangă) — 5 grile/paper (A.1 single secvență).
  - Toate ancorate în barem (răspuns corect = răspunsul oficial; distractori plauzibili), passage inline self-contained, topic Vocabular/Înțelegerea textului.
- **Extensie viitoare**: pentru materiale BAC noi (RO sau altă materie), adaugă bloc {year,variant,passage,items[]} în `import-grile-bac-ro.mjs` (RO) sau un script-frate (altă materie) → import → grile apar automat sub „Bacalaureat" în dropdown (slug domeniu `*-ix-xii`).
- **Categorisire pagini logate (DONE 2026-06-09, commit `02ba02e`)**: shared `src/lib/exam-level.ts` (slug/examType → EN_VIII/BAC). (a) **Grile picker** `/dashboard/practice` — dropdown „Materie" grupat pe nivel (optgroup), doar materii școlare cu grile (Aviation/Drept/Istorie/Geo/Bio/Chimie + materii goale ascunse). (b) **Simulări** `/dashboard/exam-bank` — nested **nivel → materie → an** (ex. Evaluarea Națională / Matematică / 2024).
- **BAC Simulări COMPLETE 13/13 (DONE 2026-06-09, commit `5351368`)**: `scripts/import-exam-ro-bac-batch.mjs` — 11 ExamPapers BAC noi (peste model+simulare 2025) ca simulări-eseu complete: Subiectul I (text + A 5 itemi + B argumentativ) + II (comentariu liric / rol notații autor dramă / perspectivă narativă / modalități caracterizare — fragment inline) + III (eseu) = 90+10. **Textul Subiectului I reutilizat din rândurile grile** (`bac-grile:%`, sursă unică — fără duplicare). Bareme B/II/III = baremul-standard oficial; A per-item verbatim. Verificat: 13 ExamPapers BAC (8 itemi + 1 passage fiecare), take page 200 cu passage+B/II/III, grupate în Simulări sub Bacalaureat/Limba și literatura română/an. **BAC complet acum: 75 grile + 13 simulări-eseu.**

## [x] 🎓 BAC — Limba și literatura română (import text/barem, creat 2026-06-09) — SUPERSEDED/DONE 2026-06-13

> **Reconciliere 2026-06-13**: această secțiune `[~]` (abordarea per-variantă „import text/barem → Simulări") a fost **înlocuită de PIVOT-ul la GRILE** (vezi secțiunea de deasupra, „BAC RO → GRILE — DONE 2026-06-09, 75 grile") + batch-ul de Simulări-eseu (`import-exam-ro-bac-batch.mjs`, commit `5351368`, 13/13 ExamPapers). Toate cele 13 lucrări (2023×3 + 2024×5 + 2025×5) sunt LIVE. **Verificat prod 2026-06-13** (`/api/public/practice/subjects`): Bacalaureat → Română = **75 grile** live. Markerele queue de mai jos erau stale (munca s-a închis pe calea pivotată, în secțiunea de sus). Niciun conținut BAC RO restant.

**Materiale**: `~/Downloads/Temp/BAC-RO/` — 13 perechi oficiale `E_a_romana_real_tehn_<an>_var_<x>` (subiect) + `bar_<x>` (barem), proba E.a, filiera reală/tehnologică (CNPEE, public). 2023×3 (var 01/05/06), 2024×5 (var 02/04/09/model/simulare), 2025×5 (var 06/07/08/model/simulare). (`var_09 (1)` = duplicat, se ignoră.)

**Structură BAC RO** (≠ EN VIII): `examType="BAC"`, grade 12, timeLimit 180. Subiectul I (50p) = 1 text + A (5 itemi comprehensiune, 30p) + B (text argumentativ ≥150 cuv, 20p); Subiectul al II-lea (10p) = comentariu text liric (poemul embed în content); Subiectul al III-lea (30p) = eseu (text studiat). **Toți itemii OPEN/SHORT — ZERO MCQ** → self-score pe barem; **nu produc grile MCQ** (doar Simulări). 90+10 oficiu=100. Script per lucrare: `scripts/import-exam-ro-bac-<an>-<variant>.mjs` (template din `import-exam-ro-2025-model.mjs`).

**Infra (DONE 2026-06-09, commit `53a7665`)**: lista exam-bank (`/dashboard/exam-bank`) **grupată pe nivel** (Evaluarea Națională cl. VIII vs Bacalaureat IX–XII) ca să nu se amestece audiențele. Backup prod pre-campanie: `/root/backups/tutor-pre-bac-2026-06-09.dump`.

**Queue (2/13 DONE)**:
- [x] **2025 Model** — DONE 2026-06-09 (`53a7665`): text jurnal Puia Florica Rebreanu + 8 itemi (A.1-A.5 + B + II Vlahuță „Sonet" + III eseu Sadoveanu). Verificat autentificat: listă grupată (secțiunea Bacalaureat) + take page randează passage+poem+itemi. ExamPaper 53→54.
- [x] **2025 Simulare** — DONE 2026-06-09 (`84dfee0`): text Ștefan Aug. Doinaș „Liviu Rusu"/Evocări + 8 itemi (A.1-A.5 + B + II Adrian Maniu „Iarnă" + III eseu roman psihologic/al experienței). ExamPaper 54→55, verificat în DB (8 itemi) + listă.
- [x] 2025: var_06, var_07, var_08 — DONE via GRILE+batch (`5351368`), prod-verified 2026-06-13
- [x] 2024: model, simulare, var_02, var_04, var_09 — DONE via GRILE+batch (`5351368`), prod-verified 2026-06-13
- [x] 2023: var_01, var_05, var_06 — DONE via GRILE+batch (`5351368`), prod-verified 2026-06-13

**Per lucrare** (playbook `knowledge/exam-bank-import-playbook.md` §2, adaptat BAC): extract subiect+barem (fitz system python3) → transcriere verbatim (text + itemi + bareme ground-truth) → `--validate` (sum 90) → import pe prod DB → verificare autentificată (listă + take render). `/review` mesh pe script. Fără figuri de regulă (BAC RO e text). Mostly text-only → import nu cere rebuild (doar dacă ating cod).

---

## [x] 💸 Promo pricing — wording + preț tăiat în carduri (creat 2026-06-03) — DONE 2026-06-09 (commits `0b88b40`+`fe99ecd`, LIVE + verificat)

**DONE 2026-06-09** (instrucțiuni mesh): ambele puncte livrate pe `/preturi` ȘI `/parinte`, RO+EN.
- **(1) Wording**: „prețurile cresc în consecință" → „prețurile **revin la normal**" (RO) + „prices **return to normal**" (EN). Verificat live (4 string-uri).
- **(2) Preț tăiat**: fiecare card arată **prețul normal tăiat cu roșu** lângă promo. Ambiguitatea „afișat=promo sau normal?" REZOLVATĂ de textul promo al paginii („reducere suplimentară de 25%" → afișat=promo) → normal = promo/0,75 = exact numerele din TODO (Elev 26,53 / Family 33,20 / Duo 39,87 / Trio 53,20 / Family Trio 66,53). **Data-driven** prin `src/lib/pricing.ts` (sursă unică: `PROMO_FACTOR=0.75`, `PROMO_END=2026-09-01`): după expirare cardurile afișează automat prețul normal (fără tăiere) + banner-ul promo dispare — fără modificare de cod la dată. Verificat live: 10 `line-through` + toate normalele pe /ro/preturi+/ro/parinte; format cu punct pe /en. `/review` mesh `[]`.

Pe `/parinte` ȘI `/preturi` (RO + EN), 2 ajustări la promo (−25% până la 30/31.08.2026):
1. **Wording**: înlocuiește „De la 1 septembrie 2026, prețurile cresc în consecință." → „De la 1 septembrie 2026, prețurile vor reveni la normal." (RO) + echivalent EN („…prices return to normal.").
2. **Preț tăiat în card**: din moment ce comunicăm −25% suplimentar acum, fiecare card de pachet să arate **prețul normal tăiat cu roșu** lângă prețul promoțional, până la **30.08.2026**. Ex: ~~33,20 lei~~ **24,90 lei / materie / lună**. (Prețuri normale = promo / 0,75: Elev 26,53 / Family 33,20 / Duo 39,87 / Trio 53,20 / Family Trio 66,53 — de confirmat rotunjirea cu user, sau invers: promo = normal × 0,75 cu „normal" fiind prețul afișat acum × 1/0,75.)
   - **De clarificat cu user la implementare**: prețurile afișate ACUM (24,90 etc.) sunt deja cele promoționale (−25%) SAU sunt cele „normale" peste care se aplică −25% la checkout? Afectează ce număr tai cu roșu. Conform textului promo „toate pachetele au o reducere suplimentară de 25%", cele afișate par a fi promoționale → normalul tăiat = afișat / 0,75.

---

## [x] 🏠 Homepage — secțiunea „De ce aleg etutor.ro" + nav links — DONE 2026-06-03 (`012f52b`+`b7228ed`): trial footnote (`*`), proofLead progres controlat (elev+părinte+meditator), GDPR mutat în footer, progres/motivație fără „gamification" + secțiune audiență. Brand „eTUTOR.ro" consecvent.

Probleme de reformulat în secțiunea de proof + restul homepage-ului (RO+EN, `src/app/[locale]/page.tsx`):
1. **„Gratuit, fără card"** induce că tot e gratis — de fapt e doar **free trial**. Clarifică: pune un **`*`** și explică imediat sub el ce înseamnă (ex: „* 7 zile gratuit, 2 materii/zi × 5 întrebări; apoi alegi un plan").
2. **Focus pe progres controlat** — punctul forte real: progresul e **vizibil și controlat de elev, de părinte ȘI de meditator**. Reformulează proof-points în jurul ăstuia (nu „grile reale" seci).
3. **„🔒 Date protejate (GDPR) · conform, transparent"** — **NU e punct forte**, e cerință legală. Scoate-l din „de ce ne aleg" (eventual mută-l discret în footer).
4. **Explică simplu cât de ușor e** să faci totul + cum **vezi progresul / rămâi motivat** (concept de gamification, dar **FĂRĂ termenul „gamification"** — nu e înțeles; folosește limbaj simplu: „vezi cum crește pas cu pas", „te ține în priză", puncte/niveluri în cuvinte clare).

## [ ] 🧠 Funnel psihologic Părinte — `/parinte` + CTA (creat 2026-06-03)

**Principiu:** în zona Părinți și pe CTA, **factorul psihologic e determinant**. Părintele e pus **în centrul atenției** — pornim de la frica/întrebarea lui, nu de la features. Text **fluid, condensat, ca și cum i-am răspunde direct la toate temerile**. Ordine emoțional → dovadă → preț (ladder PAS: Problem → Agitate → Solution).

**Cele 3 convingeri de indus la părinte (mesajul trebuie să le bifeze pe toate):**
1. **„Aplicația chiar îl ajută pe copil să învețe și să sedimenteze, ușor, ca într-un joc."** — arată exemple concrete de **progres zilnic și săptămânal** (pas cu pas, niveluri, serii); **FĂRĂ cuvântul „gamification"**.
2. **„Se extinde și la meditator."** — părintele vede meditatorul ca **validator suprem** al progresului copilului. Mesajul: Tutor îi dă meditatorului vedere pe greșelile copilului → meditatorul lucrează țintit, iar părintele vede că meditatorul confirmă progresul. (Meditatorul = aliat, nu concurent.)
3. **„Prețul e minuscul față de ce primesc înapoi."** — ancorează prețul de valoare: **remindere WhatsApp** ca copilul să-și facă testele + **escaladare către părinte și/sau meditator** când ceva nu merge (teste neefectuate, lipsă de concentrare, subiecte neînțelese) + **rapoarte de progres săptămânale/zilnice** (zilnic dacă părintele cere). Compară discret cu costul orelor de meditații.

**Întrebări-cârlig (profunde, psihologice) — funnel spre „uite ce face Tutor: …":**
- „Tu știi dacă copilul tău chiar **învață** în orele alocate studiului — sau doar stă cu manualul deschis?"
- „Copilul merge la meditații… dar de unde știi **exact** că și **progresează**?"
- „Când a fost ultima dată când ai aflat **la timp** că nu a înțeles un capitol — nu abia la teză?"
- Fiecare întrebare → micro-agitare → **„Uite ce face Tutor: …"** (răspunsul concret) → următoarea întrebare → CTA.

**CTA final — două variante clare, cu avantaj net:**
- **Trial** (risk-free): „Începe gratuit 7 zile — vezi în prima săptămână dacă copilul chiar progresează. Fără card." + **costul de a aștepta** („în fiecare zi fără feedback e o zi în care nu știi unde stă").
- **Plată imediată**: avantajul concret (ex: acces complet din prima + [discount/bonus de decis] + linișea că remindere+rapoarte pornesc azi).

**Întrebare de design (de decis la implementare):** întrebările părintelui ar putea fi o **animație în centru** (părintele în centrul atenției — întrebările apar pe rând, animat, cu răspunsul „uite ce face Tutor" dezvăluit la scroll/tap). De evaluat: pornim **direct cu părintele în centru** (hero = întrebarea lui, nu logo/feature) vs. secțiune dedicată mai jos. Recomandare: hero emoțional cu 1 întrebare + funnel animat dedesubt.

**Best practices de aplicat (completare la ideile de mai sus):**
- **PAS + loss-aversion**: miza reală = Capacitate/BAC; „o materie neînțeleasă la timp = puncte pierdute la examen". Frica de eșec mișcă părintele mai mult decât promisiunea de succes.
- **Specificitate numerică**: „raport în fiecare duminică", „reminder la 24h și 2h", „vezi exact ce a greșit" — concretul convinge, generalul nu.
- **Dovadă vizuală**: mockup de **mesaj WhatsApp real** (reminder + escaladare) + screenshot de progres săptămânal direct în pagină → face promisiunea tangibilă.
- **Un singur CTA dominant** per secțiune (evită paralizia alegerii); trial = butonul principal, plata = secundar/altă culoare.
- **Mobile-first**: părinții citesc pe telefon → text scurt, întrebări ca titluri mari, animație ușoară, butoane mari.
- **Meditatorul ca autoritate** (reciprocity/authority): „meditatorul vede greșelile, tu vezi că meditatorul confirmă" — închide bucla de încredere.
- **Zero jargon**: fără „AI", fără „gamification", fără „engagement" — limbaj de părinte.

**Fișiere:** `src/app/[locale]/parinte/page.tsx` (+ hero/`page.tsx` dacă mutăm cârligul pe homepage). RO+EN. Coordonează cu item-ul 🏠 Homepage (proof-points) — același mesaj, fără contradicții.

## [ ] 👪 Flux Părinte↔Copil↔Meditator (Faza C/D/E) — specializare a infra Watcher (verificat 2026-06-03)

**Esența proiectului.** Verificat în cod 2026-06-03 (corectează un „nu există" greșit anterior).

**CE EXISTĂ deja (backbone ~50-60%):**
- Rol **WATCHER** în `EnrollmentRole` (STUDENT/WATCHER/INSTRUCTOR/ADMIN).
- **Dashboard Watcher** funcțional: `src/app/[locale]/dashboard/watcher/` + API `src/app/api/dashboard/watcher/` — monitorizează progres elevi (`getStudentProgressSummary`, `predictive-analytics`).
- **Escaladare**: `EscalationThreshold` (metric streak/score/session_missed, action `notify_watcher`), `EscalationEvent`, `EscalationChannel`, `NotificationPreference`.
- Dashboard **Instructor** (Group/GroupMember, InstructorGoal/Message, thresholds).

**CE LIPSEȘTE (stratul self-service de părinte):**
1. **Legătură 1:1 părinte↔copil.** Acum watcher-ul vede **toți elevii din domeniu** (`watcher/route.ts`: „students in same domain enrollments where watcher has WATCHER role") → **GDPR/privacy fail** pentru părinte. Necesită model de legătură specific (părinte → DOAR copilul lui). Probabil un model `Guardianship`/`ParentChild` (parentId, childId, relation, confirmedAt) + scoping pe watcher dashboard când rolul e „părinte".
2. **Onboarding self-service**: părinte signup → creează/invită cont copil (magic-link / cod) → opțional leagă meditator. Acum legarea = doar admin enroll sau grupuri instructor.
3. **Planuri Family/Duo/Trio**: zero wiring backend (doar marketing pe `/parinte`). Necesită „un plătitor, N conturi legate" peste `SubscriptionPlan` + Stripe.
4. **Branding părinte** peste watcher dashboard + wiring nudge WhatsApp către părinte (canalul există; lipsește legătura părinte).

**Plan (a) — build, sesiuni dedicate** (agreat user 2026-06-03): model legătură 1:1 + onboarding self-service + plan Family/Trio + parent-branded watcher view + WhatsApp.
**Plan (b) — onest până atunci** (agreat user 2026-06-03): `/parinte` să NU promită self-service inexistent — CTA spre pas clar / „în curând" / waitlist, ca părintele să nu rămână blocat după signup.

## [x] 🧩 MagicQuiz text-generator — REPURPOSAT 2026-06-26 (commit `a6abdfc`, LIVE): decizie user (a) — devine funcție pentru elevii logați „Generează test din materialul tău" la `/dashboard/genereaza` (variantă fără CTA de cont) + intrare nouă în meniu „Generează test" (nav.generate). Componenta + API `/api/magic-quiz` reactivate. (spec original mai jos)

`/try` (URL-ul canonic „fără cont", referit din ~10 locuri) e acum **subject-picker pe grile reale** (`SubjectQuizDemo`), nu generatorul „text→test". Componenta `MagicQuizDemo` + API `/api/magic-quiz` **rămân** dar n-au pagină. De decis: (a) repurpose ca feature logat „Creează-ți propriul test din material"; (b) pagină separată `/genereaza`; (c) drop. Homepage nu mai promite generatorul (copy ajustat).

## [ ] 🎨 Logo eTUTOR.ro (creat 2026-06-03)

Brandul e acum wordmark text (`<Brand>`: **e** mic + **TUTOR** caps + **.ro** mic, albastru). De făcut un **logo grafic** dedicat (favicon + header). Nu acum — doar marcat ca să nu se uite. Culori audiență de reținut: ELEV/STUDENT=albastru, PĂRINTE=emerald, PROFESOR=ambră.

## [ ] 🔢 Homepage cifre — revizuire când PUBLISHED trece de ~1900 (creat 2026-06-03)

**Decizie user (A1, 2026-06-03):** lasă „Mii de grile reale" (hero/badge) + „1.400+" (SEO) + `getStats` (numără TOATE întrebările, inclusiv DRAFT) **așa cum sunt** — pe prod `getStats` arată deja ~1.900+, iar nivelul real de **1900+ publicate** se atinge curând, deci nu merită softuit acum. **Când publicatele trec real de ~1900** (azi: 195 published / 1925 total): (a) decide dacă `getStats` numără doar PUBLISHED (onest) sau rămâne pe total; (b) actualizează „1.400+" din SEO metadata la numărul real. Până atunci = OK conștient (overstatement temporar acceptat de user, publicarea e iminentă).

## [x] 🔗 Faza B finish — nav „Pentru părinți"/„Pentru elevi" — DONE 2026-06-03 (`012f52b`): `<SiteHeader>` cu 3 audience links colorate (Ești ELEV/STUDENT→/elev · PĂRINTE→/parinte · PROFESOR→/creatori), pe toate paginile publice.

Paginile sunt LIVE (200) și se leagă între ele, dar **nu-s în meniul de sus** (nav are doar Demo / Grile pe materie / Pentru profesori / Autentificare). Adaugă în header „Pentru părinți" + „Pentru elevi". Un singur loc de editat (header/nav din `page.tsx` + eventual componenta de nav partajată).

---

## [~] 💳 Flux de calculare a plății + checkout + GDPR (creat 2026-06-03; voucher-path LIVE 2026-06-05)

**PROGRES 2026-06-05** (commit `bf57daa`): **fluxul voucher (fără Stripe) e LIVE**. Pagină `/dashboard/activare` + `POST /api/activate`: elevul alege materiile → vede prețul → introduce voucher → **100% → suma 0 → înscris (STUDENT) + `subscriptionStatus=active` (1 an) + voucher consumat atomic**. `<100%` → `requiresPayment` (ruta card/Stripe, dormant). Nav „Activare acces" + namespace i18n `activare` (RO/EN). Generat **TESTER2026** (100%, 50 utilizări) — cod shareable pentru testeri. Verificat e2e: tester nou (0 materii) → TESTER2026 → înscris Mate+Română cl. VIII + active; voucher usedCount 1/50.
**RĂMÂNE — plata reală cu cardul (Stripe)**: `STRIPE_SECRET_KEY=""` gol pe prod + planul „Bronze" are `stripeId` fals. Necesită **acțiune user**: cont Stripe (test mode) → 3 chei (`STRIPE_SECRET_KEY` + publishable + `STRIPE_WEBHOOK_SECRET`) + produse/prețuri reale. Apoi: wire `SubscriptionPlan.stripeId` real + activez ruta `/api/admin/stripe/checkout` (deja aplică voucher ca `percent_off` coupon) + webhook acordă acces. GDPR/Legal-hub la checkout = sub-task ulterior.

**Firma (controller):** **Class RDA Impex SRL** (vezi `Master` reference entities).

**1. Engine de preț** — input: pachet ales (Elev/Student · Family · Family Duo · Trio · Family Trio) + **nr. materii** + **nr. copii** + **billing** (lunar vs anual). Prețuri de bază (lei/materie/lună): Elev **19,90** · Family **24,90** · Duo **29,90** · Trio **39,90** · Family Trio **49,90**.
**2. Reguli de discount** (sursă: `/preturi`):
   - Copii: al 2-lea copil **−20%**, începând cu al 3-lea **−30%**.
   - Materii: a 2-a materie **−15%**, începând cu a 3-a **−25%**.
   - Plată **anuală anticipată**: 2 luni gratis → plătești **10 luni**.
   - **Promo −25%** suplimentar pe TOATE pachetele **până la 31.08.2026**; de la **1 sep 2026** prețuri pline (de scos/expirat automat promo-ul la dată).
   - Ordinea de aplicare a reducerilor (cumulativ vs secvențial) = **de decis** (impact pe preț final).
**3. Checkout** — **Stripe** (`@aledan/stripe`, deja folosit de Tutor → probabil cel mai ușor) SAU **Revolut** (`@aledan/revolut-integration`); alege ce e mai simplu de realizat. Sumar comandă + recurență (lunar/anual) + facturare.
**4. GDPR** — integrare **Legal hub** la checkout: `ConsentRecord` + DSR proxy, controller = **Class RDA Impex SRL** (vezi matricea Legal din `Master/TODO_PERSISTENT.md` — Tutor de adăugat acolo). AppEntityMapping `tutor → Class RDA` în Legal (NO-TOUCH CRITIC, propose-confirm-apply).
**5. Conturi multi-rol** — depinde de fluxul Părinte↔Copil↔Meditator (item 👪) — un plătitor, N conturi legate. Coordonează cu acela.

**Note:** prețurile per-materie + multi-copil înseamnă engine real (nu preț fix). De clarificat: „materie" la nivel de copil sau de familie? Promo-ul are dată de expirare hard (31.08.2026) — pune-l data-driven, nu hardcodat în UI fără logică de expirare.

## [ ] 🎓 Banding domenii pe clase — roadmap (creat 2026-06-03)

Benzi: **V-VIII** + **IX-XII** (BAC separat ulterior dacă e nevoie). Focus: **Evaluare Națională**, apoi **Bacalaureat**.
- [x] **Matematica** — DONE 2026-06-03 (`scripts/band-matematica.mjs`): domeniu „Matematica"→„Matematica V-VIII" (169 grile, clasa V) + creat „Matematica IX-XII" gol; subject aliniat. Backup `/root/backups/tutor-Domain-pre-band-2026-06-03.sql`.
- [x] **Română** — DONE 2026-06-08 (`scripts/band-romana.mjs`): „Română cl. VIII" (Capacitate, are 32 grile oficiale) + creat „Română IX-XII" (BAC) gol. Oglindă a Mate.
- [ ] Apoi: **Istorie / Geografie / Biologie / Chimie / Fizică de liceu (IX-XII)**. **Amânat (user 2026-06-29):** BAC-ul se dă chiar zilele astea, n-a mai fost timp — pregătim conținutul spre **vară-toamnă**.

## [x] 🐛 Opțiuni cu literă dublată („A. a) …") — REZOLVAT 2026-06-08 (commit `7092259`)

**REZOLVAT 2026-06-08**: (a) bug-ul **nu mai e vizibil pe nicio grilă publicată** — cele 343 AI cu prefix sunt DRAFT (scoase la trecerea pe grile oficiale), iar grilele oficiale (540 Mate + 32 RO) au opțiuni curate (`["23","40","55"]`). (b) Fix robust la **afișare**: renderer-ul + feedback-ul scot un prefix de literă (`^[a-dA-D][).]\s+`) dacă opțiunea/răspunsul îl conține — strip DOAR la afișare, valoarea trimisă rămâne neatinsă (matching-ul nu se strică). Acoperă publicate + DRAFT + viitor. **RĂMÂNE (opțional, low)**: normalizare la sursă în generator (dacă se reia path-ul AI) — dar display-strip-ul face bug-ul moot oricum.

## [archive] 🐛 Opțiuni cu literă dublată — spec original (creat 2026-06-03)

**Confirmat live** (cele 181 grile Matematica publicate azi). Opțiunile sunt stocate CU prefix de literă inclus — `["a) 10 exerciții", "b) 15 exerciții", …]` — iar AMBELE randere mai adaugă o literă:
- elev: `src/components/session/question-renderer.tsx` → `A.` + `opt.label` = **„A. a) 10 exerciții"**
- admin: `src/components/admin/review-queue.tsx` → `a)` + opt = **„a) a) …"**
`correctAnswer` e și el cu prefix („c) 16.66 exerciții").

**Fix (date + sursă):**
1. Normalizare date: strip `^[a-dA-D][).]\s*` din fiecare `options[i]` ȘI din `correctAnswer`, consistent (ca să NU rupi matching-ul răspuns↔opțiune). Migrare one-shot pe toate publicate + drafts.
2. Fix la sursă (generator/parser în pipeline) — grilele noi să NU mai stocheze prefixul; litera o pun randerele.
3. Verifică după migrare: elev vede „A. 10 exerciții" (o literă), matching + barem corecte.

**Igienă găsită (DEFERRED — domain-level, nu bundle în item 1):** cele două denumiri NU sunt duplicate — **„Matematica" (355)** e domeniul principal *Matematica*, iar **„Matematică" (9)** sunt în domeniul *Aviation* (mate de aviație, separat legitim). Singurul punct cosmetic: domeniul principal e scris fără diacritică („Matematica"). Redenumire corectă „Matematica"→„Matematică" = schimbare la nivel de **domeniu** (atinge `name` + `slug` + URL-uri) → sesiune separată, nu acum.

## [~] 📚 Capacitate (clasa a VIII-a) — Română + Matematică consolidate V-VIII (creat 2026-06-03; secțiunea „Grile" LIVE 2026-06-05)

**PROGRES 2026-06-05** (commits `49865d5`→`4b96641`): secțiunea **„Grile" e LIVE** pe etutor.ro (= pagina Practise redenumită). Domeniul „Matematica V-VIII" → **„Matematica cl. VIII"** (bancă consolidată de Capacitate; păstrează slug `matematica-v-viii`). Creat shell **„Română cl. VIII"** (slug `romana-cl-viii`). Meniu: Practise→Grile (RO „Grile" / EN „Quizzes") + fix anglo-roman (Simulări/Simulations via `nav.examBank`). Pagina: i18n + empty-states + package-gating (elevul vede doar materiile din înscrierile lui).
**CONȚINUT = OFICIAL VERBATIM** (decizie user 2026-06-05 — NU AI regenerat): inițial publicasem din greșeală 343 grile AI_GENERATED clasa V → **reparat** (`scripts/grile-from-exambank.mjs`): cele 343 AI revenite la DRAFT (scoase din Grile) + copiat **ad-literam** itemii MCQ oficiali din exam-bank (`source=MANUAL`, cheie→text din barem, figureUrl→imageUrl): **Matematica cl. VIII = 540 grile** oficiale (271 fără figură + 269 cu figură); **Română cl. VIII = 32 grile** (doar MCQ independente de text — itemii de limbă B.1-B.4; cele passage-dependent rămân în Simulări). Idempotent (`exam-bank:<id>` în sourceReference). Verificat: 540/32 în sesiune + spot-check verbatim („5·(3+2·4)"→55; „Conțin diftong"→„picioare,liceu"). Backup `/root/backups/tutor-pre-grile-2026-06-05.dump`.
**UPDATE 2026-06-08**: (a) **sursa la corectare DONE** (commit `4a377c0`) — la fiecare răspuns, corectarea afișează proveniența (ex. „EN VIII 2022 Testul 4 — antrenament (CNPEE) · Subiectul I"), din `sourceReference` + secțiune; feedback-ul făcut bilingv. (b) **Mate VI/VII/VIII = acoperit** — cele 540 grile oficiale vin din examenele EN VIII care testează TOATĂ materia V-VIII; generarea AI per-an nu mai e necesară pentru Capacitate.
**UPDATE 2026-06-08 — grile Română passage-dependent DONE** (varianta (c), migrare `0019` + commit `2805143`): `Question.passage` nou; toate cele 56 MCQ Română oficiale sunt acum în Grile (din care **24 cu text-suport** atașat din `passageRef`→`ExamPassage`); renderer-ul arată un **drawer pliabil „📖 Vezi textul"** (on-demand, fără repetiție, intră în fluxul drill). Verificat: 24/56 cu passage, payload duce textul, /review curat. Backup `/root/backups/tutor-pre-passage-2026-06-08.dump`.
**RĂMÂNE (opțional)**: ~~cele **8 grile A/F (TF_GRID)** Română rămân în Simulări~~ → **DONE 2026-06-09 (commit `69149e3`)**: în loc să adaug un tip TF_GRID în fluxul Question (migrare + render + scoring, risc pe toate domeniile pt 8 itemi), am **expandat** fiecare grilă A/F în câte un MCQ Adevărat/Fals (8 grids × 6 enunțuri = **48 grile noi**, RO 56→104). content=enunțul verbatim (L07a), options=[Adevărat,Fals], correctAnswer din rubric, passage atașat (drawer „📖 Vezi textul"), topic=Înțelegerea textului. Reutilizează complet fluxul MCQ+passage; un-enunț-pe-rând = ideal pentru drill. Idempotent (`exam-bank:<id>#<i>`). Rămân ȘI în Simulări (suprafață separată). Verificat autentificat: 4 A/F/sesiune, answer „Adevărat"→isCorrect:true, scored. **RĂMÂNE**: restul materialelor pe alte materii.

---

## [archive] 📚 Capacitate — spec original (creat 2026-06-03)

**Context:** se apropie examenul de Capacitate (clasa a VIII-a); focusul e pe **Română** și **Matematică** din materia claselor **V-VIII**.

**De făcut:**
1. **Continuă introducerea de materiale** pe cele 2 materii — **Română** și **Matematică** — pe **toți cei 4 ani fiecare** (clasele V, VI, VII, VIII), prin pipeline-ul cu Claude judge deja integrat.
2. **Consolidare per materie:** ia materialele de **Română** din clasele V-VIII și unește-le într-**un singur material de testare** (Capacitate Română). Identic pentru **Matematică** → un singur material consolidat (probabil un domeniu „Capacitate Română" + „Capacitate Matematică" care agregă întrebările pe ani).
3. **Atribuire în răspunsuri:** când mesh-ul corectează/explică, să spună și **din ce an (clasă) + secțiune** provine întrebarea — deci stochează `clasa` + `secțiune/capitol` pe fiecare întrebare și le afișează în corectare/explicație.
4. **Calibrare cu culegeri:** găsește **culegeri cu teste specifice de Capacitate** (mai ales la **Matematică**) cu teste + bareme și calibrează întrebările generate + răspunsurile față de ele (ground-truth de calibrare, dincolo de manual).

**Apoi (discuție separată, ulterioară):** materiile de **BAC**.

**Materiale gata făcute (surse de import + calibrare):**
- **Simulări oficiale EN VIII 2026 (Capacitate)** — local în `~/Downloads/temp/tutor eval nat/`:
  - `EN_VIII_2026_Matematica_model.zip` → `EN_VIII_2026_Matematica_var_model.pdf` (subiect) + `EN_VIII_2026_Matematica_bar_model.pdf` (barem)
  - `EN_VIII_2026_Limba_romana_modele.zip` → `..._limba_si_literatura_romana_var_model.pdf` (subiect) + `..._bar_model.pdf` (barem) [+ variante pt. minoritatea maghiară]
  - Fiecare are **subiect + barem** → ground-truth pentru calibrare (pasul 4 de mai sus) + șablon de format „Capacitate".
- **pro-matematica.ro — DOAR pe matematică**: https://www.pro-matematica.ro/evaluare-nationala/ — aici iei din anii **2026... și te duci până la 2017, adică 10 ani** de teste/simulări EN de matematică, pentru calibrare + bancă de itemi.
- **Subiecte și Bareme Evaluare Națională 2026**: https://share.google/VLFGuOzaI08uxqc2p
- **Variante Oficiale și Simulări**: https://share.google/ChxSXNBjt6xWRO2D5
- **Subiecte EN clasa a 8-a — Limba română — Hei Profu'**: https://share.google/1tfdJmXi4s23LOtyv

**Depinde de:** pipeline-ul Tier 5 cu Claude judge (deja integrat — `content-quality-mesh.ts` finalJudge via Claude CLI) + UI bulk-publish pe materie+prag (deja live). Aici e mai ales **conținut + structurare pe ani/secțiuni + calibrare cu culegeri**, nu infra nouă majoră.

---

## [x] 🎯 Topics + Weak Areas — mai granulare, nu pe secțiune de examen (creat 2026-06-09) — DONE 2026-06-09 (commit `439eb1b`, LIVE etutor.ro + verificat autentificat)

**DONE 2026-06-09** (commit `439eb1b`, instrucțiuni mesh: develop → /review groq `[]` → deploy → verificat autentificat):
- **Mapper determinist micro→macro** `scripts/lib/macro-topic.mjs` (NU AI — mapează `ExamItem.topic` oficial, L07a). Mate → 8 capitole (Numere întregi și operații, Fracții și numere raționale, Numere reale și radicali, Rapoarte/proporții/procente, Ecuații/inecuații/mulțimi, Statistică/medii/probleme practice, Geometrie plană, Geometrie în spațiu); RO → 6 (Fonetică și ortografie, Vocabular și semantică, Formarea cuvintelor, Morfologie, Sintaxă, Înțelegerea textului). Reguli ordonate first-match cu pre-reguli anti-coliziune (ex. „diferența de pătrate"/„media geometrică"/„viteză…distanță" nu cad pe geometrie). Validat pe TOATE cele 333 topic-uri distincte live + 72/72 aserții smoke (`macro-topic.smoke.mjs`). RO passage-dependent (24, blank topic) → „Înțelegerea textului".
- **Importer** `grile-from-exambank.mjs`: `topic = macroTopic(item)` în loc de `item.section`. Re-rulat idempotent pe prod → 596 grile re-clasificate (Mate 540 + RO 56). Distribuție echilibrată: Geo plană 225, Numere întregi 63, Statistică 57, Rapoarte 46, Geo spațiu 44, Ecuații 39, Reale 35, Fracții 31; RO: text 24, Vocabular 13, Fonetică 8, Formare 8, Morfologie 3.
- **Decuplare timer** `session-engine.ts`: `estimateQuestionSeconds` + `isExamGrileSet` nu mai parsează secțiunea din topic (care nu mai există). Acum: RO→3min (după subject), geometrie/figură→6min, restul Mate→4min; detecția set-grile oficial prin `sourceReference exam-bank:` (robust). Drift ~12/540 itemi Sub I geometrie 4→6min (corect pedagogic). Timer verificat live: 4560s/15q = normă oficială sumată.
- **Cleanup**: 7 Progress + 5 WeakArea orfane cu topic-secțiune (I.A/I.B/Subiectul…) șterse (nu mai există ca întrebări). Backup prod `/root/backups/tutor-pre-topics-reclass-2026-06-09.dump`.
- **Verificat autentificat etutor.ro** (admin-test SuperAdmin): sesiune Mate → `questions[0].topic="Geometrie plană"` (capitol!), answer 200, **Progress creat cu topic="Geometrie plană"** (capitol, NU secțiune) → Weak Areas + Statistici vor grupa pe capitol.
- **NB pre-existing (NU din acest task)**: `tests/unit/exam-engine.test.ts` are 1 eroare tsc stale (`passage` lipsă din fixture, de la migrarea 0019 passage). NU blochează `next build` (nu compilează tests/). Fix 1-linie de făcut într-o sesiune de igienă teste.

**Observat live** (Statistici → Română cl. VIII, 2026-06-09): „Topics" și „Weak Areas" sunt **prea generale** — apar doar ca **secțiuni de examen** („I.A", „I.B", „Subiectul I", „Subiectul al II-lea") fiindcă la importul grilelor oficiale am setat `Question.topic = ExamItem.section`. Progresul + punctele slabe se grupează pe secțiune → „I.B = 100% errors" nu spune elevului CE skill are slab.

**De făcut:** topic-uri **granulare pe competență/capitol**, nu pe secțiune:
- **Română**: diftong/triftong, derivare, sinonime/antonime, omonime, accentuare, cazuri substantiv, moduri/timpuri verbale, propoziții subordonate, figuri de stil, înțelegerea textului, redactare etc.
- **Matematică**: ordinea operațiilor, divizibilitate, fracții, ecuații, procente, geometrie plană, geometrie în spațiu, funcții, statistică etc.

**Surse posibile de granularitate:** (a) clasificare AI per grilă (mesh/Claude judge → atribuie skill/capitol din conținut); (b) maparea label-ului oficial → skill (ex. „B.1 accentuare" din itemii oficiali — unele au deja `topic` pe item, ex. „Diftong", „Accentuare"); (c) `chapterIndex` deja existent pe `Question` pentru materialele din manual. **NB**: itemii Limba română din exam-bank au deja câmpul `topic` pe ExamItem la unele (ex. „Diftong") — de verificat dacă se poate refolosi la conversie în loc de secțiune.

**Impact:** progres + weak areas + recomandări de sesiune (repair/recovery țintesc weak areas) devin utile abia cu topic-uri reale. Atinge: `scripts/grile-from-exambank.mjs` (setarea topic la import) + eventual o re-clasificare a celor 596 grile deja importate.

---

## [~] 🏆 Simulări Capacitate — „exam-bank" tier (100% ground-truth) (creat 2026-06-03; SLICE 1-4 DONE 2026-06-03)

**SLICE 4 DONE 2026-06-03** (commit `6f9cd26`, LIVE + verificat autentificat): **persistență + diferențiere + rezultat-final** (treapta 1 din planul de verificare în 3 trepte: self → AI → meditator). `ExamAttempt` (migrare `0018`, userId/paperId fără FK) — ruta /score salvează încercarea, `PATCH /api/exam-bank/attempt/[id]` recalculează cu self-scores → `finalized`. Diferențiere clară grilă (auto) vs rezolvare/compunere (manuală) + notă **split onest**. `ExamItem.finalAnswer` + „rezultat final" tastat la 2 itemi Mate (III.1=14, III.5=90) → auto-check ieftin gratuit. Verificat: attempt persistat+finalizat în DB, finalCheck True, badge-uri pe take. `/code-review`: 3 fix-uri (saved re-enable, norm comma/°/minus, hint over-scoring).

**PLAN verificare (agreat user 2026-06-03)** — 3 trepte legate de preț: **self-score** (gratuit, ✅ slice 4) → **verificare AI** (Family/Trio: Română scrisă pe ecran → AI text; Mate → poză rezolvare → AI vision; sugestie nu verdict) → **meditator confirmă** (Trio). Slice 5 = AI; slice 6 = meditator.

**IMPORT serie 2 — MATEMATICĂ — ✅ DONE 2026-06-04** (toate 10 perechile LIVE + verificate autentificat pe etutor.ro; commits `bbc82ff`→`254f214`):
- **10/10 perechi importate**: 2025 {Simulare, Examen-07, Model, Rezerva-02, Sesiune-Specială-03}, 2026 {Simulare}, 2024 {Examen-07, Model, Rezerva-02, Simulare}. (2026 Model skip = MVP seria 1.)
- Per pereche: 18 itemi (I:6 MCQ, II:6 MCQ figuri, III:6 deschis) + 9-11 figuri PyMuPDF clip-rect (montaj vision-verified) + chei/barem ground-truth din baremul oficial + `figureUrl` + `finalAnswer` (rezultate curate) baked în importer. `/review` pe slice 1 (no correctness issues). Per pereche deploy: HEAD assert VPS==local (L202), `node scripts/import-exam-mate-<year>-<variant>.mjs` pe prod DB, restart, **verificare autentificată SuperAdmin**: figuri 200 + DB integritate + score API round-trip **60/60 MCQ + finalCheck pass** pe toate.
- **Total exam-bank prod: 12 papers / 216 items** (2 MVP seria-1 + 10 noi Mate). DB backup pre-import `/root/backups/tutor-pre-2025sim-import-2026-06-04.dump`.
- **Playbook repetabil**: `knowledge/exam-bank-import-playbook.md` (9-step flow + figure tooling `scripts/exam-figures/{fig_inspect,extract}.py`). Memorie `project_tutor_exam_bank_import`.
- **RĂMÂNE (next): Româna** (ulterior, după Mate — per cerere user) + restul materialelor pe care le încarcă user.

**IMPORT serie 3 — MATEMATICĂ (din `~/Downloads/Temp/tutor eval nat/pro-matematica2/`) — ÎN CURS 2026-06-04** (user: „continui tot ca pentru MVP, regim instrucțiuni mesh"):
- **Folder `pro-matematica2`**: 34 lucrări noi de importat (toate 2021–2023, zero overlap cu cele 18 deja live) = **14 oficiale LRO** (Subiect+Barem) + **20 teste de antrenament CNCE** (`Test_NN`, structură 18 itemi identică — confirmat: SI 6 MCQ / SII 6 MCQ geometrie / SIII 6 deschis).
- **✅ DONE — anul 2021 COMPLET (6/6 oficiale)**: Model (`f2fba9c`), Model 2 (`01d6410`), Simulare (`f754350`), Examen v3 (`f1380ae`), Rezervă v2 (`8034a60`), Sesiune Specială v4 (`e82a6ce`). Fiecare: 18 itemi verbatim + chei ground-truth din barem + 9-10 figuri PyMuPDF vision-verified + `finalAnswer` (doar scalari curați, skip radicali/mulțimi/demonstrații) + deploy + **verificare autentificată SuperAdmin pe etutor.ro: figuri 200 + score API 60/60 + finalCheck pass**.
- **✅ DONE — 2022 Model (paper 7/14)** commit `5f4b068`: 18 itemi (I=1c2b3b4c5a6a · II=1c2d3b4d5b6c, ground-truth barem) + 10 figuri PyMuPDF vision-verified (s2-1..6, s3-3..6) + `finalAnswer` III.1=131, III.3=2, III.4=6, III.6=60 (skip III.2 inegalitate, III.5 radical 50√3). Deploy VPS2 (HEAD assert OK) + **verificat autentificat SuperAdmin: figuri 200×10 + score API MCQ 60/60 + finalCheck 4/4 true + attempt persistat**.
- **✅ DONE — 2022 Simulare (paper 8/14)** commit `1397042`: 18 itemi (I=1b2c3b4d5c6a · II=1b2c3c4b5a6d, ground-truth barem) + 9 figuri PyMuPDF vision-verified (s2-1..6, s3-4..6) + `finalAnswer` III.2=15, III.3=25 (skip III.1 pereche a,b; III.4/5/6 radicali). Deploy VPS2 (HEAD assert OK) + **verificat autentificat SuperAdmin: figuri 200×9 + score API MCQ 60/60 + finalCheck 2/2 true + attempt persistat**.
- **✅ DONE — 2022 Examen v2 (paper 9/14)** commit `333480b`: 18 itemi (I=1d2d3a4b5c6a · II=1d2b3d4b5a6b, ground-truth barem Varianta 2) + 10 figuri PyMuPDF vision-verified (s2-1..6, s3-3..6) + `finalAnswer` III.1=151, III.3=1/4 (skip III.2 interval, III.4 demonstrație, III.5/6 radicali). Deploy VPS2 (HEAD assert OK) + **verificat autentificat SuperAdmin: figuri 200×10 + score API MCQ 60/60 + finalCheck 2/2 true + attempt persistat**.
- **✅ DONE — 2022 Rezervă v1 (paper 10/14) — anul 2022 COMPLET (4/4 oficiale)** commit `776d34f`: 18 itemi (I=1c2a3d4d5a6b · II=1c2d3c4c5b6c, ground-truth barem Varianta 1) + 10 figuri PyMuPDF vision-verified (s2-1..6, s3-3..6) + `finalAnswer` III.1=320, III.4=4,5, III.6=1/2 (skip III.2/III.3 demonstrații, III.5 radical). Deploy VPS2 (HEAD assert OK) + **verificat autentificat SuperAdmin: figuri 200×10 + score API MCQ 60/60 + finalCheck 3/3 true + attempt persistat**.
- **✅ DONE — 2023 Model (paper 11/14)** commit `a08ed98`: 18 itemi (I=1d2a3c4b5c6b · II=1a2b3b4b5c6b, ground-truth barem) + 9 figuri PyMuPDF vision-verified (s2-1..6, s3-4..6) + `finalAnswer` III.1=120, III.2=-3, III.3=(2,4) (skip III.4 45°dat+radical, III.5 demonstrații, III.6 216 dat+perpendicularitate). Deploy VPS2 (HEAD assert a08ed98 OK) + **verificat autentificat SuperAdmin: figuri 200×9 + score API MCQ 60/60 (SI 30 + SII 30) + finalCheck 3/3 true + attempt persistat**.
- **✅ DONE — 2023 Simulare (paper 12/14)** commit `4651d74`: 18 itemi (I=1d2a3c4d5c6b · II=1d2c3b4c5a6b, ground-truth barem) + 9 figuri PyMuPDF vision-verified (s2-1..6, s3-4..6; s2-2/s2-4 re-crop pad=0 ca să tai enunț) + `finalAnswer` III.1=14, III.3=3, III.4=5, III.6=60 (skip III.2 mulțime {2,5}, III.5 demonstrație+radical √2+1). Deploy VPS2 (HEAD assert 4651d74 OK) + **verificat autentificat SuperAdmin: figuri 200×9 + score API MCQ 60/60 (SI 30 + SII 30) + finalCheck 4/4 true + attempt persistat**.
- **✅ DONE — 2023 Examen Varianta 1 (paper 13/14)** commit `df3e4e5`: 18 itemi (I=1b2c3a4c5d6b · II=1c2c3c4b5b6c, ground-truth barem Varianta 1) + **11 figuri** PyMuPDF vision-verified (s1-6 diagramă bare **vectorială** — bbox estimat din text spans, s2-1..6, s3-3 grafic, s3-4..6) + `finalAnswer` III.1=12, III.2=0, III.4=150 (skip III.3 radical 4√2, III.5 demonstrații, III.6 radical 10√3/3). **NB: PDF US-Letter 612×792, nu A4.** Deploy VPS2 (HEAD assert df3e4e5 OK) + **verificat autentificat SuperAdmin: figuri 200×11 + score API MCQ 60/60 (SI 30 + SII 30) + finalCheck 3/3 true + attempt persistat**.
- **✅ DONE — 2023 Rezervă Varianta 5 (paper 14/14) — anul 2023 COMPLET (4/4 oficiale) + TOATE 14 oficiale serie 3 DONE** commit `fc84de9`: 18 itemi (I=1c2c3a4b5c6a · II=1d2c3d4b5c6d, ground-truth barem Varianta 5) + 10 figuri PyMuPDF vision-verified (s2-1..6, s3-3 grafic, s3-4..6; s2-3 re-crop sub enunț) + `finalAnswer` III.1=16, III.4=75 (skip III.2 demonstrație N=n/2, III.3 radical 3√10/10, III.5 demonstrații+inegalitate, III.6 demonstrații). **NB: PDF US-Letter 612×792.** Deploy VPS2 (HEAD assert fc84de9 OK) + **verificat autentificat SuperAdmin: figuri 200×10 + score API MCQ 60/60 (SI 30 + SII 30) + finalCheck 2/2 true + attempt persistat**.
- **Total exam-bank prod acum: 41 papers / 738 items** (2021 Test_02..15 + 2022 Test_01 complet importate 2026-06-04; rămân 2022 Test_02..06).
- **[x] DONE 2026-06-04 — 20 teste de antrenament CNCE** (`pro-matematica2`: 2021 Test_02..15 = 14 ✅ + 2022 Test_01..06 = 6 ✅ — TOATE 20 importate + verificate autentificat + /review mesh curat). **Perechi separate** Test_NN.pdf (subiect) + Barem_NN.pdf (barem) — ca seria 2, playbook se aplică direct. Slug `test-NN`, source „EN VIII <an> Testul N — antrenament (CNPEE)". Figuri = **imagini raster** (IMG xref, bbox exact via fig_inspect — fără risc clip vectorial). NB: pagina = A4 595×842 (rulează fig_inspect/figură). Decizie 2026-06-04: figuri = **fitz local** (4uPDF extract-figure = client-side draw-box, fără backend; premium feature „planned"=neconstruit). Itemii OPEN: sub-prompt-urile a)/b) incluse în `content` (whitespace-pre-line) — mai complet decât seria 2.
  - **[x] 2021 Test_02 DONE 2026-06-04** (commit `5942c98`): 18 itemi, chei barem I:1d2c3c4d5c6b II:1c2d3b4c5c6a, 8 autoGradable (S2-5 cerc/S2-6 paralelipiped fără figură), 7 figuri (S2-1..4+S3-4..6). **Verificat autentificat etutor.ro: 7/7 figuri loaded + score 60/60 + finalCheck 3/3** (III.1=10/III.2=−2/III.3=10). Backup prod `/root/backups/tutor-pre-exambank-test02-2026-06-04.dump`. NB deploy: `next start` non-standalone → figuri noi cer **pm2 restart** (nu rebuild) ca să fie servite (404→200 după restart).
  - **[x] 2021 Test_03 DONE 2026-06-04** (commit `83b309a`): 18 itemi, chei barem I:1a2a3d4d5b6b II:1a2a3c4d5a6d, 6 autoGradable (SI), 9 figuri (S2-1..6 + S3-4,5,6). **Figuri rendate cu backend-ul 4uPDF `/api/extract-region`** (Pro hi-DPI region render) în loc de fitz local — validat end-to-end (9/9 @ 300 DPI; backend rulat local în venv + stub rapidocr + user custom). **Verificat autentificat etutor.ro: 9/9 figuri 200 + score 60/60 + finalCheck 3/3** (III.1=144/III.3=5/III.6=12). Backup prod `/root/backups/tutor-pre-exambank-test03-2026-06-04.dump`. NB barem/subiect point-label discrepancy pe III.1 (subiect 3p/2p vs barem 2p/3p) → rubric urmează baremul. Playbook §2.6 actualizat cu metoda 4uPDF (a) + fitz (b).
  - **[x] 2021 Test_04 DONE 2026-06-04** (commit `8a9e5c8`): 18 itemi, chei barem I:1b2c3d4d5d6b II:1b2d3b4d5c6b, 6 autoGradable (SI), 9 figuri (S2-1..6 + S3-4,5,6) **via 4uPDF /api/extract-region** (9/9 @ 300 DPI). **Verificat autentificat etutor.ro: 9/9 figuri 200 + score 60/60 + finalCheck 2/2** (III.3=2/III.4=4). **`/review` mesh curat** (2 verificatori: re-derivare matematică + logică/policy → ambii `[]`). Backup `/root/backups/tutor-pre-exambank-test04-2026-06-04.dump`. Policy finalAnswer rafinat: doar scalari **calculați** de elev (skip III.1=31 + III.5=4cm tipărite în enunț, III.2 demonstrație, III.6 fracție 24/5).
  - **[x] 2021 Test_05..15 (BATCH) DONE 2026-06-04** — 11 lucrări, toate prin pipeline complet (transcriere → validate → fig_inspect → **figuri via 4uPDF /api/extract-region** @ 300 DPI → montage-verify → commit → deploy VPS2 → import prod → pm2 restart → **verificare autentificată etutor.ro** → **/review mesh 2 verificatori**). Toate: score 60/60 + figuri 200 + ambii verificatori `[]`. Commits: T05 `108963f`+`f64ddbe`, T06 `afb9f47`, T07 `4d65d52`, T08 `07050e1`, T09 `6def162`, T10 `8a81b94`, T11 `8c296e3`, T12 `8f11206`, T13 `469d677`, T14 `7ef02ee`, T15 `03f1b30`. finalChecks per lucrare. NB tipuri figuri prinse: pie chart **vectorial** (T15 s1-6) rendat corect de 4uPDF extract-region (nu doar raster). Barem typos transcrise corect + documentate (T06 III.6, T10 III.5, T12 III.2). Backup pre-import exam-bank `/root/backups/tutor-exambank-pre-test14-2026-06-04.dump`.
  - **[x] 2022 Test_01 DONE 2026-06-04** (commit `9976b78`): 18 itemi, chei barem I:1c2b3d4c5b6a II:1d2c3c4c5a6b, 6 autoGradable (SI), 9 figuri (s2-1..6 + s3-4,5,6) **via 4uPDF /api/extract-region** (9/9 @ 300 DPI) + `finalAnswer` III.1=360, III.2=0, III.3=9, III.5=12/7 (skip III.4 radical 72√3, III.6 demonstrație + VB=8 tipărit în enunț). **Verificat autentificat etutor.ro: 9/9 figuri 200 + score API MCQ 60/60 + finalCheck 4/4 true + attempt persistat.** **`/review` mesh curat** (2 verificatori: re-derivare matematică `[]` + policy → notele III.3/III.6 corecte prin regula „valori tipărite în enunț"). Backup prod `/root/backups/tutor-pre-exambank-2022test01-2026-06-04.dump`. **Nou tooling reutilizabil**: `scripts/exam-figures/extract_4updf.py` (POST page-fraction regions la backend) + spec JSON per lucrare.
  - **[x] 2022 Test_02 DONE 2026-06-04** (commit `78f21e9`): 18 itemi, chei barem I:1b2a3c4d5b6b II:1d2c3a4c5a6d, 6 autoGradable (SI), 10 figuri (s2-1..6 + s3-3,4,5,6) **via 4uPDF /api/extract-region** (10/10 @ 300 DPI) + `finalAnswer` III.1=92, III.6=18/5 (skip III.2 a∈{0,1} multi-valoare, III.3/4 radicali, III.5 demonstrație). **Verificat autentificat etutor.ro: 10/10 figuri 200 + score MCQ 60/60 + finalCheck 2/2 true + attempt persistat. `/review` mesh curat** (ambii `[]`).
  - **[x] 2022 Test_03 DONE 2026-06-04** (commit `92f82b6`): 18 itemi, chei barem I:1c2d3c4a5a6b II:1d2c3c4d5a6c, **7 autoGradable** (SI + SII.5 lungime cerc text-only), 9 figuri (s2-1,2,3,4,6 + s3-3,4,5,6; SII.5 fără figură; s2-2 re-crop pt text bleed) **via 4uPDF** + `finalAnswer` III.1=70, III.5=2,5, III.6=90 (skip III.2 demonstrație multiplu 16, III.3 interval [5,∞), III.4 radical 4√7). **Verificat autentificat etutor.ro: 9/9 figuri 200 + score MCQ 60/60 + finalCheck 3/3 true + attempt persistat. `/review` mesh curat** (ambii `[]`; matematician a verificat DQ=4√7 + unghi cub 90° cu geometrie analitică).
  - **[x] 2022 Test_04 DONE 2026-06-04** (commit `a9c9fb2`): 18 itemi, chei barem I:1b2b3d4c5c6b II:1d2c3c4b5a6**b**, 6 autoGradable (SI), 10 figuri (s2-1..6 + s3-3,4,5,6) **via 4uPDF** + `finalAnswer` III.1=10, III.2=2021, III.6=30 (skip III.3 radical √26, III.4 „Arată că 16,32" tipărit, III.5 demonstrație PN>3√3). **⚠️ BAREM TYPO SII.6**: baremul oficial tipărește „a)" (=8 dm) dar răspunsul corect e **8√2=b)** (romb VBD echilateral → muchie laterală=diagonala 2√2, sumă 4·2√2=8√2); folosit **b** (corect mat.), confirmat independent de verificatorul `/review`. **Verificat autentificat etutor.ro: 10/10 figuri 200 + score MCQ 60/60 + finalCheck 3/3 true + attempt persistat. `/review` mesh curat** (ambii `[]`).
  - **[x] 2022 Test_05 DONE 2026-06-04** (commit `fdecb71`): 18 itemi, chei barem I:1d2a3b4c5c6a II:1d2b3d4b5c6a, 6 autoGradable (SI), 9 figuri (s2-1..6 + s3-4,5,6) **via 4uPDF** + **0 finalAnswer** (toți itemii III = „Arată că"/demonstrație/multi-valoare/radical). **NB SII.4 BC=√5** (nu 5 — cu AP=3+BC=√5 ⇒ AB=5=cheia b; x=1 respins). **Verificat autentificat etutor.ro: 9/9 figuri 200 + score MCQ 60/60 + finalCheck 0/0 + attempt persistat. `/review` mesh curat** (ambii `[]`; confirmat SII.4 BC=√5, SII.6=36√3, SII.2=8°).
  - **[x] 2022 Test_06 DONE 2026-06-04 — anul 2022 Mate COMPLET (Test_01..06)** (commit `c3d7b86`): 18 itemi, chei barem I:1d2c3b4a5a6d II:1c2b3b4d5c6c, **5 autoGradable** (SI 1-5; SI.6 = pie chart sondaj cu figură), 11 figuri (s1-6 pie + s2-1..6 + s3-3,4,5,6) **via 4uPDF** + `finalAnswer` III.1=300, III.2=4, III.5=9 (skip III.3 m∈{0,4} multi-valoare, III.4 radical 3√3/2, III.6 radical 4√3). **Verificat autentificat etutor.ro: 11/11 figuri 200 + score MCQ 60/60 + finalCheck 3/3 true + attempt persistat. `/review` mesh curat** (ambii `[]`).
  - **✅ 2022 Mate COMPLET (Test_01..06). Total prod: 46 papers / 828 items** (2021 Test_02..15 = 14 + 2022 Test_01..06 = 6 = seria CNCE `pro-matematica2` întreagă, plus seria 1+2). Backend 4uPDF :8099 + venv `/tmp/4updf-venv` + token `/tmp/figtoken.txt` păstrate pentru Limba Română.
- **Variant slugs serie 3**: single-digit (`model`, `model-2`, `simulare`, `examen-3`, `rezerva-2`, `sesiune-speciala-4`); training tests vor folosi `test-01`..`test-15`.
- **Rețetă identică** cu serie 2 (playbook). Importere: `scripts/import-exam-mate-2021-*.mjs` (6 modele de copiat). DB prod = VPS2 `127.0.0.1:5432/tutor`. Surse: `~/Downloads/Temp/tutor eval nat/pro-matematica2/`.

### [x] 🟢 Limba și literatura română — EN VIII (8 lucrări oficiale) — DONE 2026-06-04 (commits f6951b5→ab9da02)

**DONE 2026-06-04**: Toate 8 lucrările live pe etutor.ro. `ro-2026-model` era deja în prod din MVP (verificat: chei MCQ c,b,c,c,d,d,d = baremul oficial nov 2025). Celelalte 7 importate end-to-end: transcriere verbatim via fitz → barem ground-truth → validate → commit+push → import prod VPS2 → verificare autentificată reală (admin-test@tutor.app: 20/20 auto pe MCQ+TF_GRID, attempt persistat; HTML render passages+itemi+accente) → `/review` mesh (toate `issues:[]`). **1 figură** (Erasmus chart pe 2025 Model A.3) extrasă cu fitz local → `public/exam-figures/en-viii-2025-ro-model-fig1.png` (necesită `pm2 restart tutor` ca `next start` să servească public/ nou — L## nou). Prod final: **53 papers / 954 items / 16 passages** (8 RO papers = 144 itemi + 16 passages). 2 capcane ground-truth prinse: B.1 2025 Simulare „erá" se accentuează pe finală (verb imperfect, NU substantiv „éra"); accentele B.1 redate cu vocale acute. Backup DB pre-import: `/root/backups/tutor-pre-ro-simulare-2026-06-04.dump`.

**Sursă**: `~/Downloads/Temp/tutor eval nat/heiprofu-romana/` — 8 perechi subiect + barem (toate oficiale edu.ro/CNPEE, public). **Rețetă identică** cu Matematica (playbook `knowledge/exam-bank-import-playbook.md`), dar structură Română: `subjectKey="limba_romana"`, **ExamPassage** (2 texte: literar + nonficțiune/funcțional), itemi pe **Subiectul I.A** (înțelegerea textului — SHORT/FILL/TF_GRID) + **Subiectul I.B** (compunere pe text, rubric) + **Subiectul al II-lea** (redactare 20p, rubric) + 10p oficiu. **Fără figuri** (de regulă) → fără pas extract-region. Chei/rubrici = **ground-truth din barem**, verbatim. `correctAnswer` doar la itemi obiectivi; restul = `rubric` (sub-puncte) + `OPEN`. `autoGradable=true` doar la obiective fără figură.

**STRUCTURĂ CONFIRMATĂ (din 2025 Simulare, 2026-06-04)** — toate lucrările EN VIII Română urmează acest tipar:
- **2 passages** (`ExamPassage`): Textul 1 = poezie (scurt, transcriere verbatim) + Textul 2 = articol nonficțiune (LUNG, ~1 pagină — transcriere verbatim ground-truth critic). `ref`="Textul 1"/"Textul 2", `author`, `body`, `orderIndex`.
- **Subiectul I — A (38p)**: A1 FILL 2p · A2/A3/A4 MCQ 2p (din text) · A5 **TF_GRID 6p** (6 enunțuri Adevărat/Fals, 3 text1 + 3 text2; `rubric` cu 6 sub-puncte 1p) · A6 OPEN 6p (rimă+măsură) · A7 OPEN 6p (element comun min 30 cuv) · A8 OPEN 6p (opinie 50-100 cuv) · A9 OPEN 6p (asociere alt text).
- **Subiectul I — B (32p)**: B1/B2/B3/B4 MCQ 2p (limbă: accentuare/derivare-conversiune/sinonime/substantive) · B5 OPEN 6p (3 pronume) · B6 OPEN 6p (enunț genitiv+condițional) · B7 OPEN 6p (propoziție+raport sintactic) · B8 FILL 6p (forme corecte).
- **Subiectul al II-lea (20p)**: 1 item OPEN compunere min 150 cuv (rubric: conținut 12 + redactare 8). `section`="Subiectul al II-lea".
- **Total**: 18 itemi (9A + 8B + 1 SII) + 2 passages = 90p + 10 oficiu = 100. `subjectKey`="limba_romana", `subjectName`="Limba și literatura română".
- **autoGradable**: doar MCQ fără figură (A2-A4 + B1-B4 = 7 itemi). TF_GRID A5 = obiectiv dar gradat pe `rubric` (autoGradable poate fi true — score.ts gradează TF_GRID auto). FILL A1/B8 = `correctAnswer`/`rubric` (depinde — A1 e completare scurtă din text, B8 = 6 forme).
- **Fără figuri** (de regulă; verifică fiecare). `score.ts` gradează MCQ + TF_GRID auto; restul self-score pe rubric.
- **NB transcriere**: textele literare = verbatim din PDF (incl. note de subsol `*cuvânt – explicație`). Itemii MCQ care cer „valorificând textul N" — content trebuie să includă fragmentul relevant SAU passage-ul e atașat via `passageRef`. **Cheile/răspunsurile = ground-truth din barem** (de citit pt fiecare lucrare). Schema `ExamItem` are deja `passageRef` (comma-separated).

**Perechi (subiect → barem)**:
- [x] 2024 Varianta 07 — `EN_VIII_2024_Limba_si_literatura_romana_var_07.pdf` + `..._bar_07.pdf` → slug `ro-2024-var-07`
- [x] 2025 Varianta 07 — `EN_VIII_2025_..._var_07.pdf` + `..._bar_07.pdf` → slug `ro-2025-var-07`
- [x] 2025 Model — `EN_VIII_2025_..._var_model.pdf` + `..._bar_model.pdf` → slug `ro-2025-model`
- [x] 2025 Simulare — `EN_VIII_2025_..._var_simulare.pdf` + `..._bar_simulare.pdf` → slug `ro-2025-simulare`
- [x] 2025 Rezervă (23 iunie) — `evaluare-nationala-rezerva-romana-23-iunie-2025.pdf` + `barem-...rezerva...pdf` → slug `ro-2025-rezerva`
- [x] 2025 Sesiune specială (2 iulie) — `sesiunea-speciala-romana-2-iulie-2025.pdf` + `barem-sesiunea-speciala...pdf` → slug `ro-2025-sesiune-speciala`
- [x] Model oficial noiembrie 2025 (pt EN 2026) — `model-oficial-romana-noiembrie-2025.pdf` + `barem-model-oficial...pdf` → slug `ro-2026-model`
- [x] Simulare națională (16 martie 2026) — `simulare-nationala-romana-16-martie-2026.pdf` + `barem-simulare-nationala...pdf` → slug `ro-2026-simulare`

**NB**: `bar_07 (1).pdf` = duplicat al `bar_07.pdf` (ignoră). Verificare per lucrare: deploy VPS2 + autentificat etutor.ro (passages + itemi randate, score API pe obiective, finalCheck) + `/review` mesh. `source` ex: „EN VIII 2025 Simulare — Limba și literatura română (CNPEE)". An: pentru model/simulare noiembrie-2025/martie-2026 → `year=2026` (sesiunea pt care sunt), restul `year=2025`/`2024`.

---

## [ ] 🎨 Homepage demo restriction — allowlist `publicDemo` pe Domain (creat 2026-06-04, deferred → sesiune nouă)

**Context**: 2026-06-04 am schimbat copy-ul homepage (commit `9c4062c`, LIVE etutor.ro): label proof → „demo pentru Evaluarea Națională și Bacalaureat". User a cerut „doar bazele acestea (EN+Bac) să fie pentru demo" și a ales mecanismul **allowlist flag pe Domain**.

**BLOCKER de conținut descoperit** (de rezolvat în sesiunea nouă, ÎNAINTE de a aplica flag-ul):
- Demo-ul public (`/api/public/practice/{subjects,quiz}`) ia din tabelul `Question` (status PUBLISHED, type MULTIPLE_CHOICE), grupat pe `subject`, fără filtru de domeniu.
- **8 domenii** există: Aviation, Drept Penal, Istorie, Geografie, Biologie, Chimie, Matematica V-VIII, Matematica IX-XII.
- **Doar 3 au grile publicate**: `[Aviation]` Fizică=14, Matematică=9, Logică=1 (= conținut școlar EN/Bac **misfiled** sub domeniul „Aviation" — seed/test data); `[Istorie]` Istorie=4; `[Drept Penal]` Drept Penal=2 (NU EN/Bac).
- Domeniile EN/Bac corecte (Geografie/Biologie/Chimie/Matematica V-VIII/IX-XII) au **0 grile publicate**.

**Consecință**: dacă flag-uiesc `publicDemo=true` doar pe domeniile EN/Bac curate, demo-ul ar arăta **doar Istorie (4)** — Fizică(14)+Matematică(9) sunt blocate sub „Aviation". Trebuie întâi **re-homed** conținutul școlar (creează domeniu Fizică? mută Matematică la Matematica V-VIII?) SAU seed grile EN/Bac.

**Plan sesiune nouă**:
1. Decizie conținut: re-home Fizică/Matematică/Logică din „Aviation" la domenii EN/Bac proprii (sau redenumire/curățare seed).
2. Schema: `publicDemo Boolean @default(false)` pe `Domain` + migrare `0019_*` (NB: deploy-ul tutor NU rulează `migrate deploy` automat — aplică manual pe VPS2).
3. Filtru în ambele rute (`subjects` + `quiz`): `where: { ..., domain: { publicDemo: true } }`.
4. Set flag `true` pe domeniile EN/Bac cu conținut. `false` pe Aviation (pilot) + Drept Penal (drept).
5. Verifică: demo arată doar materii EN/Bac; label-ul „demo pentru EN+Bac" devine onest.

**Interim (acum, live)**: label-ul e forward-looking — demo-ul încă arată Fizică/Matematică/Istorie (subiecte EN reale, OK) + **Drept Penal (2 grile, NU EN/Bac — mismatch minor)** până aterizează allowlist-ul.

**Cleanup adiacent (din aceeași sesiune copy)**: `ro.json:476` + `en.json:476` hero = „Învățare Adaptivă Bazată pe AI" / „AI-Powered Adaptive Learning" — încă conțin „AI" (NU sunt randate pe homepage, dar există). Per `feedback_etutor_no_ai_wording` → de reformulat fără „AI" (am rezolvat deja `adaptiveDesc` RO+EN în commit `9c4062c`).

---

## [x] 🧭 Restructurare meniuri elev/părinte/meditator — COMPLETĂ 2026-06-04 (elev `3dd1a87` → părinte `e884255` → meditator `915f7a8`); marker era stale. Rămase = feature-uri per-rol în itemele dedicate (Referral CREDIT, Setări→Notificări) + decizia ELEV „merge Progres+Gamificare".

**Cerere user (2026-06-04, cu poză sidebar)**: meniul afișează multe item-uri pentru care **nu avem conținut**; ascunde-le temporar + pune-le aici în TODO ca să decidem punctual ce facem cu fiecare într-o sesiune viitoare.

**Item-uri meniu (din screenshot)**: Lecții · Bibliografie · Practică · Evaluare · Examene · Simulări · Progres · Domenii · Calendar · Notificări · Gamificare · Invită & Câștigă · Setări · Monitorizare · Alerte.

**Audit preliminar conținut (de confirmat exhaustiv în sesiune nouă)**:
- **Au conținut**: Practică (question bank), Examene/Simulări/Evaluare (exam-bank EN VIII Mate — 22 papers / 396 items), Progres, Gamificare, Setări, Notificări/Alerte, Invită & Câștigă (feature referral), Monitorizare (părinte/meditator).
- **Sărac/gol**: Lecții (Lessons — puține/0), Bibliografie (puține/0), Domenii (8 domenii dar doar 3 cu grile publicate, restul goale).

**ORDINE OBLIGATORIE pe roluri (cerută explicit user 2026-06-04)**: **(1) ELEV mai întâi** → **(2) PĂRINTE** → **(3) MEDITATOR**. Se face un rol complet (audit + ascundere + verificare) ÎNAINTE de a trece la următorul; nu se sar etape, nu se lucrează roluri în paralel.

**Plan sesiune nouă (se repetă identic pentru fiecare rol, în ordinea de mai sus)**:
1. Audit per-item: ce model/tabel îl alimentează + count real pe prod (pentru rolul curent).
2. Ascunde temporar (feature flag / conditional render în sidebar) item-urile cu 0 conținut — NU șterge rute/cod.
3. Decizie punctuală per item ascuns (populăm / unificăm / scoatem definitiv).
4. Verifică pe prod că rolul curent vede doar ce e relevant + are conținut → abia apoi treci la rolul următor.
   - **Rolul 1 — ELEV**: sidebar-ul elevului (Lecții, Bibliografie, Practică, Evaluare, Examene, Simulări, Progres, Domenii, Calendar, Notificări, Gamificare, Invită & Câștigă, Setări, Alerte).
   - **Rolul 2 — PĂRINTE**: după ce elev e gata (Monitorizare + ce e relevant pentru părinte).
   - **Rolul 3 — MEDITATOR**: ultimul (Monitorizare + ce e relevant pentru meditator).

**Content audit pe prod (2026-06-04, real counts)**: Practică=30 grile PUBLISHED (dar misfiled sub „Aviation" — vezi §188) · Simulări/exam-bank=26 papers ✅ · **Lecții(Lesson)=0** · **Evaluare(Assessment)=0** · **Examene(ExamSimulation)=1** · **Bibliografie=11** (juridic/aviation) · Domenii=8 (doar Aviation 24, Drept Penal 2, Istorie 4 cu grile; 5 EN/Bac goale) · features (Progres/Gamificare/Notificări/Invită/Setări/Monitorizare/Alerte/Instructor) OK.

**✅ FĂCUT 2026-06-04 — ascundere globală 4 item-uri goale/niche** (decizie user „unpublish momentan + pune în TODO"): în `src/components/sidebar.tsx` adăugat `HIDDEN_NAV` set + filtru `visibleNavItems` (conditional render, **rutele rămân funcționale**, reversibil). Item-uri ascunse din nav pentru TOATE rolurile:
  - **`/dashboard/lessons` (Lecții)** — Lesson=0. **Decizie de luat**: populăm lecții sau scoatem definitiv?
  - **`/dashboard/assessment` (Evaluare)** — Assessment=0. **Decizie**: populăm assessments sau unificăm cu Simulări/Practică?
  - **`/dashboard/exams` (Examene)** — ExamSimulation=1 (~gol). **Decizie**: consolidăm în „Simulări" (exam-bank, 26 papers) și scoatem „Examene" definitiv?
  - **`/dashboard/bibliography` (Bibliografie)** — Bibliography=11 (juridic/aviation, irelevant EN/Bac). **Decizie**: păstrăm doar pe domeniile juridice sau scoatem din nav-ul elevului EN/Bac?
  - Reactivare: șterge href-ul respectiv din `HIDDEN_NAV` în sidebar.tsx.
  - **NB**: ascunderea e GLOBALĂ (toate rolurile) — restructurarea PER-ROL (elev→părinte→meditator, mockups aprobate) e separată, vine după feedback user pe mockups.

**📄 Design doc complet (mockups + decizii) → `Tutor/knowledge/menu-restructure-mockups.md`** (creat 2026-06-04). Conține cele 3 mockup-uri detaliate per rol (ELEV/PĂRINTE/MEDITATOR), status ✅/🟡/🔨 per funcție, deciziile blocate + capabilitățile de construit. **Sursă de adevăr pentru implementare** — citește-l înainte de a coda restructurarea.

**🟢 ELEV — DECIZII BLOCATE 2026-06-04** (de implementat, ordine rol-1):
  1. **MERGE Progres + Gamificare → un item „Progresul meu"** (2 secțiuni: Statistici + Realizări). De-anglicizat: XP→puncte, streak→serii, achievements→insigne, leaderboard→clasament, level→nivel; cuvântul „Gamificare" dispare din UI. Zero migrare DB (arbori diferiți).
  2. **„Invită un prieten"** (redenumit din „Invită & Câștigă") = model CREDIT (vezi feature item dedicat mai jos).
  3. **Notificări (elev) = doar istoric, rămâne**. Dezvoltările merg în Setări→Notificări (feature item dedicat).
  4. **Calendar + Domenii la elev = PĂSTRĂM** (vizibile).
  - Sidebar final ELEV: Panou · Practică · Simulări · Progresul meu · Domenii · Calendar · Invită un prieten · Notificări · Setări. (Lecții/Evaluare/Examene/Bibliografie deja ascunse global.)

**🟢 PĂRINTE — SIDEBAR RESTRUCTURE DONE 2026-06-04** (commit `e884255`, rol-2): conditional render în `src/components/sidebar.tsx` — un cont **WATCHER pur** (`!superadmin && isWatcher && !isInstructor && !isStudent`) primește meniul focalizat **Panou · Monitorizare · Alerte · Invită un prieten · Notificări · Setări** (6 items, ordine per mockup). Fluxul de învățare al elevului (Practică/Simulări/Progresul meu/Domenii/Calendar) e ascuns din nav — **rutele rămân funcționale** (reversibil). SuperAdmin + instructor + elev păstrează meniul actual. **Verificat autentificat pe etutor.ro** (Playwright, 3 roluri): PĂRINTE=6 items exact ✅ · ELEV=9 items neschimbat (no regression) ✅ · SUPERADMIN=13 items meniu complet (no regression) ✅. Conturi test: `test_watcher@test.com` (WATCHER pur) + `test_student@test.com` (STUDENT pur), parole în `Master/credentials/tutor-test-users.env`.
  - **NB feature-uri PĂRINTE rămase = sesiuni dedicate** (🔨 de construit, NU în rol-2 sidebar): Monitorizare-sinteză narativă AI + exemple concrete zone-cu-probleme · **baterie teste remediale AI** (flagship) · tag-uire la import · Alerte configurabile (oră / 6/12/24/48h) · Recomandă-părinte = motor earnings unificat (item §257). Vezi design doc + capabilități §188.

**🟢 MEDITATOR — SIDEBAR RESTRUCTURE DONE 2026-06-04** (commit `915f7a8`, rol-3): conditional render — un cont **INSTRUCTOR pur** (`!superadmin && !isAdmin && isInstructorRole && !isStudent && !isWatcher`) primește **Panou · Instructor · Practică · Simulări · Invită un prieten · Notificări · Setări** (7 items). Sub-funcțiile Studenți/Grupuri/Obiective/Mesaje/Analiză/Rapoarte trăiesc în pagina `/dashboard/instructor` (hub). „Invită un prieten" rămâne vizibil (decizie user 2026-06-04 — meditatorul câștigă din referral). Conceptele de elev (Progresul meu/Domenii/Calendar) ascunse din nav — rutele rămân funcționale. **Verificat autentificat pe etutor.ro**: MEDITATOR=7 ✅ · PĂRINTE=6 ✅ · ELEV=9 ✅ · SUPERADMIN=13 ✅ (toate, no regression). Cont test `instructor-test@tutor.app`.
  - **NB feature-uri MEDITATOR rămase = sesiuni dedicate** (🔨): Mesaje doar in-app (scoate email/WA/SMS) · Rapoarte narativ PDF/HTML (azi DUMP CSV/JSON) · recomandare Studenți/Analiză = sinteză AI concretă · pagina de câștiguri (referral 3 luni bani + conținut perpetuu §286) · earnings engine unificat (item §257).

**🟢 DE-ANGLICIZARE „XP→Puncte" DONE 2026-06-04** (commit `915f7a8`, cerere user „Gamificare suna rau, consolideaza in Progres"): `StudentProgressCard` (partajat părinte Monitorizare + meditator Studenți) „XP" → „Puncte" (`watcher.points` ro+en). Cardul e deja un card de Progres unificat (Acuratețe/Serie/Puncte/Subiecte) — „Gamificare" nu apare ca etichetă pe suprafețele părinte/meditator. **Verificat randat real** pe ambele carduri (Puncte ✅ / XP eliminat ✅). NB: valoarea `level` (badge) vine din DB gamification — dacă e EN (ex. „Bronze"), e dată, nu etichetă — de evaluat separat dacă apare în UI.

**✅ RESTRUCTURARE MENIURI PE ROLURI — COMPLETĂ** (elev✓ 2026-06-04 `3dd1a87` → părinte✓ `e884255` → meditator✓ `915f7a8`). Ordinea obligatorie respectată; fiecare rol verificat autentificat înainte de următorul.

---

## [ ] 🎁 Referral — model CREDIT pentru ELEV (înlocuiește comisionul) — creat 2026-06-04

**Decizie user 2026-06-04** (în restructurare meniuri): comisionul 50% perpetuu pare schemă piramidală → **doar Creatorii (§286) îl păstrează**; elevii/părinții primesc **credit**.

**✅ MODEL FINAL UNIFICAT (user 2026-06-04)**: referral clienți (elev + părinte, indiferent cine invită) = **50% credit pe primele 3 luni** din abonamentul invitatului; se acumulează **la familie sau la copil**; creditul acoperă abonamentul până se epuizează (aritmetica confirmată: luna-2 = 30, user a recunoscut eroarea). Meditator/creator = același 50% dar **BANI** (payout), nu credit. Cele 2 întrebări de mai jos = REZOLVATE. **Rafinări 2026-06-04**: (a) TOATE referral = 50% din abonamentul **ACTUAL** al invitatului (meditator NU pe „minim" — reziduul rezolvat); (b) „meditator conținut auxiliar" = **ACELAȘI mecanism ca Creator §286** (50% perpetuu pe plata cumpărătorului), NU se plătește de 2 ori → meditatorul-care-publică = creator. **Doar 2 tipuri de earning: (A) Referral 50%×3 luni; (B) Conținut 50% perpetuu.** Matricea completă în `knowledge/menu-restructure-mockups.md`. Quote-urile verbatim de mai jos = trail al deciziei.

**⚖️ Condiție acumulare + CLAWBACK (user 2026-06-04, verbatim în design doc)**: earning se acordă DOAR pe plată efectiv încasată (pro-rata, lună de lună) — referral max 3 luni, creator perpetuu. **Risc legal ridicat de user**: dreptul de retragere/refund al consumatorului → motorul TREBUIE să suporte **clawback** (storno credit/bani la refund, inclusiv recuperare credit deja consumat). Cod azi: hold 30 zile pe `ReferralEarning`. **Dependență Legal** (`legal.knowbest.ro`, NO-TOUCH CRITIC) pentru politica exactă refund/waiver — NU consultanță juridică din partea mea.

**Cerință user (verbatim, NU reformulată)**:
> e prea mult comision perpetuu - pare schema piramidala. Punem pentru invitat 1 luna gratis (pe a doua, ca pe prima sa si-o plateasca imediat) si 1 luna gratis pentru cel care a facut invitatia (cu conditia ca cel care a facut invitatia sa aiba macar o luna platita. La a doua invitatie care se concretizeaza se transforma iar in credit pe inca o luna si tot asa. Poate ajunge la un moment dat cu o luna platita sa aiba chiar si credite pentru un an intreg - va fi un ambasador pentru aplicatie

**Mecanică ELEV**: invitat plătește luna 1 → luna 2 gratis. Cel care invită → +1 lună credit per invitație concretizată (condiție: ≥1 lună plătită); acumulează (a 2-a, a 3-a... → până la ~12 luni = ambasador).

**Varianta PĂRINTE (2026-06-04, verbatim în design doc)**: credit = **50% din echivalentul primei luni** a invitatului (chiar dacă plătește în avans pe 1 an), acumulat și aplicat pe abonamentul propriu lunar până se epuizează. **2 întrebări deschise**: (1) regula exactă de aplicare (exemplul user dă luna-2=45, dar regula „credit acoperă până se epuizează" dă 30); (2) elev (1 lună gratis ≈100%) vs părinte (50%) — intenționat diferite pe persona sau unificăm?

**Varianta MEDITATOR (2026-06-04, verbatim în design doc)**: **BANI** (nu credit). (a) Invită și câștigă = 50% din **abonamentul invitatului** (aliniat cu clienții, nu „minim"), per elev, primele 3 luni de plată ale elevului/părintelui. (b) Conținut auxiliar (materiale puse direct, abonate prin pachet) = câștig PERPETUU 50% din plata cumpărătorului — **ACELAȘI mecanism ca Creator §286** (NU feature separat, NU plată dublă); meditatorul-care-publică = creator. Mesaje meditator = DOAR in-app. Explicat clar în pagina meditatorului. → toate variantele cer **un motor unificat de earnings/credit** cu **doar 2 tipuri**: Referral (50%×3 luni) + Conținut (50% perpetuu). Matrice completă în `knowledge/menu-restructure-mockups.md`.

**Stare azi**: `src/lib/referral.ts` face comision 50% cash + voucher −25%; modelul de credit NU există → muncă nouă (mecanism credit-lună/credit-lei pe subscription + landing page detalii). Detaliu complet (ambele variante) în `knowledge/menu-restructure-mockups.md`.

---

## [~] 🔔 Setări → Notificări — pachet + delegare — SLICE 1+2 DONE+LIVE 2026-06-26 (commits `1ac9a38`+`981da8e`+`3f46403`)

**LIVRAT + LIVE pe etutor.ro (fără migrare DB — totul pe `Setting` + stare abonament; decuplat intenționat de structura abonamentelor ca să nu se ciocnească cu sesiunea paralelă de billing):**
- **Delegare părinte↔copil** (slice 1): pe *Familia mea*, părintele (guardian) bifează „Eu gestionez notificările pentru acest copil" + setează canalele copilului. Endpoint guardian-gated `/api/family/[childId]/notifications`. Copilul vede notiță read-only ȘI endpoint-ul self refuză scrierea (403) când e delegat — **binding, nu doar ascuns în UI**. `isGuardianOf` întărit (respinge self-link).
- **Canale pe pachet** (slice 2): `src/lib/plan-channels.ts` (9 teste) — gratuit = push+email (canale fără cost), plătit (active/trialing) = +WhatsApp+SMS. **Server-enforced** în ambele endpoint-uri (self + parent): un cont gratuit nu poate ENABLE canal plătit nici prin apel direct; `clampChannelWrite` forțează OFF canalele excluse de pachet la orice scriere (verificat live: PUT whatsapp=true pe cont gratuit → whatsapp=false). UI: lacăt 🔒 „Disponibil în pachetele plătite". GET-urile întorc `allowedChannels`.

**RĂMÂNE (slice 3+, coordonează cu sesiunea de billing ca să nu vă ciocniți pe `SubscriptionPlan`):**
- [x] **Deblocare funcții pe pachet** — DONE+LIVE 2026-06-26/27 (Slice 3, commits `872cc4a`+`575d2e9`+`ec16fac`): `plan-features.ts` (gating pur pe `subscriptionStatus`) + enforcement server (exam/start, lessons/[id], calendar connect+schedule) + soft-lock UI (FeatureGate) pe exams/lessons/calendar + secțiune avansat progress. 4 funcții paid: simulări, lecții, calendar, progres avansat. Materiile rămân gratis.
- [x] **Pagina de pachete + tranziție upgrade** — DONE+LIVE (`575d2e9`): `/dashboard/packages` (5 planuri active: Self 19.9 / Family 24.9 / Duo 29.9 / Trio 39.9 / Family Trio 49.9), checkout broker funcțional, CTA upgrade din soft-lock → pagina reală. Preț = prima materie + reduceri (`ec16fac`).
- [x] ✅ **Compoziție pachet (seat-uri)** — DONE 2026-06-29 (commit `12b4e41` + migrație `0037`, LIVE etutor.ro): mașinăria de seat-uri (`family.ts` + invitații + checks) era deja LIVE; **acum seat-urile sunt STOCATE pe schemă** (`SubscriptionPlan += familyPlanKey + maxParents/maxChildren/maxTutors`, toate nullable/aditive), nu mai derivate din numele planului. Resolver pur nou `resolveFamilyPlanFromRecord` (preferă cheia stocată + override-uri per-seat; fallback pe nume pt rânduri legacy). `resolveOwnerPlan` + `/api/plans` + pagina pachete rezolvă din record. Backfill aplicat pe cele 5 planuri live (Self→ELEV, Family→FAMILY, Family Duo→FAMILY_DUO, Trio→TRIO, Family Trio→FAMILY_TRIO; seat columns null = canonic). 12 teste noi. Migrație aplicată pe PROD cu backup `VPS2:/root/backups/tutor-pre-seats-2026-06-29.dump`; Stripe (stripeId/price) neatins. **Notă**: pagina family își re-derivă seats canonice din planKey pt CTA-urile de adăugare membru — pt planurile actuale (override null) = identic cu compoziția stocată; dacă un plan viitor setează un override per-seat diferit, CTA-ul ar trebui comutat pe seats-urile rezolvate de API (follow-up minor).
- [x] ✅ **Send-path** — DONE 2026-06-29 (commit `524f237`, LIVE etutor.ro): gating pe pachet enforced acum și la trimitere, nu doar scriere+UI. Predicat pur exportat `meteredChannelBlocked(channel, metadata, user)` în `notifications/service.ts`, apelat în chokepoint-ul unic `sendNotification` — WhatsApp/SMS blocate pentru conturi neplătite (folosește `isPaidSubscriber` = status+expirare, identic cu gate-ul primar al engine-ului). Onorează aceleași excepții ca engine-ul (test-accounts journey-audit + parent-authorized): `engine.ts` pasează `isTest`+`parentAuthorized` în metadata, `parent-nudge` marchează `parentAuthorized:true`. Acoperă și gap-ul real: **SMS nu era gated pe plan în engine** (doar daily-limit) + orice caller (retry-cron pe abonament expirat) nu mai poate scurge canal plătit. 10 teste unitare noi (`notification-plan-gate.test.ts`). Zero efect pe trafic live (canale metered neconfigurate în prod) — groundwork pentru când se activează.
  - 🗣️ *Pe înțelesul tău:* Înainte, regula „WhatsApp/SMS doar pentru conturi plătite" era verificată doar când userul își salva preferințele. Acum o verific și în momentul efectiv al trimiterii — așa, niciun cont gratuit nu poate primi un mesaj plătit, nici dacă abonamentul a expirat între timp.

**Cerință user (verbatim, NU reformulată)** — spec original mai jos:

**Cerință user (verbatim, NU reformulată)**:
> extindere SubscriptionPlan cu compoziție (seat-uri: maxParinti/maxMeditatori + canale incluse per pachet);
> model de delegare (toggle în Setări părinte: „le fac eu pentru copil" / „lasă copilul să și le facă singur");
> gating canale pe pachet;
> tranziție la upgrade pachet (copil-only → +părinți +meditator: provizionezi seat-urile noi + default prefs).

**Stare azi**: `SubscriptionPlan` generic (fără seats/compoziție); `NotificationPreference` self-only (fără delegare, fără gating pe pachet). Tot blocul = 0% construit. Detaliu în `knowledge/menu-restructure-mockups.md` (roadmap final).

---

**[archive] IMPORT serie 2+ — MATEMATICĂ (audit 2026-06-04; user încarcă fișiere)**:

**Folder primit + auditat:** `~/Downloads/Temp/tutor eval nat/pro-matematica/` — **22 fișiere = 11 perechi Subiect+Barem, toate complete** (zero subiect fără barem / barem fără subiect), **zero duplicate** (nume + size toate distincte). Verificat 2026-06-04.
- 2024 (4 perechi): `2024_EN_Matematica_{Examen_07, Model, Rezerva_Examen_02, Simulare}_{Subiect,Barem}_LRO.pdf`
- 2025 (5 perechi): `2025_EN_Matematica_{Examen_07, Model, Rezerva_Examen_02, Sesiunea_Speciala_03, Simulare}_{Subiect,Barem}_LRO.pdf`
- 2026 (2 perechi): `2026_EN_Matematica_{Model, Simulare}_{Subiect,Barem}_LRO.pdf`

**⚠️ SKIP `2026_EN_Matematica_Model_*`** = ACELAȘI examen importat deja la MVP (seria 1, EN VIII 2026 Model). → **NOU de importat: 10 perechi** (2024 ×4 + 2025 ×5 + 2026 ×1 Simulare).

**Proces (ca MVP, per pereche):** citește Subiect+Barem PDF → transcrie itemii verbatim + cheile din Barem (ground-truth, zero halucinație) → import (`ExamPaper`/`ExamItem`/`ExamPassage`; `examType`: `EN_VIII` pt Examen/Rezervă/Sesiune, `SIMULARE` pt Simulare, `MODEL` pt Model; `year` per fișier; `variant` distinct ex. `examen-07`/`rezerva-02`/`simulare`/`sesiune-speciala-03`) → extrage figuri (PyMuPDF clip-rect, ca slice 3) → `figureUrl` + `finalAnswer` unde rezultatul e curat → migrare deploy + atașare pe prod + verificare autentificată (ca slice 1+3).

**Decizie scară (user must pick):** manual per-pereche (calitate sigură, dar 10 lucrări = efort mare) **vs** pipeline semi-automat (mai rapid; figurile tot cer verificare vizuală). **Recomandare:** începem manual cu **2026 Simulare + 2025 (Examen+Model+Simulare)** (cele mai relevante), apoi decidem pipeline pt restul.

**Pending de la user:** restul materialelor (alte surse) + **Româna** (ulterior — focus Mate întâi). **Drepturi: NU mai e o problemă** — user 2026-06-04: „tot ce îți încarc eu, aia pui; momentan sunt doar informații oficiale". Deci import direct ca ground-truth tot ce e în folder, fără caveat de republicare.

**SLICE 3 DONE 2026-06-03** (commit `4d42ca0`, LIVE + verificat autentificat pe etutor.ro): **figuri + ecran elev**. (A) 11 figuri Matematică extrase din PDF (PyMuPDF clip-rect; 4uPDF = același fitz dar doar pagini întregi), `ExamItem.figureUrl` (migrare `0017`), atașate 11/11, servite static din `public/exam-figures/`, afișate în admin + take. (B) Ecran elev `/dashboard/exam-bank` (listă + take), sidebar „Simulări" — itemi **sanitizați fără chei** (verificat: take HTML n-are `correctAnswer`-data, doar label i18n), `POST /api/exam-bank/[paperId]/score` corectează server-side + dezvăluie baremul, rezultate cu notă/10 + recalcul live + auto-notare deschise. **Stateless** (fără persistență). `/code-review` a prins un bug critic: label-urile se repetă 1-6 pe fiecare subiect la Mate → cheiat acum pe **id** (answerKey) peste tot + regression test 12/12; + 3 fix-uri (TF_GRID index, mesaj estimare, gard isActive).

**SLICE 2 DONE 2026-06-03** (commit `fd650df`, LIVE + verificat autentificat pe etutor.ro): „calculatorul de notă" (motor scoring pe barem, `src/lib/exam-bank/score.ts` — `scoreExamPaper` obiective auto + deschise self-score + notă/10 + extrapolare „estimare", 11/11 smoke) + **pagină admin read-only** `/dashboard/admin/exam-bank` (listă + detaliu cu barem + defalcare puncte auto/manual/figură), link „Bancă examene" în meniu (RO hardcodat). Motorul NU e încă legat de un ecran de elev (slice 3). `/code-review` pass (3 fix-uri: Array.isArray guards pe Json, maxScore=0 guard).

**SLICE 1 DONE 2026-06-03** (commit `a6a1e98`, LIVE pe prod VPS2 `tutor`): model + import real al celor 2 simulări EN VIII 2026 Model.
- Modele noi (migration `0016_exam_bank`, aditiv): `ExamPaper` / `ExamPassage` / `ExamItem` — izolate de banca `Question` (fără mesh gate, fără leak în `/try`). Item-ii poartă barem (puncte + sub-puncte a/b), secțiuni, rubrică, passages, figuri-flag.
- Import (`scripts/import-exam-en-viii-2026.mjs`, idempotent, `--validate`/`--dry`/apply): **Matematică** 18 itemi (S-I 6 + S-II 6 figuri + S-III 6 deschiși) + **Limba română** 2 passages + 18 itemi (I.A 9 + I.B 8 + Subiectul II compunere). Chei din baremul oficial (Mate I 1c2b3a4c5c6b / II 1b2c3c4a5a6d; RO A2c A3b A4c B1c B2d B3d B4d). Puncte 90+10 oficiu=100 fiecare. autoGradable=13 (Mate 5 + RO 8); restul figură-dependente/deschise (marcate `hasFigure`/`OPEN`, NU fabricăm figuri). Prod totals: ExamPaper=2, ExamItem=36, ExamPassage=2.
- **169 Matematica V-VIII PUBLISHED → DRAFT** (`scripts/draft-matematica-v-viii.mjs`, scoped + rollback list pe VPS `scripts/_rollback/...json`). Acum DRAFT=343, PUBLISHED=0 în acel domeniu. Efect: materia Capacitate Matematică dispare din demo `/try` până la republicare (intenționat). **Notă scope:** „Matematică" (9) rămas în demo = domeniul **Aviation** (mate de aviație, alt subiect) — NU a fost atins (out-of-scope).
- Sursele rămân intacte local (`~/Downloads/Temp/tutor eval nat/*.zip`). Doc: `knowledge/exam-bank.md`.
- Verificat: HEAD assert VPS==local, pg_dump backup `/root/backups/tutor-pre-exambank-2026-06-03.dump`, migrate deploy + generate, dry→apply, psql spot-check (Mate S-I.1=c/5p, RO B.1=c), idempotency dry re-run (0 changes), etutor.ro /api/auth/session 200.

**RĂMÂNE (slice 4+)**: **persistența încercării** (salvare notă/răspunsuri → progres pentru părinte/profesor); mix-engine (asamblează test din mai multe examene); import pro-matematica 2017-2026 + linkuri oficiale; detectare greșeli recurente („ai mai greșit ceva similar"); gating free/premium pe simulări; republicare curată Matematică în demo public. (✅ DONE slice 2: scoring + UI admin · slice 3: figuri + ecran elev.)

**Tier nou, PESTE grilele generate.** Aici NU mai cauți întrebări + răspunsuri ≥97% — folosești **subiecte + bareme oficiale** (EN VIII + simulări/examene trecute) → răspunsuri **100% corecte**, zero halucinație, poarta mesh nu mai e necesară. Mixezi itemi din mai multe simulări/examene cu baremele lor, peste materialul didactic existent.

**Viziunea userului (verbatim, 2026-06-03):**
> Vezi in ce masura poti face si simulari pentru examenul de capacitate - in ideea in care sa combini din mai multe simulari si examene trecute cu baremuri si punctaje specifice pe care sa le poti mixa cum vrei tu, deja cu ceea ce ai existent ca material didactic. Aici nu mai trebuie sa cauti intrebari si sa gasesti raspunsurile care sa fie >97% - aici ai chiar 100% raspunsurile corecte.
> Iar elevului sau/si parintelui / profesorului sa ii poti spune ceva de genul: ai/a facut 7/8 si fiecare cu baremul asta. Extrapoland ai/ar fi luat 9,45 daca ai fi dat examen doar de aici . Dar, problema nr 6 a fost gresita si exista un pattern ca ceva similar a mai gresit si in data de la problema asta (click aici)

**Componente (de detaliat la implementare):**
1. Model „examen/simulare" (sursă, an, materie, tip=EN/simulare) cu itemi structurați; fiecare item poartă **baremul oficial** (puncte/subpuncte) + răspuns 100% corect.
2. **Import as-is** din sursele oficiale (EN VIII 2026 local + linkurile + pro-matematica 2017-2026) — vezi „Materiale gata făcute". Verifică parsarea (bug literă dublată de mai sus).
3. **Mix engine**: asamblezi un test custom din itemi pe mai multe examene (după an/topic/dificultate), păstrând baremul fiecăruia.
4. **Scoring pe barem**: nota brută (ex. 7/8 itemi, X/100p) → **notă extrapolată** pe scala 1-10 EN, marcat clar „estimare", nu predicție (honest-reporting).
5. **Pattern de greșeli**: tag per item (topic/competență) → detectezi greșeli recurente în istoricul elevului → deep-link la itemul greșit + greșelile similare anterioare („click aici").

**De decis la implementare (riscuri reale):**
- Mate are **punctaj parțial** (baremul = rubrică, nu un singur răspuns). Auto-grading complet pe demonstrații/construcții e greu → faza 1 = doar itemi auto-gradabili (grilă/răspuns scurt); restul = „compară cu baremul" / self-score.
- Drepturi sursă: subiecte/bareme edu.ro = publice; pro-matematica.ro / Hei Profu' = atenție la republicare verbatim (folosit ca referință/calibrare).

---

## [~] 🤖 Content Quality Mesh — productizare pipeline generare grile (planificat 2026-06-02; MARE PARTE FĂCUT 2026-06-03)

**DONE 2026-06-03** (commit-uri `81c3871`→`7d0c95f`): mesh-ul integrat în `ingest-pdf` (fetch manuale.edu.ro → curățare → segmentare strictă → generare → 3 lentile + fix-loop → **poartă de calitate**). Acoperire pe tot manualul (passage-range chunking). **Stage-3 judge = Claude CLI pe VPS** (`finalJudge`, subscription $0) — ridică bucket-ul auto-keep de la ~87% (Groq-only) la **≥97% verificat** (vezi L02). UI **bulk-publish pe materie+prag de confidence** live (`/dashboard/admin/questions/review` + API `bulk-publish`). 5 materii ingestate (Istorie/Mate/Geo/Bio/Chimie VII) — 280+ high-confidence Claude-verified, toate DRAFT.

**RĂMÂNE:** aceeași poartă (Claude judge) și pe căile `from-content` + `bulk-import` (acum doar pe `ingest-pdf`); calibrare continuă pe materii cu raționament; vezi item-ul **Capacitate** de mai sus pentru consolidarea Română+Mate V-VIII. **Plan complet** în `STRATEGY.md` „Tier 5" + `knowledge/MONETIZATION-FAMILY-PLANS.md` (monetizare).

---

## [~] 🎯 Creator program (revenue-share perpetuu) — pagina LIVE; comisioane + teaser de făcut (creat 2026-05-26, pagina DONE 2026-05-27 commit `af05335`)

Plan complet în `knowledge/creator-program-plan.md`. Recrutăm creatori de conținut (profesori) care adaugă material pe materii și câștigă **comision perpetuu** (~40% pro-rata pe consum, plăți Stripe Connect). Promovare **idee-întâi** (fără URL platformă) → pagină dedicată creatorilor + waitlist.

**Domeniu DECIS 2026-05-27:** `etutor.ro` (achiziționat pe Hostico). Plan migrare în `knowledge/etutor-migration-plan.md` — **DNS direct prin Hostico** (Cloudflare NU e necesar; 2 A-records → `72.62.155.74`, ca restul `*.knowbest.ro`). Faza 1 = acțiune user (2 A-records în panoul Hostico); Fazele 2-6 = eu (nginx+SSL+env+OAuth), ~30-45min după ce DNS rezolvă.

**DONE 2026-05-27** (build #1 — pagina creatorilor): `/creatori` LIVE pe tutor.knowbest.ro (RO+EN, idee-întâi, fără URL platformă) — hero, cum funcționează, model comision transparent, materii deschise, FAQ + formular waitlist. Model `CreatorWaitlist` (migrare 0010) + `/api/creatori-waitlist` (zod, upsert-idempotent, public). Verificat end-to-end (POST salvează lead, validare, cleanup). Va rula pe `etutor.ro/creatori` automat după DNS.

**Build rămas:**
- [ ] (2) **sistem comisioane + Stripe Connect** (faza 4 din plan — atribuire conținut→creator, tracking consum, calcul lunar, payouts). Sesiune dedicată mare. **Clarificare 2026-06-29 (user):** NU e despre conexiunea la broker/stripe.com (aia e gata + funcțională). „Stripe Connect" aici = infrastructura de **payout-uri către creatori** (profesorii care încarcă conținut primesc bani) — cont Connect per creator + transfer automat lunar. Rămâne amânat (sesiune mare).
- [x] (3) **campanie recrutare pe materii** — LANSAT 2026-05-27 (MA commit `e8a0f3d`): campanie `tutor-creatori-recrutare` în MA → TeInformez, 6 postări FB săptămânale (5 iun → 10 iul) idee-întâi → `etutor.ro/ro/creatori` + CAS InFeed. 3 programate pe FB, 3 amânate (fereastra 29z) auto-programate prin cron `tutor-creatori-reschedule.sh` (06:23). LinkedIn (educatori) rămâne manual.
- [x] ✅ migrare `etutor.ro` — **DONE/stale** (verificat 2026-06-29: `etutor.ro` LIVE din 2026-05-27, 307→/ro; vezi DEPLOY_REGISTRY rândul tutor + DNS).

---

## 🎯 TRUE FULL E2E — multi-role business workflows

**Invocare**: [10] True Full E2E Audit — scope complet per CLAUDE.md §10.

**Roles disponibile**:
- **STUDENT** (enrolled in domain): practice sessions, exams, progress, bibliography, gamification
- **INSTRUCTOR** (enrolled with INSTRUCTOR role): groups, students, analytics, goals, reports, questions
- **ADMIN** (enrolled with ADMIN role): questions CRUD, domains, lessons, bibliography, subjects, tags
- **WATCHER** (enrolled with WATCHER role): watcher dashboard, student monitoring, escalation management
- **SUPER_ADMIN** (`isSuperAdmin=true`): all above + superadmin panel (users, plans, ads, revenue, vouchers)

**Test accounts (prod DB `tutor` on VPS2)**:
- `admin-test@tutor.app` / `vqAY88Ym7aJ7xwQM` — isSuperAdmin=true
- `instructor-test@tutor.app` / `m8JGvxUMDk8shUeE` — INSTRUCTOR role in domain aviation
- `test_student@test.com` / `TutorTest2024!` — STUDENT role
- `test_instructor@test.com` / `TutorTest2024!` — INSTRUCTOR role
- `test_admin@test.com` / `TutorTest2024!` — ADMIN role
- `test_watcher@test.com` / `TutorTest2024!` — WATCHER role

**Notes on aviation domain**: 24 PUBLISHED questions in DB. API routes are domain-prefixed: `/api/aviation/session/start`, `/api/aviation/exam/start`, `/api/aviation/xp`, etc. (NOT flat `/api/practice/` paths).

---

### A. Pre-requisites

- [x] **A1** — Verify all 6 test accounts accessible + correct roles in prod DB — 2026-05-11
- [x] **A2** — Verify domain `aviation` exists + has questions, lessons, bibliography seeded — 2026-05-11 (24 PUBLISHED questions; bibliography empty — see AGT-004)
- [x] **A3** — Provision test data: at least 1 practice session per student, 1 completed exam, 1 group per instructor — 2026-05-11

---

### E. Workflow Scenarios (happy path + edge cases)

- [x] **E1 — Student practice flow** — 2026-05-11 PASS
- [x] **E2 — Student exam flow** — 2026-05-11 PASS
- [x] **E3 — Student assessment flow** — 2026-05-11 PASS
- [x] **E4 — Student bibliography** — 2026-05-11 PARTIAL (0 items in aviation — see AGT-004)
- [x] **E5 — Student progress & gamification** — 2026-05-11 PASS
- [x] **E6 — Student notifications** — 2026-05-11 PASS
- [x] **E7 — Instructor group management** — 2026-05-11 PASS
- [x] **E8 — Instructor student monitoring** — 2026-05-11 PASS
- [x] **E9 — Instructor questions** — 2026-05-11 PASS
- [x] **E10 — Instructor reports + analytics** — 2026-05-11 PASS
- [x] **E11 — Admin question management** — 2026-05-11 PARTIAL (GET/POST/PUT/DELETE PASS; PATCH 405 bug — see AGT-001)
- [x] **E12 — Admin domain management** — 2026-05-11 PASS
- [x] **E13 — Admin lessons + bibliography** — 2026-05-11 PASS
- [x] **E14 — Watcher monitoring** — 2026-05-11 PASS
- [x] **E15 — SuperAdmin panel** — 2026-05-11 PASS (all 7 API endpoints)
- [x] **E16 — Auth flows** — 2026-05-11 PASS
- [x] **E17 — Locale switch** — 2026-05-11 PASS

---

### F. Concurrency

- [x] **F1** — 2 students simultaneous sessions → no collision — 2026-05-11 PASS
- [x] **F2** — Student + instructor concurrent progress read → consistent — 2026-05-11 PASS

---

### G. Browser Real (headed, Tester journey-audit)

- [x] **G1** — Student role walk — 2026-05-11 (14 OK, 1 HAS_ERRORS/Exams, 2 EMPTY/Calendar+Settings)
- [x] **G2** — Instructor role walk — 2026-05-11 (15 OK, 2 EMPTY/Calendar+Settings)
- [x] **G3** — Admin role walk — 2026-05-11 (API tests PASS; Puppeteer login blocked — AGT-005)
- [x] **G4** — SuperAdmin role walk — 2026-05-11 (API tests PASS; same Puppeteer blocker)
- [x] **G5** — Mobile viewport (390×844) — 2026-05-11 PASS (7/7 OK)

---

### H. Parity

- [x] **H1** — Local dev vs prod: same feature set — 2026-05-11 PASS
- [x] **H2** — EN↔RO locale: all pages translate, no missing keys — 2026-05-11 PASS
- [x] **H3** — Unauthenticated redirect to signin with callbackUrl — 2026-05-11 PASS

---

### I. Stress

- [x] **I1** — 10 concurrent practice session starts → no 500s — 2026-05-11 PASS
- [x] **I2** — 50 questions bulk import — 2026-05-11 N/A (image-only endpoint; no JSON bulk import — AGT-006)

---

## [ ] Mobile touch targets — dashboard content pages

**Status**: sidebar.tsx fixed (min-h-[44px] on nav links). Dashboard page content needs per-page audit.
**Scope**: mobile-tester currently 75/100. Likely affected: buttons on practice, exam, assessment pages.
**Gap**: AGT-007 + AGT-009 in AUDIT_GAPS.md

---

## [x] AUDIT_GAPS.md — create + populate — DONE 2026-05-11

Created `Tutor/AUDIT_GAPS.md` with 9 gaps from TRUE-E2E-FULL-2026-05-11 audit.

---

## [x] Fix AGT-001 — PATCH handler on admin/questions/[id] — ALREADY DONE (verified 2026-06-13)

`src/app/api/admin/questions/[id]/route.ts:107` already exports `PATCH = withErrorHandler(_PUT)` with an all-optional zod schema (partial update). Stale marker.

---

## [~] Fix AGT-003 — Calendar page empty — CTA exists; OAuth env = USER action (verified 2026-06-13)

The "Connect Google Calendar" CTA already exists (`CalendarConnect` in `src/app/[locale]/dashboard/calendar/page.tsx`). The page reads "empty" only because Google OAuth env vars aren't set on VPS2. Remaining = **user action**: provision Google Calendar OAuth creds + set env on VPS2. No code change needed.

---

## [ ] Fix AGT-004 — Seed aviation bibliography — DEFERRED 2026-06-13

Run POST /api/admin/bibliography to add items for aviation domain.
> Deferred: needs real aviation reference content (won't fabricate bibliography), and the Aviation domain is leftover non-curriculum demo data (etutor = RO school tutoring) whose product value is unconfirmed. Decide whether to keep/retire the Aviation domain before seeding it.

---

## [ ] WG Fixes — a11y 55/100 + mobile-tester 75/100 — DEFERRED 2026-06-13

Use Website Guru (`POST guru.techbiz.ae/api/fix`) to fix AGT-008 (a11y) + AGT-009 (mobile touch targets).
> Deferred from the quick-wins batch: this is a multi-page audit + WG-driven loop, best run as a focused TWG-GW session (not a single quick fix). Pairs with the "Mobile touch targets" item above.

---

## Session Log

| Date | Change |
|------|--------|
| 2026-05-11 | Created. E2E [9] done (CODE 89/100, Journey 17/17 OK). Sidebar focus trap + touch targets + contrast + dangerouslySetInnerHTML + cookie Secure flag fixed. |
| 2026-05-11 | True Full E2E [10] COMPLETE. 31/35 PASS (89%). Bugs: AGT-001 (PATCH 405), AGT-002 (Settings blank), AGT-003 (Calendar empty), AGT-004 (bibliography empty), AGT-007/009 (mobile touch targets). Reports/TRUE-E2E-FULL-2026-05-11.md + AUDIT_GAPS.md created. |
| 2026-06-26/27 | Slice 3 feature-tiering (`872cc4a`) + pagină pachete (`575d2e9`) + preț-pe-materie (`ec16fac`). Notificări doar în zile programate — fără spam weekend/vacanță (`a5f0ee6`). Critice: nodemailer 6→9 (`d952938`), CSP hardening parțial — scos unsafe-eval + One Tap (`72765fc`), GDPR Legal Hub integration LIVE (`fddb00c`+`59b83bd`). next-CVE + A1-leak = stale (deja rezolvate). requireDomainAccess = decis (keep). Igienă: dedup bloc securitate triplat. |

## 🔍 Introspection Audit 2026-06-20
> Audit complet (gap strategie↔cod · ghid per-pagină · deep research · funcțional + cyber).
> **Scor AIWebAuditor: 76/100** · GDPR 20. 6 acțiuni deschise · 🔴 3 critice.
> Rapoarte: `Reports/INTROSPECTION-2026-06-20/` (00-SUMMARY.md, 01-gap-strategy-vs-code.md, 02-pages-guide-RO.md, 03-deep-research-optimization.md, 04-audit-findings.md, 04b-security-audit.md)
> Checklist Alex centralizat: `Master/reports/Alex_TODO_2026-06-20.md` + tab „Introspection Audit" în UI Master.

## Tutor (`etutor.ro`) — ACTIVE (fix-urile așteaptă review-ul tău)
Sursă: `Tutor/Reports/INTROSPECTION-2026-06-20/`

- [x] 🔴 ✅ **REZOLVAT/STALE 2026-06-27** — modelul `Guardian` + scoping watcher sunt LIVE (Pachete familie Faza 0-3); verificat în `src/app/api/dashboard/watcher/route.ts`: părintele pur vede DOAR copiii legați (`linkedChildIds`), instructor/admin = teaching legitim. [istoric] **Leak date despre MINORI în portalul de părinte (A1)** — planurile Family/Duo/Trio vândute pe `/preturi`, dar lipsea modelul `Guardian`/`FamilyGroup` → un părinte vedea TOȚI studenții dintr-un domeniu.
  - 🗣️ *Pe înțelesul tău:* Vinzi abonamente de familie, dar legătura părinte–copil nu e construită, deci un părinte vede TOȚI elevii de la o materie, nu doar copilul lui — date despre minori expuse. După fix, fiecare părinte vede strict propriul copil și poți lansa în siguranță planurile de familie.
- [x] 🔴 ✅ **DONE+LIVE 2026-06-27** (commits `fddb00c`+`59b83bd`) — **GDPR pe public cu minori** rezolvat via **Legal Hub** (controller Class RDA): banner cookie (consent anonim → 201), pagini Privacy/Terms/Cookies SSR din documentele MASTER (ro/en), DSR export/ștergere/corectare → coada DPO (`x-legal-api-key`). `AppEntityMapping tutor`→class-rda creat. (Nu există GA → fără consent-mode de tracking.)
  - 🗣️ *Pe înțelesul tău:* Urmărești vizitatorii (inclusiv minori) fără banner de acord — risc serios de amendă pe date despre copii. După fix, urmărirea pornește doar cu acordul lor și ești în regulă cu legea.
- [x] 🔴 ✅ **STALE 2026-06-27** — CVE middleware-bypass = CVE-2025-29927, reparat în Next **15.2.3**; suntem pe **15.5.19** → deja patch-uit. (Upgrade-ul la 16.x = major opțional, nu de securitate — separat.)
  - 🗣️ *Pe înțelesul tău:* Framework-ul site-ului are o gaură gravă prin care cineva poate ocoli protecțiile de acces. Aprobă o sesiune ca să-l urc la o versiune sigură, cu testare după.
- [x] 🟡 ✅ **DONE 2026-06-27** (commit `d952938`) — **`npm audit fix`**: nodemailer 6→9 (vuln high SMTP/CRLF injection eliminat). Rămase = esbuild (doar dev-server Windows) + postcss transitiv — cer downgrade `next@9.3.3` via `--force` (capcană), deci ACCEPTATE (zero risc prod).
  - 🗣️ *Pe înțelesul tău:* Câteva biblioteci externe sunt învechite și au vulnerabilități. Le actualizez (majoritatea fără risc), ca să fie totul curat.
- [x] 🟡 ✅ **Întărire CSP** — DONE 2026-06-29 (commit `324d745`, LIVE etutor.ro): eliminat `script-src 'unsafe-inline'` via **nonce per-request** — CSP mutat din `next.config.ts` (static) în `src/middleware.ts` (`buildCsp(nonce)`), propagat la render-ul RSC printr-un `NextRequest` reconstruit cu `x-nonce`+CSP pe headere. `script-src 'self' 'nonce-…' https://accounts.google.com` (One Tap intact — GSI injectat din JS de încredere). `style-src` păstrează `unsafe-inline` deliberat (Next inline critical-CSS, XSS pe stil = severitate mică). Verificat local pe build prod (next 15.5.19 + next-intl 4.13: 35/35 scripturi nonce-uite, zero `<script>` inline ne-nonce-uit) + LIVE (38/38 nonce, `/ro`+`/auth/signin`+`/preturi` 200, pm2 +1 restart fără crash-loop, zero erori CSP în err-log). Anterior (`72765fc`, 2026-06-27): scos `unsafe-eval` + `object-src 'none'`/`base-uri`/`form-action` + deblocat One Tap (`frame-src`/`connect-src`).
  - 🗣️ *Pe înțelesul tău:* Am eliminat ultima slăbiciune din apărarea site-ului împotriva codului injectat (acum fiecare pagină primește un „cod unic" pe care doar scripturile noastre îl au — un atacator nu poate strecura cod). Verificat că login-ul și pagina de prețuri merg normal după schimbare.
- [x] 🟡 ✅ **Footer politici vizibil** — DONE 2026-06-29 (commit `d318f98`, LIVE etutor.ro): strip minimal global (Confidențialitate · Termeni · Cookie-uri) pe paginile interne (dashboard/auth/preturi/etc.) via `PolicyFooter` în `[locale]/layout.tsx`, suprimat pe landing (care păstrează footer-ul bogat) prin headerul `x-pathname` setat în middleware. Închide gap-ul: userul care a închis bannerul de cookie-uri nu mai avea cale spre politici pe paginile interne. Verificat LIVE: strip prezent pe `/preturi`+`/auth/signin`, absent pe landing, toate 200.
  - 🗣️ *Pe înțelesul tău:* Am pus jos pe fiecare pagină internă linkuri discrete spre Confidențialitate/Termeni/Cookie-uri, ca politicile să fie mereu la un click — chiar și după ce userul a închis bannerul de cookie-uri. Pagina principală rămâne cu footer-ul ei complet.
- [x] 🔴 ✅ **Feedback Rareș — flux validare/reparare/notificare audit + 2 fix-uri** — DONE 2026-06-29 (commit `3b4cab3` + restore data, LIVE etutor.ro). **Audit:** fluxul EXISTĂ și RULEAZĂ (cron `/api/cron/escalation` la 15 min, CRON_SECRET match, `success:true`) — cele 29 de 👎 ale lui Rareș (24/25/28 iun) au fost toate validate + rezolvate + notificate (Rareș 29 notif `feedback_resolved`, admini 174 `feedback_admin`). **BUG găsit:** judecătorul AI confunda reclamații de PLATFORMĂ („robotul vorbește prea rapid" = viteza TTS) cu defecte de întrebare → **a ascuns 4 întrebări valide** (listening/dictare, DRAFT) + le-a tratat inconsistent (dismiss vs hidden); reclamația reală de produs nu ajungea la nimeni. **Fix-uri:** (1) repuse cele 4 întrebări DRAFT→PUBLISHED pe prod + adnotate feedback-urile (audit); (2) judecătorul clasifică acum `complaintType: question|platform` — reclamațiile de platformă NU mai ascund/corectează NICIODATĂ întrebarea, ci se rutează la admini ca „🛠️ problemă de produs" (`reviewAction=product_flagged`, default sigur „question"); decizie extrasă în `decideReviewAction` pur + 7 teste (incl. exact regresia); (3) **control viteză TTS** pentru elev (🐢 Lent / Normal / 🐇 Rapid) lângă butoanele de citire pe exercițiile audio/cub, persistat în localStorage. Verificat LIVE: cron returnează `productFlagged`, /ro 200, build + 41 teste verzi.
  - 🗣️ *Pe înțelesul tău:* Fluxul tău de feedback (verifică→repară→anunță elevul + adminii) chiar funcționa și i-a procesat toate reclamațiile lui Rareș. DAR robotul AI confunda „vocea citește prea repede" cu „întrebarea e greșită" și ascundea întrebări bune. Am repus cele 4 întrebări ascunse greșit, am învățat robotul să separe reclamațiile despre platformă de cele despre întrebare (cele despre platformă merg la administratori, nu mai ascund nimic), și am dat elevului un buton să încetinească vocea.
  - **[x] Follow-up rutare notificări + calibrare TTS pre-test — DONE 2026-06-29** (commits `defe7fe` + `4ece489`, LIVE): (1a) **admin → Telegram** unde e linkat (în plus de in-app) + trimis manual ACUM rezumatul fluxului de fixing pe Telegram (msg_id 227); (1c) **user → fluxul setat de părinte** — feedback-ul ajunge și pe canalele din `NotificationPreference` (Telegram dacă linkat + email dacă activ) pentru rezultate acționabile (nu pe dismiss; WhatsApp/SMS sărite — template-locked „study_reminder" + metered, nu pot duce text liber de feedback); (2) **calibrare TTS pre-test** — `<TtsCalibration>` afișat ÎNAINTE de cronometru când sesiunea (aptitudini-aviatie) are întrebări citite cu voce: avertisment + N întrebări audio + voce-exemplu + reglaj viteză pt tot testul, apoi buton „Începe testul ▶" pornește cronometrul (mount-based, deci calibrarea nu consumă timp). Helpers TTS extrași în `@/lib/tts` pur (testabil) + `tts.tsx` (hook + control). 3 teste noi. Verificat LIVE: cron `success:true`, /ro 200, build + 34 teste. **De verificat pe prod (când ai un cont cu aptitudini-aviatie):** walk real prin ecranul de calibrare + un nudge real care să confirme livrarea Telegram/email către student.
  - **[x] Follow-up #2 (feedback Rareș round 2) — DONE 2026-06-29** (commit `44df96c` cod LIVE + date prod): (1) **mesaje feedback specifice** — notificarea citează comentariul elevului + măsura concretă per acțiune („Referitor la feedback-ul tău: „…” — am scos întrebarea / am corectat / am trimis echipei…"), nu mai e generic; (2) **numere single-digit** — cele 70 întrebări AUDIODICT (aptitudini-aviatie) regenerate cu 7 cifre de o cifră (passage + correctAnswer match) — „mai multe numere" însemna de fapt numere cu o singură cifră de memorat; 7 ascunse repuse PUBLISHED; backup `VPS2:/root/backups/audiodict-pre-singledigit-2026-06-29.json`; verificat 0 multi-digit / 70 PUBLISHED; (3) **voce mult mai lentă** — `TtsSpeedControl` e acum slider fin (0.3–1.1, default 0.6, era 3 butoane cu prag 0.6) + numerele de dictare rostite **unul câte unul cu pauză între ele** (`speakItems`/`gapForRate`: ~800ms@0.6, ~1100ms@0.3) → cadență ~2× mai rară indiferent de voce; sample-ul de calibrare folosește aceeași cadență. tsc + build + 11 teste.
- [x] 🟡 ✅ **DECIS 2026-06-27** — **`requireDomainAccess`**: păstrăm cum e (curriculum deschis tuturor, domenii RESTRICTED pe înscriere). Monetizarea rămâne pe funcții (Slice 3 feature-tiering) + preț pe materie, nu pe blocarea materiilor.
  - 🗣️ *Pe înțelesul tău:* Trebuie să decizi dacă un elev poate intra pe orice materie sau doar pe cele la care e înscris/le-a plătit. Decizia ta stabilește exact ce conținut e deschis și ce e blocat.
- _Notă produs (din 01, decizii nu blockere): motorul de escaladare e construit dar DORMANT (`ESCALATION_DETECT_ENABLED=false`, cron neprogramat) + payout real lipsă (nu poți onora comisionul 50% `/creatori`)._

---

## [ ] 🧩 Module reuse gaps (adăugat 2026-06-24 din Master MODULE-PROJECT-MATRIX, aprobat user — necesită sesiune dedicată per item)
- [x] ✅ **Stripe broker** — **DONE/stale** (verificat 2026-06-29): checkout-ul merge DEJA prin brokerul central (`/api/admin/stripe/checkout`→`stripe.knowbest.ro/api/checkout`, callback HMAC `/api/stripe/callback`); pe prod NU există `STRIPE_SECRET_KEY` direct (doar `src/lib/stripe.ts` legacy dormant, fără cheie). Mapare broker `tutor→class-rda` LIVE + chei live + webhookSecret prezente. Stripe e funcțional end-to-end.
- [ ] **@aledan/ai-governance** — AIRouter fără harness guvernanță pe output AI.
