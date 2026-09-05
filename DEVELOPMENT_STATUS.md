# Project Status - Tutor
Last Updated: 2026-09-05 (bariera public/privat pe materii + cod de acces — LIVE, verificată ca atacator pe producție)
<!-- anterior: 2026-09-03 (conținutul memento-ului Telegram reparat; incident 502 provocat de mine, remediat în ~4 min) -->
<!-- anterior: 2026-09-01 (treapta Telegram din cascadă -->
<!--  — sărită tăcut pentru TOȚI utilizatorii; reparată, deployată, verificată pe date de producție) -->

## Current State (Sesiunea 2026-09-05 — bariera public/privat pe materii + cod de acces; regim mesh + workflow-uri)

Cererea: (1) un comutator în Admin/SuperAdmin care decide dacă o materie (lecții + teste) e pentru
publicul larg sau nu — Aviația lui Rareș e cazul-test; (2) cursuri și teste generate de la zero
dintr-un prompt (dat: antrenor de agenți imobiliari, 8 module). Livrată prima jumătate, verificată
pe producție; a doua e decisă și planificată (vezi TODO).

**Ce s-a găsit** (recon: 6 exploratori + 6 sceptici în paralel; cele 3 scurgeri grave le-am citit
eu în cod înainte să le raportez):
- „Privat" nu era stocat nicăieri. Se deducea din forma slug-ului (`classifyDomainSlug === null`):
  chimie, biologie, istorie, geografie erau private din accident de denumire, iar cine avea voie la
  materiile restricționate era **un e-mail scris în cod** (`RESTRICTED_DOMAIN_ALLOWLIST`).
- Șase scurgeri reale: înregistrarea / activarea cu voucher / crearea copilului din invitație
  auto-înscriau în ORICE slug trimis (un anonim intra în `licenta-rares` cu un POST);
  `daily-challenge`, `bibliography`, `leaderboard` nu verificau nimic; `session/answer` încărca
  întrebarea doar după id și întorcea răspunsul corect + explicația pentru orice întrebare din bază.
- Itemul „#2 SECURITATE — domeniu Aviație vizibil fără acces" fusese marcat DONE (`6b5f58d`): reparase
  **listările**, nu rutele. Din 29 de rute `/api/[domain]/*`, 11 aveau o poartă.
- Producție: 16 materii, 4.179 întrebări, **0 lecții** (tabelul `Lesson` e gol; lista elevului citește
  `ContentSource`); Rareș = 2.379 din 2.418 răspunsuri totale.

**Ce s-a livrat** (`b51d528`, LIVE etutor.ro):
- `Domain.visibility` PUBLIC | PRIVATE, default PRIVATE. Migrarea 0051 face backfill PUBLIC pe exact
  cele 7 sluguri vizibile azi (verificat pe prod: 7 PUBLIC / 9 PRIVATE) — nimic nu s-a schimbat pentru
  nimeni în ziua livrării; chimie/biologie/istorie/geografie rămân private, dar acum e o decizie scrisă.
- `src/lib/domain-gate.ts` — `resolveDomainOrForbid`, **singura poartă**, pe toate cele 29 de rute
  (23 aplicate în paralel de 4 agenți pe grupuri disjuncte, 4 reviewers adversariali: 23 OK).
  404, nu 403, pe privat fără înscriere — invizibil înseamnă că nu confirmă nici că există. Înscrierea
  se re-citește din DB pe materiile private, ca revocarea să ia efect imediat (sesiunea e cache-uită 5 min).
- Admin: radio Private/Public în formularul materiei cu confirmare la trecerea spre public + rând în
  `AdminAuditLog` (`DOMAIN_VISIBILITY_CHANGE`); badge Public/Private în listă.
- **Cod de acces** (`Domain.joinCode`, migrarea 0052): adminul emite / rotește / retrage din formular
  (auditat), elevul îl introduce în Domenii → înscriere STUDENT. `POST /api/domains/join`; orice eșec = același 404.
- Allowlist-ul de e-mail a dispărut; `canUseLicenta` = admin sau `LICENTA_STUDENT_EMAIL`; Rareș păstrează
  totul prin cele 4 înscrieri active ale lui (verificat pe prod înainte de deploy).
- `PRIVATE_SLUGS` din feedback-review (a doua definiție paralelă a privatului) citește acum câmpul.

**Verificare**: tsc curat (rămâne eroarea pre-existentă din `reclassify-rule.test.ts`), lint 0 erori,
772/772 (+16: poartă cu prisma stub, regulă pură, cod de acces), `next build` local, backup
`/root/backups/tutor-pre-visibility-2026-09-05.dump`, deploy gardat (`.next` salvat, restart doar pe
build reușit). **Pe producție, ca atacator** — cont nou `leak-test-2026-09-05@tutor.app` (creds în
`Master/credentials/tutor-test-users.env`, și ca `JOURNEY_*` pentru audit): cererea de înregistrare cu
`aptitudini-aviatie` + `licenta-rares` a produs **doar** înscrierea la matematică; daily-challenge /
leaderboard / bibliography / progress pe privat → 404 identic byte-cu-byte cu un slug inexistent; POST
pe id-ul materiei private → 404; cod greșit → 404; catalogul fără nimic privat; **IDOR**: sesiune la
matematică + questionId din aviație → 404, întrebarea proprie → 200 cu răspuns. Materia publică = control 200.

**Decizii user** (AskUserQuestion ×7): curs static acum + antrenor conversațional în faza 2; bifă pe
materie; privat = invizibil complet; cursul de agenți: intern (REAL) → public după rodaj; backfill =
exact ce se vede azi; acces = admin înscrie + cod la nevoie; coloană vertebrală Curs → Modul → Lecție.

