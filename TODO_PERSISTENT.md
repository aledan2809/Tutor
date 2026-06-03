# TODO Persistent — Tutor

> Citit la FIECARE sesiune. Items rămân până marcate `[x]` cu dată + commit.

---

## [ ] 🏠 Homepage — secțiunea „De ce aleg etutor.ro" + nav links (creat 2026-06-03)

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

## [ ] 🔗 Faza B finish — linkuri nav către „Pentru părinți" (/parinte) + „Pentru elevi" (/elev) (creat 2026-06-03)

Paginile sunt LIVE (200) și se leagă între ele, dar **nu-s în meniul de sus** (nav are doar Demo / Grile pe materie / Pentru profesori / Autentificare). Adaugă în header „Pentru părinți" + „Pentru elevi". Un singur loc de editat (header/nav din `page.tsx` + eventual componenta de nav partajată).

---

## [ ] 🐛 Opțiuni cu literă dublată („A. a) …") + normalizare date publicate (creat 2026-06-03)

**Confirmat live** (cele 181 grile Matematica publicate azi). Opțiunile sunt stocate CU prefix de literă inclus — `["a) 10 exerciții", "b) 15 exerciții", …]` — iar AMBELE randere mai adaugă o literă:
- elev: `src/components/session/question-renderer.tsx` → `A.` + `opt.label` = **„A. a) 10 exerciții"**
- admin: `src/components/admin/review-queue.tsx` → `a)` + opt = **„a) a) …"**
`correctAnswer` e și el cu prefix („c) 16.66 exerciții").

**Fix (date + sursă):**
1. Normalizare date: strip `^[a-dA-D][).]\s*` din fiecare `options[i]` ȘI din `correctAnswer`, consistent (ca să NU rupi matching-ul răspuns↔opțiune). Migrare one-shot pe toate publicate + drafts.
2. Fix la sursă (generator/parser în pipeline) — grilele noi să NU mai stocheze prefixul; litera o pun randerele.
3. Verifică după migrare: elev vede „A. 10 exerciții" (o literă), matching + barem corecte.

**Igienă găsită (DEFERRED — domain-level, nu bundle în item 1):** cele două denumiri NU sunt duplicate — **„Matematica" (355)** e domeniul principal *Matematica*, iar **„Matematică" (9)** sunt în domeniul *Aviation* (mate de aviație, separat legitim). Singurul punct cosmetic: domeniul principal e scris fără diacritică („Matematica"). Redenumire corectă „Matematica"→„Matematică" = schimbare la nivel de **domeniu** (atinge `name` + `slug` + URL-uri) → sesiune separată, nu acum.

## [ ] 📚 Capacitate (clasa a VIII-a) — Română + Matematică consolidate V-VIII (pentru SESIUNEA URMĂTOARE, creat 2026-06-03)

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

## [ ] 🏆 Simulări Capacitate — „exam-bank" tier (100% ground-truth) (creat 2026-06-03)

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
- [ ] (2) **sistem comisioane + Stripe Connect** (faza 4 din plan — atribuire conținut→creator, tracking consum, calcul lunar, payouts). Sesiune dedicată mare.
- [x] (3) **campanie recrutare pe materii** — LANSAT 2026-05-27 (MA commit `e8a0f3d`): campanie `tutor-creatori-recrutare` în MA → TeInformez, 6 postări FB săptămânale (5 iun → 10 iul) idee-întâi → `etutor.ro/ro/creatori` + CAS InFeed. 3 programate pe FB, 3 amânate (fereastra 29z) auto-programate prin cron `tutor-creatori-reschedule.sh` (06:23). LinkedIn (educatori) rămâne manual.
- [ ] migrare `etutor.ro` (vezi plan) — Faza 1 user, restul eu.

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

## [ ] Fix AGT-001 — PATCH handler on admin/questions/[id]

Add `export const PATCH` to `src/app/api/admin/questions/[id]/route.ts` for partial updates.

---

## [ ] Fix AGT-003 — Calendar page empty

Configure Google Calendar OAuth env vars on VPS2 OR add "Connect Google Calendar" CTA with clear explanation.

---

## [ ] Fix AGT-004 — Seed aviation bibliography

Run POST /api/admin/bibliography to add items for aviation domain.

---

## [ ] WG Fixes — a11y 55/100 + mobile-tester 75/100

Use Website Guru (`POST guru.techbiz.ae/api/fix`) to fix AGT-008 (a11y) + AGT-009 (mobile touch targets).

---

## Session Log

| Date | Change |
|------|--------|
| 2026-05-11 | Created. E2E [9] done (CODE 89/100, Journey 17/17 OK). Sidebar focus trap + touch targets + contrast + dangerouslySetInnerHTML + cookie Secure flag fixed. |
| 2026-05-11 | True Full E2E [10] COMPLETE. 31/35 PASS (89%). Bugs: AGT-001 (PATCH 405), AGT-002 (Settings blank), AGT-003 (Calendar empty), AGT-004 (bibliography empty), AGT-007/009 (mobile touch targets). Reports/TRUE-E2E-FULL-2026-05-11.md + AUDIT_GAPS.md created. |
