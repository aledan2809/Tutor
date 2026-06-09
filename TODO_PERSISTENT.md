# TODO Persistent — Tutor

> Citit la FIECARE sesiune. Items rămân până marcate `[x]` cu dată + commit.

---

## [~] 🎓 BAC — Limba și literatura română (campanie import, creat 2026-06-09)

**Materiale**: `~/Downloads/Temp/BAC-RO/` — 13 perechi oficiale `E_a_romana_real_tehn_<an>_var_<x>` (subiect) + `bar_<x>` (barem), proba E.a, filiera reală/tehnologică (CNPEE, public). 2023×3 (var 01/05/06), 2024×5 (var 02/04/09/model/simulare), 2025×5 (var 06/07/08/model/simulare). (`var_09 (1)` = duplicat, se ignoră.)

**Structură BAC RO** (≠ EN VIII): `examType="BAC"`, grade 12, timeLimit 180. Subiectul I (50p) = 1 text + A (5 itemi comprehensiune, 30p) + B (text argumentativ ≥150 cuv, 20p); Subiectul al II-lea (10p) = comentariu text liric (poemul embed în content); Subiectul al III-lea (30p) = eseu (text studiat). **Toți itemii OPEN/SHORT — ZERO MCQ** → self-score pe barem; **nu produc grile MCQ** (doar Simulări). 90+10 oficiu=100. Script per lucrare: `scripts/import-exam-ro-bac-<an>-<variant>.mjs` (template din `import-exam-ro-2025-model.mjs`).

**Infra (DONE 2026-06-09, commit `53a7665`)**: lista exam-bank (`/dashboard/exam-bank`) **grupată pe nivel** (Evaluarea Națională cl. VIII vs Bacalaureat IX–XII) ca să nu se amestece audiențele. Backup prod pre-campanie: `/root/backups/tutor-pre-bac-2026-06-09.dump`.

**Queue (1/13 DONE)**:
- [x] **2025 Model** — DONE 2026-06-09 (`53a7665`): text jurnal Puia Florica Rebreanu + 8 itemi (A.1-A.5 + B + II Vlahuță „Sonet" + III eseu Sadoveanu). Verificat autentificat: listă grupată (secțiunea Bacalaureat) + take page randează passage+poem+itemi. ExamPaper 53→54.
- [ ] 2025: simulare, var_06, var_07, var_08
- [ ] 2024: model, simulare, var_02, var_04, var_09
- [ ] 2023: var_01, var_05, var_06

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

## [ ] 🧩 MagicQuiz text-generator — orfan după ce `/try` a devenit demo real (creat 2026-06-03)

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
- [ ] Apoi: **Istorie / Geografie / Biologie / Chimie / Fizică de liceu (IX-XII)**.

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

## [ ] 🧭 Restructurare meniuri elev/părinte/meditator — ascunde item-urile fără conținut (creat 2026-06-04, deferred → sesiune nouă)

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

## [ ] 🔔 Setări → Notificări — pachet + delegare (NU în meniul Notificări) — creat 2026-06-04

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