**Rămas** (în TODO): W4 coloana vertebrală; W5 generatorul din prompt; W6 cursul de agenți imobiliari;
faza 2 antrenorul conversațional. Follow-ups semnalate de reviewers, neatinse: `calendar/schedule` nu
validează `studentIds` (ține de workstream-ul D); `vouchers/redeem` n-are niciun apelant; banca de
simulări (`ExamPaper`) nu e legată de materie (subiectele oficiale sunt publice, deci nu scurge azi);
`Lesson.isPublished` e decorativ; `Domain.instructorEnabled` e câmp mort; 4 materii au 0 întrebări publicate.

## Lessons Learned (sesiunea 2026-09-05)
- L31 — „Închis" la nivel de listă nu înseamnă închis. Vezi `knowledge/lessons-learned.md`.

## Current State (Sesiunea 2026-09-03 — conținutul memento-ului + un 502 provocat de mine)

Rareș tot nu primea remindere utile, deși ele AJUNGEAU: treapta Telegram arunca textul propriu al
memento-ului și tipărea în loc un bloc englezesc de presiune — „64 sessions this week | 3-day streak
at risk | 6170 XP (Instructor) | 61 reminders sent" — construit pentru treapta WhatsApp plătită.
Push (treapta 1) folosea corect `title`/`message`; doar Telegram le ignora.

**Reparat** (`7d2bb75`): `buildTelegramReminderText` (pură, exportată) folosește copia memento-ului ca
push-ul + `encouragementFor(streak)` — o singură linie română, pozitivă, care **tace** pe serie ruptă
+ `buttonLabelFor` → „Începe sesiunea" când linkul chiar pornește una. 13 aserțiuni, probate prin
mutație. Suita 672 → 685. Verificat live: mesajul nou livrat lui Rareș, cu seria reală (4 zile).

**Corecție la propriul diagnostic**: blocul NU ajungea pe WhatsApp — acela trimite șablonul Meta
`study_reminder` în `ro`. Comentariul funcției era învechit, nu rutarea.

### 🔴 Incident: am pus producția pe 502 (~4 minute)
Am păstrat funcția moartă `@deprecated` „ca să nu pierdem interogarea". `tsc` trece, **eslint nu** →
`next build` a eșuat pe VPS, iar `pm2 restart` din același lanț a repornit peste un `.next` rupt.
`etutor.ro` → 502. Remediat prin ștergerea funcției (`906376a`); 200 + 0 restarturi instabile după.
Vezi **L29** — e **L26 repetată**, lecție scrisă de mine cu o sesiune înainte.

### Findings /review, toate trei reparate (`5cd4949`, `d4e0c76`)
1. **Tap-ul din Telegram nu confirma memento-ul** (medium) — `acknowledgedAt` rămânea null, deci
   cascada urca la treapta următoare chiar dacă elevul răspunsese pe canalul gratuit. Rută nouă
   `GET /api/escalation/ack?e=&to=` care confirmă + redirectează, fără JavaScript. `safeRedirectPath`
   respinge protocol-relativ (`//evil.com`), absolut și CR/LF — altfel devenea redirect deschis
   apelabil din orice mesaj Telegram.
2. **Builder-ul emitea HTML fără să escapeze** (low) — escaparea mutată înăuntru, lângă `<b>`.
3. **Aserțiune vidă scrisă de mine** (low) — `trimEnd()` ștergea exact ce căuta regexul.

Verificat pe producție cu date reale: butonul → `https://etutor.ro/api/escalation/ack?e=<id real>&to=…`;
`//evil.test` și `https://evil.test` → ambele `/dashboard`. Suita 685 → 695.

### 🔴 Al doilea incident, prins de verificarea live
Redirectul întorcea `https://localhost:3013/...` — `url.origin` în spatele nginx e originea INTERNĂ.
Butonul ar fi dus telefonul elevului nicăieri. Prins de un `curl -w '%{redirect_url}'` pe prod la
minute după deploy; nimic nu dădea eroare. Vezi **L30**.

## Lessons Learned (sesiunea 2026-09-03)
- **L30** — `url.origin` e originea internă în spatele unui proxy; un redirect pentru browserul
  utilizatorului se face cu `Location` RELATIV, iar clasa asta se prinde doar cu curl pe prod.
- **L29** — cod mort ținut „pentru orice eventualitate" pică `next build` pe lint; `tsc` nu te
  avertizează; iar un restart necondiționat de build transformă o eroare prinsă în avarie.

## Current State (Sesiunea 2026-09-01 — treapta Telegram nu se trimisese niciodată; regim mesh)

Sesiune pornită de la o reclamație a lui Rareș: „singura notificare e din email, deși știu că
am adăugat și Telegram". **1 commit (`341e685`), LIVE pe etutor.ro.**

### Ce era

Nu ținea de contul lui și nu ținea de configurare. **Treapta TELEGRAM din cascadă nu se
trimisese niciodată, pentru niciun utilizator, de când canalul a fost adăugat.**

Motorul citea comutatorul canalului după numele lui în litere mici, dintr-o hartă fără cheia
`telegram` (`engine.ts`):

    const channelKey = event.channel.toLowerCase() as keyof typeof channelMap;
    const channelMap = { push, whatsapp, sms, email, call };   // fara telegram
    if (!channelMap[channelKey]) { escalateToNextLevel(); return; }

`undefined` se citea ca „utilizatorul a dezactivat canalul", iar treapta era sărită **înainte**
de garda de livrabilitate. `NotificationPreference` chiar nu avea coloană `telegram`, deși
comentariul schemei promitea că on/off-ul stă pe booleene. Cast-ul `as keyof typeof` e ce a
ținut compilatorul tăcut.

