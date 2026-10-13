# Proba de 7 zile → pauză → plată → după plată — verificare cap-coadă (2026-10-13)

Pornit de la două capturi ale lui Alex de pe etutor.ro (13.10): (1) demo-ul de pe prima pagină afișa o întrebare despre
„figura alăturată” fără nicio figură; (2) panoul unui elev arăta contorul probei („6z 23:58”) și bannerul „mai ai 7 zile”,
dar fără buton de plată și fără vreo schimbare după cele 7 zile.

Verificat pe stiva QA (build de producție, bază locală, cutie poștală falsă, callback-urile brokerului Stripe semnate
cu HMAC), scripturile în `Reports/true-e2e-2026-10-05/` nu — în scratchpad; redate aici ca pași. Capturi: trimise lui
Alex în sesiune (nu se comit, ca la audit).

## 1. Figura lipsă din demo — cauză și reparație (cod gata, nelivrat)

**Cauza.** Ruta publică a demo-ului (`/api/public/practice/quiz`) nu citea coloana `imageUrl`, iar componenta demo-ului
(`SubjectQuizDemo`) nu afișa imagini — deși în sesiunile cu cont figura se vede (`question-renderer.tsx`). Grilele din
banca de examene au figurile extrase (`public/exam-figures/…`, 460 de fișiere; cea din captură este
`en-viii-2021-mate-model-2-s2-4.png`) și copierea lor în grile (`scripts/grile-from-exambank.mjs`) pune `figureUrl → imageUrl`.

**Reparația** (în acest commit):
- ruta publică întoarce `imageUrl`; demo-ul desenează figura pe card alb, și la întrebare, și pe ecranul de rezultat;
- o grilă care spune „figura alăturată / graficul de mai jos” dar n-are imagine **nu mai intră în demo**
  (`src/lib/demo-questions.ts`, 3 teste) — nu poate fi rezolvată fără desen.
- Verificat în browser (iPhone 13): figura apare în demo (687 px lățime naturală) și pe rezultat; grila-cub fără imagine e exclusă.

**De verificat pe prod după livrare** — dacă rândurile din `Question` au `imageUrl` gol (copierea s-a făcut poate înainte de
extragerea figurilor):
```sql
select count(*) from "Question" where "sourceReference" like 'exam-bank:%' and "imageUrl" is null
  and content ~* '(figur[ai]|desen(ul)?|graficul|schi[țt]a)\s+(al[ăa]turat|de mai (jos|sus))';
```
Dacă e > 0, completează-le **cu un UPDATE țintit**, NU rulând din nou `grile-from-exambank.mjs`: scriptul șterge și
recreează grilele din banca de examene, iar `Attempt.question` are `onDelete: Cascade` — **ar șterge istoricul elevilor
pe acele grile**.
```sql
update "Question" q set "imageUrl" = e."figureUrl" from "ExamItem" e
 where q."imageUrl" is null and e."figureUrl" is not null
   and q."sourceReference" like 'exam-bank:' || e.id || ' |%';
```

## 2. Fluxul probei — ce există și ce face (cu comutatorul PORNIT)

Logica e în `src/lib/access.ts` (pură) + `access-server.ts`, `access-gate.ts`, `plan-gate.ts`, `access-lifecycle.ts`,
`api/stripe/callback`. Toate verificate pe QA, pas cu pas:

| Pas | Ce se întâmplă | Verificat |
|---|---|---|
| Ziua 1, părinte | bara de sus cu contor + „−30%”, bannerul „Proba gratuită · mai ai 7 zile”, „Continuă cu Family · −30%”; `/api/plans`: 7 zile, oferta activă | ✓ |
| Ziua 1, copil cu părinte legat | fără contor, fără preț — bannerul și oferta sunt ale părintelui (UCPD: nu se vinde copilului) | ✓ (prin design) |
| Ziua 5 / 6 / 7 | mesaje către părinte: „Mai ai 3 zile”, „Ultimele 48 de ore” (−30% cât rămâi abonat, 34,86 în loc de 49,80), „se încheie mâine la 10:48”; bara devine galbenă/roșie | ✓ (4 e-mailuri în cutia falsă, 1 per etapă, fără dubluri la a doua rulare) |
| Ziua 8 | părinte: ecranul de pauză cu „Activează Family” 49,80 lei; copil: „Perioada de probă s-a încheiat”, progres estompat, „În pauză”; API-ul de învățare 403 `paused`; Setările/Abonamentul rămân deschise; mesajul „Contul e în pauză” | ✓ |
| Plata | callback `subscription.activated` → `active`, plan pe cont, rând în `Payment`; părintele fără contor, copilul deblocat (pachetul părintelui), API 200; Pachete: „Ai un pachet activ” + „Gestionează abonamentul” | ✓ |
| Reînnoire eșuată | `subscription.payment_failed` → `past_due` + 14 zile de grație (accesul rămâne, Pachete: „Actualizează cardul”); după cele 14 zile → pauză din nou | ✓ |
| Anulare | `subscription.canceled` → `canceled`, data de sfârșit = acum → părinte și copil în pauză; poate alege iar un pachet; o încasare întârziată după anulare nu redeschide accesul | ✓ |

