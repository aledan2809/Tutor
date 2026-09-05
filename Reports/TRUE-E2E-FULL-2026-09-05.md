# True E2E Full Audit [10] — Tutor — 2026-09-05

**Declanșator**: livrarea din aceeași zi — bariera public/privat pe materii + codul de acces
(`b51d528`). Auditul a fost cerut explicit după livrare, ca s-o verifice.

**Prod**: `https://etutor.ro` (VPS2, PM2 `tutor`, PG local). HEAD la finalul auditului: `483427f`.

---

## Verdict pe scurt

Bariera livrată dimineața **ține** — verificată ca atacator, nu din cod: un cont nou care cere
explicit materiile private la înregistrare primește doar materia publică; toate rutele materiilor
private răspund 404 **identic octet-cu-octet** cu un slug inexistent; catalogul nu le listează;
IDOR-ul pe `session/answer` e închis.

Auditul a găsit însă **o gaură reală în ea, pe care propria mea verificare de dimineață o ratase**:
un cont cu rol ADMIN pe o materie citea conținutul materiilor private străine (200 pe
`/api/licenta-rares/progress`, `/aptitudini-aviatie/leaderboard`, `/bibliography`) și le vedea în
catalog. Reparată și verificată live (`70534c5`). Plus încă șase constatări din `/review`, toate
reparate și verificate (`483427f`) — între ele, **cheia de acces era vizibilă oricărui admin de
materie**, nu doar superadminului.

Scor audit de cod: **95/100** (același ca la rularea din 15 august, 0 critice, 0 high).
Tester-Gateway: **PASSED**, 0 P0 — după ce am reparat un fals pozitiv P0 vechi de două audituri.

---

## Matrice scope-vs-executat

| # | Fază | Stare | Artefact |
|---|---|---|---|
| 0 | `/review` (efort înalt: 10 unghiuri, 61 candidați, 39 după dedup) | **DONE** — 8 verificate de agenți + 31 triate de mine; 7 reale reparate | `70534c5`, `483427f` |
| 1 | Prerechizite (conturi, roluri, fixture) | **DONE** — 3 din 6 conturi aveau parole moarte (blocajul din 15 aug), resetate; legătură părinte→copil creată | `credentials/tutor-test-users.env` |
| 2 | [7] E2E CODE audit | **DONE** — 95/100, 11 plugin-uri, 0 critice/high | `Reports/AUDIT_E2E_2026-09-05.md` |
| 3 | [8] Journey audit | **DONE** — 4 roluri × 19 pagini, 18 OK + 1 HAS_ERRORS (același pe toate) | `journey-audit-results/tutor-{STUDENT,INSTRUCTOR,WATCHER,SUPERADMIN}/` |
| 4 | TRWG-GW (Tester-Gateway) | **DONE** — PASSED, 0 P0 (după fix config) | `Tester-Gateway/reports/tutor/2026-09-05T12-15-*/` |
| 5 | TWG loop | **N/A(fără P0/P1 de buclat)** — cele 7 defecte reale au fost reparate direct în sesiune, cu verificare live. Per L340 bucla oricum n-ar fi produs semnal real dintr-o sesiune interactivă. | — |
| 6 | Scenarii de flux (E1-E17 + B1-B3 + V1-V2) | **DONE** — 5 roluri în paralel, 40 scenarii | mai jos |
| 7 | Concurență (F1, F2) | **DONE** — PASS | mai jos |
| 8 | Browser real G1-G5 | **DONE** — journey per rol + mobil (3 dispozitive prin plugin) | idem faza 3 |
| 8b | Persona-walk | **N/A(not requested)** — fără `--persona` | — |
| 9 | Paritate + stress | **DONE parțial** — load-tester 100/100; paritate demo/prod **N/A(nu există mediu demo)** | `AUDIT_E2E_2026-09-05.md` |

**Completare literală**: 9 faze DONE (una parțial) · 2 N/A cu motiv · 0 FAILED · 0 BLOCKED.
La 15 august, 3 faze erau BLOCKED. Toate trei sunt acum deblocate.

---

## Defectele reale găsite ȘI reparate în această sesiune

### 1. 🔴 Un admin de materie vedea materiile private străine — `70534c5`
Găsit de scenariul rolului ADMIN. `test_admin` (ADMIN pe `aviation`, nu superadmin):
`GET /api/licenta-rares/progress` → **200**, `/aptitudini-aviatie/leaderboard` → **200**,
`/licenta-rares/bibliography` → **200**, iar catalogul lista materiile private.

Cauza: `canSeePrivateDomains` moștenise „orice înscriere cu rol ADMIN = admin global" din vechiul
`canSeeRestrictedDomains`. Nu era regresie — dar contrazicea direct promisiunea „privat = invizibil"
pe care o livrasem cu trei ore înainte. Un admin al lui X e admin al lui X; ajunge în Y ca oricine,
printr-o înscriere în Y.