**Invizibil prin construcție**: evenimentul se închidea oricum ca `COMPLETED`. Singurul semn
era `sentAt` NULL pe rândurile TELEGRAM — care arată la fel ca o sărire legitimă (cont gratuit
pe WhatsApp), deci nimic nu ieșea în evidență.

### Reparație (structurală, nu punctuală)

- `NotificationPreference.telegram` (aditiv, implicit `true`) — migrare `0049`.
- Garda mutată în `isChannelEnabled()` (`config.ts`), pură și **TOTALĂ** peste
  `EscalationChannel`: un canal adăugat în enum fără comutator devine **eroare de tip**, nu
  treaptă sărită în tăcere.
- Ambele endpointuri de preferințe acceptă `telegram` (canal gratuit → fără plafonare de plan,
  aceeași formă ca `call`), altfel coloana rămânea moartă.

### Verificat (nu presupus)

- **8 aserțiuni noi, probate prin mutație**: cu bug-ul original reintrodus, toate 8 pică.
  Suita **664 → 672**; `tsc --noEmit` 0.
- **Pe date de producție, cascada organică pornită de cron**, nu test manual:
  `14:15 · nivel 2 · TELEGRAM · sentAt=14:15`. Comparativ, lanțul de dimineață dinaintea
  fixului: TELEGRAM `sentAt` NULL → EMAIL trimis 07:45.
- Confirmare vizuală din captura lui Rareș: mesajul cascadei la 13:06 + proba la 13:10.
- `/review`: prima rulare a plecat pe **ollama** (interzis pentru clasa `review`) și a produs
  2 defecte inventate, verificate în cod ca false. Reluat forțat pe hosted → 0 probleme pe
  schimbare. Cele 3 constatări rămase sunt pe cod pre-existent, una greșită factual
  (`[]` e *truthy* în JS); lăsate, în afara scopului.

### De ce n-a fost prins ieri

Testul de ieri a folosit `telegramAlertToUser` — **altă funcție**. Cea pe care o cheamă
cascada (`sendTelegramNotification`) nu se executase niciodată cu succes. Vezi **L28**.

### Rest deschis (neatins azi)

Partea de bani a reducerii de 10% (cerere copil → aprobare părinte → aplicare pe abonament →
debitare pro-rata la trecerea pe WhatsApp): cardul o **promite** deja, dar nimic nu o acordă.
Plus memento zilnic către SuperAdmin pe coada de feedback + livrarea programată a raportului
către elev.

**Observație de teren**: Rareș are **12 memento-uri active**, multe la câteva minute unul de
altul (13:55, 14:00, 14:03, 14:15, 14:25, 14:30, 14:45, apoi 21:30-22:30). Arată a rămășițe
din testări. Decizie user 2026-09-01: **se lasă așa deocamdată.**

## Lessons Learned (sesiunea 2026-09-01)
- **L28** — o cale verificată nu spune nimic despre o cale vecină; plus: un cast care minte
  compilatorul poate ascunde o hartă incompletă, iar lipsa se citește ca „dezactivat".


## Current State (Sesiunea 2026-08-24/25 — programa parcursă, familie, review-fix; regim mesh)

Sesiune lungă, pe două zile calendaristice, în regim mesh (dev → /review → verificare REALĂ pe prod → commit → deploy). **11 commit-uri, toate LIVE pe etutor.ro.**

### Livrat

**1. AGT-018 — Google One Tap** (`64d3d7a`, `b13893d`). Hardening-ul CSP din `72765fc` scosese `accounts.google.com` din `style-src`, iar clientul GSI își aduce foaia de stil de acolo → funcția moartă + 2 erori de consolă pe FIECARE pagină. Reparat CSP + **scriptul terț mutat în spatele bannerului de cookie-uri** (nou `src/lib/cookie-consent.ts`, sursă unică pentru cheie/formă/eveniment; `parseStoredConsent` eșuează închis pe 14 intrări nefolosibile). Verificat pe tab curat: înainte de consimțământ **0 mesaje de consolă** (erau 2) + niciun script Google; după Accept scriptul pornește fără reîncărcare; după Respinge — nimic.

**2. Build-ul de producție era RUPT pe HEAD** (`05e832c`) — nu de mine: 3 directive `@ts-expect-error` fără descriere din commit-ul de referral de pe 23 aug. Deci motorul de referral fusese comis fără ca `next build` să fi trecut vreodată. Reparat + mock stale `passage` → `tsc --noEmit` iese acum 0.

**3. Poarta pe programa parcursă** (`e7bd2da`, `ba7ef46`, `456ade6`) — cerință user: elevul care intră în septembrie în clasa terminală primea grile din lecții nepredate.
- **Două rânduri în paralel** (decizie user): ● programa cu calendar (informativ, se mișcă săptămânal) + ☑ bifele elevului (COMANDĂ bazinul). Flow de inițiere obligatoriu înaintea oricărei sesiuni de Grile pe domeniile cu programă. Simulările rămân întregi.
- Date din documente oficiale: planificări Sigma cl. VII (36 săpt.) + VIII (35) pe OMEN 3393/2017; structura anului **multi-an** 2025-2026 (OM 3463) + 2026-2027 (OM 3.194/2026). Salvate în `~/Downloads/temp/tutor eval nat/programa-calendar/`.
- `scripts/curriculum-watch.mjs` — cron VPS2 **lunea 06:17** (`npx tsx`): amprente pe surse + topicuri din bancă neacoperite + an neconfigurat → notifică superadminii, NU modifică nimic.