Testele unitare existente acoperă regulile: `access.test.ts`, `access-lifecycle.test.ts`, `free-trial.test.ts`,
`card-subscription.test.ts`, `access-paths.test.ts`. vitest **1.411/1.411** (3 teste noi).

## 3. De ce pe etutor.ro nu se vede nicio diferență după 7 zile

**Comutatorul `accessTrial` e OPRIT pe prod** (decizia din 16.09 nu s-a aplicat încă; TODO rândurile 49 și 151–155;
raportul True E2E 05.10 §0 scurgerea 9 și §6 pasul 14). Cu el oprit, verificat pe QA identic:
- contorul și bannerul se văd în primele 7 zile (bannerul elevului spune „rămâi pe varianta gratuită” — exact ce arată
  captura lui Alex);
- în ziua 8 **nu se întâmplă nimic**: fără pauză, fără mesaj către părinte, exersatul continuă; se închid doar cele 4
  funcții de pachet (simulări, lecții, calendar, progres avansat — `plan-features.ts`) și canalele WhatsApp/SMS;
- cron-ul nu trimite niciun mesaj de probă (`ran:false`).

**Contorul fără buton de plată din captura (2)** e prin design (Alex, 28.09): „Jeeeeeee” e un cont de elev făcut singur;
elevului nu i se arată preț, −30% sau link spre pachete. Părintele primește toate trei (captura 01).

**Decizia care deblochează tot fluxul (Alex):** pornirea comutatorului din Administrare → Utilizatori („Pornește proba
și pauza”). Înainte: marchează conturile de test/prieteni „Gratuit permanent” (`GET /api/admin/access-trial` dă numărul
conturilor fără plată care ar intra în probă); conturile existente primesc 7 zile de la pornire; mesajele către
părinți pornesc de la sine (cron `*/15`). Alternativa: scoaterea promisiunii „7 zile” din pagini.

## 4. Lipsuri găsite (de decis / de făcut)

1. **După plată nu există evidența lunii: nici data următoarei plăți, nici zilele rămase.** `/api/plans` nu are nicio
   cheie de perioadă; pagina Pachete spune doar „Ai un pachet activ” + „Gestionează abonamentul” (portalul Stripe).
   Cauza: brokerul (`stripe-module`, `admin/src/app/api/stripe/webhook/[companySlug]/route.ts`) nu trimite
   `current_period_end` în callback (îl are — `src/server/subscriptions.ts:170–173` îl calculează pentru registrul lui).
   Propunere (Lego comun → propose-confirm): brokerul adaugă `currentPeriodEnd`, `cancelAtPeriodEnd` și `trialEnd` la
   `subscription.activated/renewed`; Tutor le ține pe `User` (`subscriptionPeriodEnd`, migrare doar-adaugă) și arată
   pe Pachete „Următoarea plată: 20 noiembrie · 34,86 lei” / „Accesul se încheie pe …” la anulare la sfârșit de perioadă,
   plus în bara de sus în ultimele 3 zile când plata e în reîncercare.
2. **Brokerul anunță mereu `active` la activare**, chiar dacă abonamentul Stripe e în perioada de probă cu card
   (`subscriptionStatus = 'active'` fix, rândul 124). Tutor n-ar putea arăta niciodată „Ești în perioada de probă” pe
   Pachete (`currentTrial`), iar prima încasare reală la sfârșitul probei vine ca `subscription.renewed` (merge, dar
   părintele vede „Ai un pachet activ” din prima zi, fără să știe când e prima plată). Se rezolvă cu punctul 1.
3. Bannerul părintelui din probă nu spune ce se întâmplă la final („contul intră în pauză”) — doar al elevului o spune.
   O propoziție în plus în `TrialBanner` pentru `audience="parent"` când comutatorul e pornit.
4. Adresele `.test`/`example.com` nu primesc mesajele probei (prin design, `resolveIsTest`). De știut la testarea pe prod:
   conturile de probă ale lui Alex trebuie să aibă adrese reale ca să vadă mesajele.
5. `/dashboard/packages?plan=FAMILY` din e-mailuri e fără limbă — serverul redirecționează la `/ro/…` (307), merge.

## 5. Starea codului

- Reparația figurii: `src/app/api/public/practice/quiz/route.ts`, `src/components/SubjectQuizDemo.tsx`,
  `src/lib/demo-questions.ts` + test. tsc, eslint, vitest curate. Build de producție verificat pe QA.
- **Nelivrat**: pe etutor.ro sunt încă `10543f7` (01.10); așteaptă livrarea lotului 1 (`8ed92ce`) + a acestui commit.