**Verificat live după deploy**: aceleași trei rute → 404; materia proprie → 200; catalog fără privat.

### 2. 🟠 Cheia de acces era vizibilă oricărui admin de materie — `483427f`
`/dashboard/admin` admite orice înscriere cu rol ADMIN, iar ambele pagini de materii serializau
rândul complet `Domain` — inclusiv `joinCode` — în props-urile componentei client. Adminul materiei
X putea citi cheia materiei private Y și se putea înscrie cu ea.

**Verificat live** cu o materie de test și un cod real emis: superadminul vede codul în pagină
(1 potrivire), adminul de materie **nu** (0 potriviri), iar `POST .../join-code` → **403** pentru el.

### 3. 🟠 Ultima suprafață publică rămasă pe regula veche — `483427f`
`/api/public/practice/subjects` (dropdown-ul de pe prima pagină, fără cont) decidea „public" tot
după forma slug-ului. Azi coincide cu adevărul, dar o materie numită `fizica-ix-xii` marcată privată
și-ar fi expus subiectele. Acum filtrează pe `visibility`; `classifyDomainSlug` rămâne doar la
gruparea pe nivel de examen, treaba lui reală.

### 4-7. Restul, din `/review` — `483427f`
- **Ordinea 400/404** la auto-înscriere: `400 "Domain is not active"` răspundea înaintea 404-ului de
  vizibilitate, deci o materie privată **și oprită** își confirma existența.
- **Dublu-submit pe cod**: `findUnique` + `create` lovea constrângerea unică → P2002 → 500, pe care
  UI-ul îl afișa drept „Codul nu e valid" — exact opusul a ce se întâmplase.
- **Materie oprită listată în `enrolled`**: card care nu duce nicăieri (toate rutele ei dau 404).
- **`/dashboard/progress` pornea hardcodat pe `aviation`** — materie acum privată: un elev neînscris
  deschidea pagina direct într-un 404 (înainte ruta n-avea poartă și răspundea 200 gol).

---

## Bariera, verificată ca atacator (nu din cod)

Cont nou `leak-test-2026-09-05@tutor.app`, creat prin înregistrarea publică **cerând explicit**
`aptitudini-aviatie` + `licenta-rares` + `matematica-v-viii`:

| Ce | Rezultat |
|---|---|
| Înscrierile primite | **doar** `matematica-v-viii` — cele două private, ignorate tăcut |
| `daily-challenge`, `leaderboard`, `bibliography`, `progress` pe privat | 404, **corp identic octet-cu-octet** cu un slug inexistent |
| `POST /api/student/domains/<id privat>` | 404 |
| `POST /api/domains/join` cod greșit | 404 |
| Catalog `available` | zero materii private |
| **IDOR**: sesiune la matematică + `questionId` din aviație | **404** (înainte: 200 cu `correctAnswer` + `explanation`) |
| Control: întrebarea proprie, aceeași sesiune | 200 cu răspuns |

**Ciclul complet al comutatorului** (rolul SUPERADMIN, 9 pași, toți PASS): materie nouă → implicit
PRIVATE → invizibilă elevului și publicului → cod emis → elevul se înscrie cu el → `alreadyEnrolled`
la a doua folosire → PUBLIC → apare în `/api/domains/public` → PRIVATE la loc → codul retras →
codul vechi nu mai merge → audit log cu `DOMAIN_VISIBILITY_CHANGE` ×2 + `ROTATE` + `CLEAR` → ștergere.
Verificat și pe DB: exact aceste 4 rânduri de audit în ultimele 3 ore.

---

## Scenarii pe roluri (5 conturi, 40 scenarii)

| Rol | Rezultat | Nereușite |
|---|---|---|
| STUDENT | 11 PASS, 1 PARTIAL | E2: `exam/start` → 403 plan-gate (cont pe plan gratuit) — comportament documentat |
| INSTRUCTOR | 7 PASS | — |
| ADMIN | 4 PASS, 1 PARTIAL, **1 FAIL** | FAIL = defectul #1 de mai sus, reparat |
| WATCHER | 4 PASS, 1 PARTIAL, 1 BLOCKED | BLOCKED = nudge-ul trimite notificări reale copilului, deliberat neapelat |
| SUPERADMIN | 12 PASS | — |

**Concurență**: două conturi pornesc sesiuni simultan pe materii diferite → `sessionId` distincte,
ambele 200, ambele închise curat (F1). Instructor + elev citesc progresul în paralel → consistent (F2).

**Curățenie**: toate datele de test create au fost șterse (grup, materie, întrebări, înscrieri).
Verificat pe DB la final: 0 rânduri rămase cu prefixul `e2e-2026-09-05-`.