**4. Atenționare la decalaj programă↔bife** (`a52f8ec`) — cerință user: peste 2 lecții diferență, primesc atenționare **elevul + părinții + meditatorii**, pe cascada existentă a alertelor de prag (in-app + PUSH→Telegram→email, quiet-hours), dedup per (destinatar, elev, bandă, săptămână). Cron **lunea 06:27**.

**5. Flux Părinte↔Copil↔Meditator — stratul curriculum** (`ebbd984`, `94a8cb3`). `?childId=` pe GET+PUT, acces din RELAȚIE (nu din înscrierea proprie), montat pe pagina copilului la părinte și pe fișa elevului la meditator. Decalajul vizibil permanent (badge + banner).

**6. Pachetul de reparații din review-ul adversarial** (`5c65c86`, `440af2e`) — 3 finderi paraleli + /review mesh: **17 constatări confirmate, 16 reparate**. Detalii în TODO_PERSISTENT.

### Configurație de test familie (date REALE, la cererea userului)
- Elev: **`raresdanciulescu9@`** (contul ACTIV — 8 sesiuni/116 răspunsuri în 7 zile; `2004@` e inactiv din 15 apr).
- Părinți: **Alex + Anto**, ambii `PARENT/active`. Antonia are WATCHER pe aptitudini-aviatie/aviatie-cunostinte/licenta-rares (oglindă a tatălui) + rolurile ei pe aviation.
- **Rămas**: confirmarea userului că amândoi părinții văd corect → apoi Alina ca meditator.

### Verificări pe producție (nu doar local)
15/15 poarta · 7/7 pachetul de fixuri (409 conflict real, interdicția schimbării clasei de meditator, 403 pe copil neînscris) · proveniența per rând dovedită în DB (1×INSTRUCTOR+actor, 27×SELF neatinse) · atenționarea declanșată la S16 simulat (lag=6, notificare în DB) + dedup 0 la a doua rulare · watch rulat live pe VPS.

### Incidente (ambele reparate în aceeași sesiune)
- **502 ~2 min pe prod**: am deployat sărind `npm install` → `prisma generate` n-a rulat → clientul Prisma nu știa `markedById` → build fail. Rețeta din DEPLOY_REGISTRY era corectă; scurtătura mea, nu.
- Cascada `/review` mesh pică pe payload mare (groq 413) → rulare per fișier.

## Lessons Learned (sesiunea 2026-08-24/25)
- **L476** — un API modern folosit într-o CONDIȚIE poate șterge tăcut o cerere întreagă
- **L477** — un resurse cu al doilea scriitor cere altă strategie de scriere, nu doar altă poartă
- **L478** — datele derivate declarate de mână trebuie verificate contra propriei derivări
- **L479** — auditează codul înainte de a crede propriul backlog

## Current State (Sesiunea 2026-07-28 — Batch B→H /pa audit, regim mesh autonom)

Continuare directă a Batch A (2026-07-12). Fiecare batch: dev → /review adversarial → tsc + `npm run build` gate → commit → push → deploy VPS2 → verificare live (curl + pm2 err). Toate deploy-urile confirmate cu OK explicit user înainte de execuție.

**Batch B (money-path) — LIVE, commit `68ee0b9` (migrație `0042`):**
- **B9** add-on per-copil: `User.paidExtraChildSeats` extinde locurile de copil pe **toate 3 căile** de adăugare (invite create/accept + direct create, sub advisory-lock) — nu se poate ocoli plata. Endpoint `/api/dashboard/family/addon-checkout` (broker `amount` custom, discount −20%/−30%). Callback grant/clamp idempotent, planul principal neatins la evenimente add-on.
- **B10** portal self-service: persist `stripeSubscriptionId`, rută `/api/stripe/portal` (broker `POST /api/portal`), buton pe `/dashboard/packages`.
- **Notă L21 confirmată în practică**: o sesiune Claude paralelă a deployat Batch B cât backup-ul DB rula în sesiunea curentă (commit ledger `cd593f2` nu al meu). Verificat post-fapt: VPS la `68ee0b9`, migrație aplicată, coloane prezente — nimic pierdut, istoria a rămas liniară.

**Batch C (funnel părinte, audit #11,13,14,15,16,17) — LIVE, commits `1c10f49`+`ca5e297`:**
- Sidebar: „🔒 Familia mea" pt cont neplătit → `/dashboard/packages`.
- 4× CTA `/parinte`+`/elev`+ParentFunnel → `/auth/register` (nu `/auth/signin`). **Prins prin verificare pe output real** (nu doar pe fișierele editate): al 3-lea CTA („Începe proba gratuită", `parent-funnel.tsx:155`) tot ducea la signin — fix separat, commit `ca5e297`.
- Clopoțel: alertele copilului (`audience=child`) afișate distinct (bandă amber) + badge combinat.
- „Cadență alerte" adăugat în nav părinte; pas „Adaugă copilul" în SetupChecklist; push-banner pornește și pt watcher-only.

**Batch D (viral copy, audit #12 decizie „drop") — LIVE, commit `7d95afa`:**
- `/scor`+`/duel`+`/certificat`: promisiunea „lipești orice text" scoasă; copy vinde quiz-pe-materie (ce oferă `/try` real).

**Batch E (i18n punctual + no-AI + GDPR) — LIVE, commit `7d95afa`:**
- `calendar.loading` key, landmine „AI-Powered" din hero, **sweep complet „AI"→„Automat"/„Auto"** pe tot adminul (enum DB `AI_GENERATED` neatins, doar label-ul), instructor domain dropdowns cuid→nume (`/api/dashboard/instructor` întoarce acum `domainOptions`), `/cookies` adăugat în footer landing.
- GDPR footer/legal-nav pe pagini persona: **deja livrat** în `d318f98` (cod înaintea auditului) — verificat live, nu re-făcut.

**Batch F (superadmin) — LIVE, commit `67f772e`:**
- Audit-log pe mutații plan+ad (CREATE/EDIT/TOGGLE/DELETE via `logAudit`, erau silențioase).
- Cardurile overview → clicabile spre sub-pagini + card nou „Comisioane de plată".
- `/dashboard/admin/superadmin/referrals` nou — vizibilitate read-only pe datoria de comisioane (PAYABLE/PENDING/PAID/VOID + top promotori). „Marchează plătit" **intenționat neconstruit** (mutație pe bani, cere review propriu).
- exam-bank etichetat „(vizualizare)" + empty-state onest (fără UI de import).

**Batch G (STRATEGY.md, doc-only) — commit `c02058b`:**
- v1.9→v2.0. FAZA 2 (Family/Watcher) + FAZA 7 (Mobile) ridicate la LIVE/depășesc specul (per `feedback-audit-no-cut-when-code-ahead`, nu s-a tăiat nimic). Pricing: sursa de adevăr = codul (per-compoziție-familie), sezonier+planuri meditator = deferate explicit. Tier 5 addendum (ingest-pdf/ExamPaper/campaign-attribution). Pivot Tier 0: demo paste-text NU se restaurează.

**Batch H (polish) — LIVE, commit `c02058b`:**
- Eye-toggle show/hide pe ambele câmpuri parolă din `/auth/reset-password` (regulă user).
- Sitemap: +6 pagini absente (`/preturi`,`/parinte`,`/elev`,`/creatori`,`/ghid-bac`,`/cookies`).

**AUDIT_GAPS.md sincronizat** (commit `774010b`): G-TU-FUNNEL/VIRAL/LEGAL/STRATEGY → Eliminated; G-TU-I18N/ADMIN → Partial (deferate documentate).

**Deferat explicit (sesiuni dedicate, motivat, nu uitat):**
- #22 mutația „marchează PLĂTIT" (money-state, review propriu).
- #20 ingest-book UI (feature mare), #6 metrici North-Star revenue.
- i18n sistemic (pagina practică, reset-password RO complet, assessment EN, admin surface) — auditul însuși l-a scopat separat.
- #18 assessment orphan wiring, §7 polish rămas (touch-targets, webhook Stripe legacy mort, pagina orfană `/watcher/[id]`, dedup import/import-book, gating aviation/seed-demo), §6 P3 mesagerie instructor WhatsApp/SMS false-promise.

Toate 82/82 pagini build verde la fiecare batch; tsc curat pe fișierele atinse (singura eroare pre-existentă, neatinsă: fixture `tests/unit/exam-engine.test.ts`).

## Lessons Learned (sesiunea 2026-07-28)
- **L26** — `next build`'s ESLint (`@typescript-eslint/no-unused-vars`) fails the production build on an unused route-handler param even when prefixed `_` (e.g. `_req: NextRequest`) — `tsc --noEmit` doesn't catch this (it's a lint rule, not a type error), so a route can pass the tsc gate and still fail `npm run build`. Fix: drop the param entirely (`async function _POST()`), don't just prefix it — `withErrorHandler`'s wrapper still forwards the real request via `...args`, so Next's runtime is unaffected.
- **L27** — `Prisma.InputJsonValue` rejects a plain `Record<string, unknown>` at the type level (TS can't resolve an indexed-signature object against the JSON union). For audit-log "what changed" metadata, pass a primitive/array instead (e.g. `Object.keys(data)`, a `string[]`) rather than the update-data object itself.

## Current State (Sesiunea 2026-07-12 #2 — audit /pa + True E2E [10], regim mesh)

**Audit COMPLET 7-persona** (vizitator/elev/părinte/meditator/admin/superadmin + cross-cutting E2E, 7 agenți paraleli read-only) → raport `Reports/AUDIT-PA-E2E-2026-07-12.md`. **Zero 404 + auth gating curat**, dar **10 × P0** (7 securitate + 3 money-path) + ~20 P1.

**Batch A — 7 P0 securitate → LIVE pe etutor.ro** (commit `1808362`, backup DB `/root/backups/tutor-pre-batchA-2026-07-12.dump`, deploy verificat: rute 401/307 nu 500, health 200):
- A1 ban enforcement (jwt→null = logout ≤5 min, verificat la sursă @auth/core@0.41.2) · A2 scos Impersonate mort · A3 scos rol Admin fals · A4 IDOR grupuri · A5 report scoping · A6 instructor QuestionList readOnly · A7 goals+sessions ownership.
- tsc 0 · /review adversarial 0 buguri · smoke live OK.

**Batch B (money-path) — pornit, NEdeployat:**
- **B8** (prețuri→checkout continuity) — DONE, commit `64188a0` pushed dar **NEdeployat** (merge cu B9/B10). `?plan=` preturi→register→packages highlight+scroll. tsc 0.
- **B9** (add-on per-copil) — decizie user: build Tutor-side (broker acceptă lineItem cu amount custom → **fără să ating broker-ul NO-TOUCH**). Necesită schemă+migrație+webhook+gating. Pass focusat separat.
- **B10** (portal/anulare) — persist `stripeSubscriptionId` + `/api/stripe/portal` + buton. Pass focusat separat.
- Decizii user: demo viral → **renunțăm** (fără showcase AI); reducere familie → **taxăm** (B9 add-on).

**Model reality descoperit (B9):** toate planurile familie au `maxChildren:1` → al 2-lea copil e **mereu add-on** (niciun plan de upgrade); părinte/meditator au upgrade real (Family→Duo/Trio).

## Lessons Learned (sesiunea 2026-07-12 #2)
- **L23 — Auth.js v5 (`@auth/core@0.41.2`): un `jwt` callback care întoarce `null` face `sessionStore.clean()` = șterge cookie-ul de sesiune = logout curat, single-point.** Verificat la sursă (`node_modules/@auth/core/lib/actions/session.js`: `if (token !== null) {...} else { sessionStore.clean() }`). Ideal pentru enforcement de ban fără a atinge fiecare guard — dar prinde efect doar la refresh-ul de token (≤5 min aici), nu instant.
- **L24 — Checkout-broker-ul (`stripe.knowbest.ro`) acceptă `lineItems` cu `amount` custom (major units).** Deci add-on-uri / prețuri dinamice se pot construi 100% pe partea consumatorului, fără să modifici broker-ul NO-TOUCH CRITIC. Confirmat în `src/app/api/admin/stripe/checkout/route.ts`.
- **L25 — Cross-tenant IDOR pattern recurent: `requireInstructor()` dovedește DOAR că apelantul e instructor undeva, NU că resursa `[id]` e a lui.** Orice rută `.../instructor/<resursă>/[id]` + orice ramură `type=group/domain` cu `targetId` din query trebuie scopată explicit la `createdById === userId || domainId ∈ instructorDomainIds || isSuperAdmin`. Găsite 5 astfel de găuri într-o singură sesiune.

## Current State (Sesiunea 2026-07-12 — Batch 3, regim mesh: dev → /review → build → verify → deploy)

**LIVE pe etutor.ro** (commit cod `cc66fde` + docs `936b728`, migrație `0041` aplicată):
- **F1 — cadența părintelui** pe `/watcher/setari`: Standard(30min) / La N ore / Zilnic la HH:MM / O singură alertă. Câmpuri `selfAlertMode/EveryH/At` pe `NotificationPreference` al părintelui; `shouldRenotifyParentMode` în step-4 din `runParentMonitoring`. Prima alertă rămâne imediată.
- **F2 — presetări + trepte copil**: chips Blând/Standard/Insistent + editor canal+minute pe cardul copilului. `NotificationPreference.escalationSteps Json?` pe rândul copilului; `resolveUserLadder` + `resolveUserGraceMs` în engine suprascriu ordinea ȘI grace-ul pe fereastră; null = default.
- Verificat: tsc app 0 · vitest 40+27 (22 pure noi) · build prod ✅ · /review adversarial 0 P0 (3 fix-uri aplicate) · migrate 0041 + backup DB · F1 round-trip LIVE (login real) · F2 rută+guard live (403/401) · L41 vecini 200.
- F2 write-path pe parent+child real NEexercitat pe prod (singurul guardian = contul real user) — acoperit de teste + infra comună cu F1.

## Lessons Learned (sesiunea 2026-07-12)
- **L22** — `next build` nu type-check testele neimportate, dar `npx tsc --noEmit` (include `**/*.ts`) da; un `prisma generate` proaspăt poate scoate la iveală o eroare pre-existentă de client stale care apare doar la tsc full (nu blochează deploy). + nota de design storage-location (setare globală rol → rândul propriu; nu tabel per-episod / join ambiguu).

## Rămas (queued, cerut de user — sesiune nouă)
- Audit COMPLET `/pa` (toate rolurile) + True E2E [10] pe tot scope-ul (fluxuri/butoane/meniuri/ergonomie, „vreau să vând app-ul" → proactiv, zero 404, fără manual), cod-actual vs STRATEGY.md → propunere+mockups → aprobare → TWG.
- Pre-existent (out-of-scope): fix mock `tests/unit/exam-engine.test.ts` (`passage: null` + eventual `tags: []`).
- Opțional user: template Meta „parent-alert" pt WhatsApp fiabil pe alerte părinte.

## Current State (Sesiunea 2026-06-25 #3 — mesh: family packages → feedback admin → WOW UX → bug-uri review)

Sesiune foarte mare, totul LIVE pe etutor.ro, verificat pe prod la fiecare pas.

### Done (LIVE)
1. **Pachete de familie — Fazele 0-4** (migrări `0035`+`0036`): model (`Guardian.relation`, `FamilyInvite`) + `src/lib/family.ts` (plan→locuri→funcții pure) + `src/lib/family-invite.ts` (invite email/WhatsApp/cod + accept token/cod + creează-copil-direct + scoatere + seat math). UI `/dashboard/family` + public `/family/accept/[token]` + `/family/join`. Seat strict (advisory-lock per familie — dovedit sub concurrency `Promise.all`) + CTA upgrade/add-on. **Leak fix**: meditator = WATCHER + `relation=TUTOR`, never INSTRUCTOR. `/review` adversarial ×2 → 2 bug-uri reale fixate (P1 IDOR `removeFamilyMember` + P2 mutare-rol la accept). True E2E [10]: integration 12/12 pe prod + journey 4 roluri + concurrency. Raport `Reports/TRUE-E2E-family-packages-2026-06-25.md`.
2. **Feedback admin** (cerere user): inbox bell separat de „Alerte" (`audience=self` + badge corect) + pagină `/dashboard/admin/feedback` (click pe fiecare 👎: întrebare+răspuns, problemă elev, decizie+justificare, proveniență pagină/secțiune/citat/link-document, **override**). Cron feedback confirmat funcțional (9/9 ale lui Rareș). Migrare `0036`. Doc-serve `GET /api/licenta/[id]/file`.
3. **WOW first-run UX (A1-A5 + B + C)**: A1 fundătură Quizzes → picker inline (enroll+auto-start), A2 amână banner install/notif până după ~5 răspunsuri (`src/lib/engagement.ts`), A3 chip „🔥 N la rând", A4 bară-jos mobil (gated STUDENT), A5 coachmark unic, B „Continuă cu încă o serie" (feed endless), C = pre-existent (`/try` answer-first + signup-to-save). Gamification deepening (foc progresiv + remarci adaptive) = **deferat per user**, în TODO.
4. **6 bug-uri din review user**: #2 leak domeniu Aviație închis la 3 surse (public/catalog/enroll); #5 demo arată acum explicație+sursă (citat curat); #3 „Ai uitat parola?" RO+vizibil; #4 tab „Grile"; #6 romgleză parțial (SessionResults+signin, sweep complet rămas); #1 Google Android = auth upgrade `next-auth beta.30→.31` + `@auth/core 0.41.2` (cauza reală din loguri: `iss missing`, intermitent) — login email+parolă verificat OK post-upgrade, Google de retestat pe Android de user.

### Rămas
- #6 sweep complet romgleză; #1 retest Google pe Android (user); Gamification deepening (deferat, prioritate mare).

### Commits live (origin/master): `dec353e` → `c96184a` (~25 commits)

## Current State (Sesiunea 2026-06-25 #2 — Direct/mesh: Licență proveniență + securitate)

### Done (LIVE pe etutor.ro, verificat pe prod la fiecare pas)
1. **Proveniență verificabilă pe grilele de Licență** (`1ccf78c` + `a51465b` + `b5b8fe1`). Problema: `topic="Secțiunea N"` = doar al N-lea fragment auto-tăiat din PDF (fără sens pt Rareș); citatul-sursă era stocat dar ascuns. Soluție: `scripts/backfill-licenta-provenance.mjs` re-citește `1. Fabulosos srl licenta final.pdf` pagină-cu-pagină, leagă fiecare grilă de pagina reală (match pe citat: cascadă full→prefix→approx) + setează `topic` la secțiunea reală (1.1/.../Bibliografie). **204/204 actualizate pe prod, 199 ancorate la pagină + secțiune, 0 mai au „Secțiunea N", 5 front-matter fără pagină.** Rareș vede DUPĂ răspuns: „📄 Citat din lucrare: «...»" + „Sursă: Lucrare de licență — pagina X · 1.2. ..." + referința **țesută și în textul Explicației**. Citatul expus DOAR pe `licenta-rares` (material propriu). Backup DB: `VPS2:/root/backups/tutor-pre-licenta-provenance-2026-06-25.dump`.
2. **🔒 SECURITY — fix leak quiz public** (`b5b8fe1`). `/api/public/practice/quiz` filtra doar după `subject`, fără verificare de domeniu → conținut restricționat (grile private licență Rareș + domenii aviație doar-Rareș) era citibil PUBLIC fără login (subiecte generice „Licență"/„Physics"/„Mathematics"). Acum servește DOAR domenii publice (curriculum). Verificat prod: `subject=Licență/Physics/Mathematics`→0; `Matematica cl. VIII` / `Matematică M1 — Bacalaureat`→5 (demo intact).
3. TODO sync: item Licență proveniență marcat `[x]` (commits inline); items 33-DRAFT + val nou Mate/Fizică adăugate (decizie user: amânate).

### Decizii produs (user, 2026-06-25 #2) pentru sesiunea dedicată următoare
- **Pachete de familie** — replicarea experienței 1P+1C la TOATE pachetele. Decizii luate: legare copil = email + cod + creare-directă + **canal WhatsApp** pt invitație; meditator = regim **Watcher**, vede DOAR copiii plătiți, poate fi în mai multe familii (containerizat); limite pachet = **blocare strictă + invitație upgrade**. Scenariu lipsă identificat: #8 (1 părinte + mai mulți copii + meditator) + #9 (elev singur). Vezi ST handoff `Master/reports/handoffs/ST-2026-06-25.md`.

### Lessons Learned (sesiunea 2026-06-25 #2)
- **L18** — endpoint public care servește `Question` după `subject` trebuie să excludă domeniile restricționate (subiectele NU sunt unice per domeniu → leak de conținut privat). Vezi `knowledge/lessons-learned.md` L18.

---

## Current State (Sesiunea 2026-06-25 — Direct/mesh: Watcher + canale + aptitudini Rareș)

### Done (LIVE pe etutor.ro, verificat pe prod la fiecare pas)
**Watcher / monitorizare părinte**
1. **Disciplină în gamification** (`570ebcb`) — bonus +15 XP la finalizare „la timp" (≤90 min de la reminder); streak schedule-aware; badge `late` + sumar Disciplină în tab Rezultate.
2. **Scos „dimineață/seară"** (`a1f2e03`) din sesiunile programate — afișează numele + ora reală.
3. **Rapoarte KPI programate** (`7fa4ae3`, migrare `0034`) — rapoarte zilnice/săptămânale (sesiuni/disciplină/puncte slabe/rezultate) la ziua+ora aleasă, pe canale, per copil/toți. Cron `runWatcherReports`. 7 teste.
4. **Mementouri manuale reparate** (`4c03d07`) — one-shot nu mai e blocat (doar seriile); `reminderImminent` forward-looking; nudge-targets per-episode; picker **multi-select**.
5. **Log „Mementouri trimise"** (`62b1e8a`) + **badge „📨 memento trimis"** pe episodul corelat (`a90017d`).

**Canale notificări (config shared infra, fără commit)**
6. **WhatsApp** wired la WABA partajat + template `study_reminder` ro APPROVED + test live livrat lui Rareș. **Email** cheie Resend partajată, `EMAIL_FROM="eTutor <noreply@techbiz.ae>"` (verificat), test primit. **Telegram** bot propriu @eTUTORro_Notifications_bot (Rareș trebuie să lege contul).

**Onboarding**
7. **Setup checklist în bara de sus** (`84ca8c9`+`6062e53`) platform-aware (install→notificări→Telegram, status live, detectare încercări + plan alternativ, pași opționali închidabili) + PWA in-app guidance (`1130776`).

**Aptitudini (abilități) reproiectate**
8. (`986917a`) #2 Memorare audio EN (7×2 cifre, ordine) · #3 Cub voce→fața finală (regulile pe fețe) · #4 Ceas analog 5min. Renderer + `ClockFace` SVG; re-seed 440.

**Aviație — Cunoștințe (domeniu nou)**
9. (`deb26bd`+`b1b7c59`+`18d6a36`) Matematică + Fizică (cap.1–9 fără 7), **283 grile EN** (val1 131 + val2 152 verificat cross-model). Fix unități subject-aware.

**Verificare retroactivă** (`7014780`)
10. Module-appropriate: Abilități=cod → 0/440 probleme; Aviație-Cunoștințe+Licență=AI cross-model → **33 pe DRAFT** (22+11), reversibil. PUBLISHED rămase: aviatie 261, licență 193, abilități 440.

### Blockers / user-action
- **Email branded** `notifications@etutor.ro` — verificare domeniu Resend (DNS Hostico); item în TODO. Acum trimite de pe techbiz.ae.
- **Telegram Rareș** — apasă „Conectează" (Setări → Notificări).
- **33 grile DRAFT** — listare/recuperare sau regenerare pe topicele afectate (la cerere).

## Lessons Learned (sesiunea 2026-06-25)
- **L16** — Verificare module-appropriate: NU AI-verifica generatoare deterministe/spațiale (cub) — LLM greșește spațial; folosește re-derivare în cod. AI cross-model doar pentru conținut generat de LLM.
- **L17** — La canale partajate (WABA) wiring-ul credențialelor NU e suficient: codul trimite template cu nume fix (`study_reminder`) care trebuie să existe+aprobat; „sărit" = transport neconfigurat (config/user-action), nu bug.

## Current State (Sesiunea 2026-06-13 — Direct/mesh: linkuri campanii Evaluare + BAC)

### Done (LIVE pe etutor.ro, verificat E2E pe prod)
1. **Link campanie Evaluarea Națională** (`e0f0cde` + fix `608a657`) — **https://etutor.ro/evaluare** → 307 `/ro/auth/register?exam=en&voucher=EVALUARE100` + cookie `NEXT_LOCALE=ro`. Voucher `EVALUARE100` (100%, nelimitat, fără expirare) creat în prod, auto-aplicat la signup → abonament activ 1 an + înscriere automată Română cl. VIII + Matematică cl. VIII (ambele pre-bifate). Register localizat complet RO (textele hardcodate EN: „Creează cont", „Nume", parole, ecran succes).
2. **Link campanie BAC** (`e7349d6`) — **https://etutor.ro/bac** → `/ro/auth/register?exam=bac&voucher=BAC2026FREE`. Voucher `BAC2026FREE` (100%, nelimitat) creat în prod. Preset 8 materii BAC filtrate (Română IX-XII pre-bifată — obligatorie; M1/M2/M3 + istorie/geo/bio/chimie selectabile per profil).
3. **Mecanism reutilizabil**: preset `CAMPAIGNS` în `src/app/[locale]/auth/register/page.tsx` (`slugs` + `preselect` opțional + banner RO); rute scurte în afara `[locale]` (`src/app/evaluare/route.ts` + `src/app/bac/route.ts`, origin canonic `AUTH_URL`); aplicare voucher la signup în `src/app/api/auth/register/route.ts` (100% redeem atomic + sub activ, gate pe ≥1 materie înscrisă; <100% rută la `/dashboard/activare?voucher=X`). Vouchere config via env `EVALUARE_VOUCHER`/`BAC_VOUCHER` (schimbabile fără redeploy) + override ad-hoc `?voucher=`.
4. **Referință la îndemână**: `LINKURI-CAMPANII.md` în rădăcina proiectului (`daa2606`).
5. **/review (high)**: 4 buguri reale fixate — signin ignora `callbackUrl` (flux voucher <100% mort), redeem fără gate de înscriere, discount raportat înșelător la race-loss, redirect care scurgea `localhost:3013` din nginx Host.

### Verificat E2E pe prod (conturi smoke create + șterse, usedCount decrementat)
- `/evaluare` + register cu EVALUARE100 → user activ până 2027 + 2 materii înscrise ✓
- `/bac` + register cu BAC2026FREE → user activ + materii bifate înscrise ✓
- Build 224/224 teste, vecini VPS2 (L41) toți 200.

### Incident rezolvat (vezi L240 Master)
- Primul deploy: build VPS picat pe `ai-router` bare import din `whatsapp/dist` (bombă latentă din 2026-06-10) → etutor.ro 502 ~3 min → fix symlink `/var/www/whatsapp/node_modules/ai-router → /var/www/AIRouter` → rebuild OK.

### RĂMAS / follow-up
- Niciun item blocant pe acest feature. Idei viitoare (NU cerute): tracking conversie pe campanii (UTM / per-voucher), variante voucher cu maxUses/expirare pentru limitarea bugetului de campanie.
- Items pre-existente Tutor neatinse: BAC M2/M3 grile+simulări, Faza B 12 simulări M1, UX tooltips /dashboard/practice, funnel re-engagement (Master TODO).

### Lessons Learned (sesiunea 2026-06-13)
- **L240** (în Master `knowledge/lessons-learned.md`) — shared-lib `dist` cu import bare al unui peer = bombă latentă pe primul rebuild al unui consumator VPS; peer-ul trebuie rezolvabil din node_modules-ul BIBLIOTECII, nu doar al consumatorului. Cross-ref L41/L93/L43.

---

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