---

## Constatare din afara barierei: textele legale EN sunt ale altui produs

`https://etutor.ro/en/terms` și `/en/privacy` servesc termenii lui **4pro-eat**: „AI-assisted food
logging", „nutritional analysis", „body weight and composition goals", „Health and Nutrition Data
(Art. 9 GDPR)". Nimic din asta nu există în eTutor. **Versiunea RO e corectă** — doar EN e greșită.

Sursa nu e Tutor: `GET https://legal.knowbest.ro/api/v1/public/legal/tutor/tos?locale=en` întoarce
deja textul greșit (9 potriviri „nutri/food"; `?locale=ro` → 0). Tutor doar randează ce primește.
Se repară în **Legal Hub** (NO-TOUCH CRITIC → propose-confirm-apply): o versiune EN nouă pentru TOS
+ PRIVACY ale app-ului `tutor`. → `G-TUT-LEGAL-EN-001`.

Colateral de decis cu consilierul juridic: ambele locale cer „18 ani sau peste" pe o platformă
folosită de elevi de clasa a VIII-a; textul RO acoperă 16-18 cu acordul părintelui, sub 16 deloc.

---

## Zgomot de unealtă — de ignorat, nu de reparat

- **`GET /api/aviation/curriculum` → 404** (singurul P1 rămas la Tester-Gateway): e
  `{"error":"Domain has no curriculum band"}` — aviația n-are programă școlară, prin definiție.
  Nu e poarta (aceea răspunde `Domain not found`). Control: `matematica-v-viii/curriculum` → 200.
- **Fals pozitiv P0 reparat în unealtă**: fluxul `student-practice-session` cerea textul „Quiz" pe
  pagina `/ro/`, care randează „Grile". A picat astfel în auditurile din 15 august **și** azi, de
  fiecare dată raportat drept „fluxul central al produsului e rupt". Corectat în
  `Tester-Gateway/apps/tutor.json` (`18114d3`) — captura arată pagina funcționând perfect.
- **`/api/public/practice/subjects` → 429**: limita de trafic, de la rulările mele paralele de pe
  același IP. Dispărut la re-rulare.
- **a11y `/` și `/dashboard` neschimate**: CSP-ul strict blochează injectarea scriptului axe.
  Aceeași limitare ca în august.
- **`/en/terms` HAS_ERRORS** în journey: marcatorul e cuvântul „error" din textul legal, nu o eroare.
  (Dar pagina chiar e greșită — din alt motiv, vezi mai sus.)

---

## Ce rămâne deschis (în `AUDIT_GAPS.md`)

| Gap | Prioritate | Ce e |
|---|---|---|
| `G-TUT-LEGAL-EN-001` | P1 | Termenii EN sunt ai altui produs — se repară în Legal Hub |
| `G-TUT-FEEDBACK-PRIVATE-WIDENED-001` | P1 (decizie) | „Materialul propriu se editează automat" s-a lărgit de la 2 la 9 materii odată cu unificarea definiției privatului |
| `G-TUT-JOINCODE-REACTIVATE-001` | P2 | Codul reactivează o înscriere veche **cu rolurile ei** — un ADMIN revocat și-l recapătă cu un cod de elev |
| `G-TUT-JOINCODE-LIFECYCLE-001` | P2 | Codul n-are expirare, limită de utilizări, audit la folosire — relevant înainte de a-l da agenților REAL |
| `G-TUT-GATE-COVERAGE-001` | P2 | Nimic nu împiedică o rută nouă `/api/[domain]/*` să uite poarta — lipsește testul care enumeră rutele |
| `G-TUT-ADMIN-QUESTIONS-001` | P2 | Trei politici de acces pe aceeași resursă; un ADMIN de materie vede panoul dar nu poate crea întrebări |
| `G-TUT-DOMAIN-INACTIVE-001` | P3 | Comutarea `isActive` nu se auditează (doar `visibility`) |

---

## Artefacte

| Ce | Unde |
|---|---|
| Audit CODE [7] | `Reports/AUDIT_E2E_2026-09-05.md` |
| Journey [8], 4 roluri | `journey-audit-results/tutor-{STUDENT,INSTRUCTOR,WATCHER,SUPERADMIN}/` |
| Tester-Gateway | `Tester-Gateway/reports/tutor/2026-09-05T12-15-03-829Z/` |
| Copie de siguranță DB (pre-migrare) | `VPS2:/root/backups/tutor-pre-visibility-2026-09-05.dump` |
| Conturi de test pe rol | `Master/credentials/tutor-test-users.env` |
| Commit-uri | `b51d528` (bariera) · `70534c5` (admin scope) · `483427f` (6 fixuri) · `18114d3` (unealtă) |
