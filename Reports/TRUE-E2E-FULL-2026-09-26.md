# True E2E Full Audit [10] — Tutor — 2026-09-26

**Cerere**: audit complet, cu atenție specială la **crearea contului** (elev singur, părinte, copil creat
de părinte, invitație, cod de familie, parolă uitată) și la **drumul rapid până la conținut** pentru elevi
și părinți.

**Prod**: `https://etutor.ro` (VPS2, PM2 `tutor`). Toate probele pe producție s-au făcut cu conturi de
test; conturile create pentru audit (prefix `e2e-0926-`) au fost șterse la final.

---

## Verdict pe scurt

Drumul „îmi fac cont → ajung la o întrebare” **era rupt pe materiile școlare**. Un elev care își face
cont singur și alege în ghidul de pornire Matematica cl. VIII apăsa „Începe testul ▶” și primea textul
roșu, în engleză, **„Curriculum setup required”** — fără nimic de apăsat mai departe. La fel pățea
copilul creat de părinte. Materiile fără programă (aviație etc.) mergeau.

Pe lângă asta, auditul a găsit **două găuri de securitate pe calea de intrare în cont** și **o scurgere
de răspunsuri corecte**:

- limita de încercări la parolă și la codul de recuperare **se ocolea** cu un antet fals sau cu un
  cookie inventat la fiecare cerere;
- codul de 6 cifre de recuperare pe telefon **nu avea limită de încercări** (constanta „5” exista în
  cod, dar nu o folosea nimeni);
- evaluarea de nivel întorcea **răspunsul corect** pentru orice întrebare din orice materie, inclusiv
  cele private.

Și un defect care lovea oameni reali: **„Am uitat parola” nu trimitea niciun email pe producție**
(emailul pleca doar printr-un server SMTP care nu e configurat), iar linkul de resetare, cu cheia
lui, ajungea în jurnalul serverului.

Toate au fost reparate, verificate pe stiva locală (58 de verificări în browser real și în baza de
date, pe o copie de producție construită local) și publicate — vezi „Publicare” mai jos.

După reparații au urmat **șase runde de revizie independentă** pe codul nou (fiecare constatare verificată de
doi „sceptici” separați înainte de a fi luată în seamă). Ele au găsit, între altele, o cale prin care
cineva care își făcuse dinainte cont pe adresa altcuiva putea rămâne în cont și după ce proprietarul
își schimba parola (legând propriul Google de cont cu o sesiune veche), și câteva ocoliri ale limitei de
încercări. Toate sunt reparate și acoperite de teste care pică pe codul vechi. Ultima rundă n-a mai
găsit nimic în codul nou.

Scor audit de cod: **95/100** (0 critice, 0 high). Tester-Gateway: **PASSED**, 0 P0.

---

## Matrice scope-vs-executat

| # | Fază | Stare | Artefact |
|---|---|---|---|
| 0 | `/review` (bază, pe ramura curentă) | **DONE** — revizie adversarială pe fluxurile de cont + șase runde de revizie independentă pe reparații (17, 6, 3, 4, apoi 1 constatare confirmată — ultima dintr-un cod mai vechi), fiecare constatare cu 2 verificatori | mai jos |
| 1 | Prerechizite (conturi, roluri, date) | **DONE** — toate cele 8 conturi de test intră pe producție | `Reports/true-e2e-2026-09-26/f1-conturi-test.mjs` |
| 2 | [7] E2E CODE audit | **DONE** — 95/100, 11 module, 0 critice/high; cele 4 semnalări de securitate verificate: false alarme | `Reports/AUDIT_E2E_2026-09-26.md` |
| 3 | [8] Journey audit | **DONE** — 4 roluri, 18 pagini OK + 1 HAS_ERRORS (cuvântul „error” în textul termenilor EN — zgomot, textul verificat corect) | `journey-audit-results/2026-09-26-{STUDENT,INSTRUCTOR,WATCHER,SUPERADMIN}/` |
| 4 | TRWG-GW (Tester-Gateway) | **DONE** — PASSED, 0 P0, 1 P1 zgomot cunoscut (`/api/aviation/curriculum` 404, materie fără programă) | `Tester-Gateway/reports/tutor/true-e2e-2026-09-26/` |
| 5 | Bucla TWG | **N/A(reparat direct)** — defectele P0/P1 au fost reparate în sesiune, cu teste și verificare în browser; din sesiune interactivă bucla n-ar produce semnal (L340) | — |
| 6 | Scenarii de flux (E1–E17 + fluxurile noi de cont E18–E23) | **DONE** — 11 PASS + 2 PARTIAL din E1–E17 (E4, E9, E13 neatinse de rularea asta, vezi mai jos); E18–E23 toate reparate și trecute | mai jos |
| 7 | Concurență (F1, F2) | **DONE** — PASS | mai jos |
| 8 | Browser real G1–G5 | **DONE** — journey pe 4 roluri + scenariile de cont pe telefon (iPhone 13) | `capturi/s1`, `capturi/s2`, `capturi/reparatii` |
| 8b | Persona-walk | **N/A(not requested)** — fără `--persona` | — |
| 9 | Paritate + stress | **DONE parțial** — stress PASS; paritate demo/prod **N/A(nu există mediu demo)** | mai jos |

**Completare literală**: 11 rânduri în matrice → 8 DONE complet, 1 DONE parțial (9: nu există mediu
demo), 2 N/A cu motiv (5, 8b), 0 FAILED, 0 BLOCKED — adică **9 din 9 faze aplicabile executate**.
Scenariile de flux din `TODO_PERSISTENT.md` (E1–E23): **20 din 23 rulate (87%)** — 18 PASS, 2 PARTIAL
(E7, E17), 0 FAIL după reparații; E4, E9, E13 nerulate azi (fără schimbări în zonă de la 2026-09-05).

---

## Fluxurile de cont, pas cu pas (focusul cererii)

Rulate pe producție, pe telefon (iPhone 13), cu conturi `e2e-0926-`.

### S1 — Elevul își face singur cont
Prima pagină → „Fă-ți cont gratuit” → formular → panou → ghidul „Bine ai venit” → alege Matematica
→ „Începe testul ▶”.

- **Înainte**: se oprea în „Curriculum setup required” (engleză, fără pas următor). 6 atingeri, zero întrebări.
- **Înainte**: emailul scris cum îl scrie telefonul (`E2e-...@Demo...`) se salva așa; intrarea cu
  litere mici **nu mergea** (`capturi/s1/90-intrare-litere-mici.png`).
- **Acum**: „Începe testul” duce la lista „Materia parcursă la școală”, cu explicația în română; după
  „Salvează și continuă” testul **pornește singur** (`capturi/reparatii/d-poarta.png`,
  `d-prima-intrebare.png`). Emailul se salvează și se caută cu litere mici.

### S2 — Părintele, de pe pagina pentru părinți
`/ro/parinte` → „Încearcă fără card” → cont de părinte → Familia mea → Adaugă copil → „Creează contul direct”.

- **Înainte**: după „Creează contul copilului” formularul se închidea și atât — părintele nu vedea
  nicăieri emailul și parola de dat copilului; parola nu avea buton de afișare.
- **Acum**: apare un cartonaș „Contul copilului e gata” cu emailul și parola, și „Gata, am notat”
  (`capturi/reparatii/e-copil-creat.png`); parola are ochiul de afișare.
- Copilul intră cu datele primite și ajunge la ghidul de pornire; pe materiile școlare trecea prin
  aceeași fundătură ca S1 — reparată odată cu ea.

### S3 — Al doilea părinte, prin invitație, fără cont
- **Înainte**: „Fă-ți cont” din invitație ducea la înregistrarea generică, cu rolul **Elev** preselectat
  (al doilea părinte primea cont de elev dacă nu observa comutatorul) și fără drum înapoi: pagina
  spunea „redeschide acest link”.
- **Acum**: înregistrarea primește rolul din invitație și, după cont, **te aduce înapoi la invitație**,
  cu butonul „Accept ca părinte” (verificat: I1, I2).

### S4 — Copilul, cu codul de familie, fără cont
- **Înainte**: codul tastat se pierdea la intrarea în cont; întors pe pagină, căsuța era goală.
- **Acum**: codul călătorește prin intrare/înregistrare și revine scris în căsuță (verificat: J1).

### S5 — Parola uitată
- **Înainte (producție)**: nu pleca niciun email (singura cale era SMTP, neconfigurat); linkul de
  resetare, cu cheia, se scria în jurnal; pagina și emailul erau doar în engleză; un email cu altă
  literă mare decât la creare nu găsea contul.
- **Acum**: pleacă prin Resend (același serviciu ca linkurile de intrare, domeniu verificat); email și
  pagini în română/engleză după pagină; nimic în jurnal; a doua cerere în 2 minute nu mai trimite alt
  email; căutarea nu ține cont de litere mari/mici.
- Recuperarea pe telefon (cod pe WhatsApp): **maxim 5 încercări greșite pe cod** (apoi codul moare),
  **maxim 5 coduri pe oră pe cont**; încercările simultane sunt puse la rând, ca o rafală să nu treacă
  de limită (verificat: A1–A6, inclusiv 12 încercări trimise deodată).

---

## Defectele reale găsite, cu dovezi

| # | Gravitate | Ce | Dovadă | Stare |
|---|---|---|---|---|
| 1 | 🔴 P1 | Ghidul de pornire se oprește în „Curriculum setup required” pe materiile școlare (elev singur + copil creat de părinte) | `capturi/s1/09-unde-a-ramas.png`; `POST /api/matematica-v-viii/session/start` → **409** `{"error":"Curriculum setup required","needsCurriculumSetup":true}` | reparat |
| 2 | 🔴 P1 securitate | Limita de încercări la intrare/recuperare se ocolea: adresa era luată din **primul** `X-Forwarded-For` (pus de client) și un cookie `session-token` inventat deschidea un buget nou la fiecare cerere | test unitar pe middleware-ul real: 25 de cereri cu antet/cookie diferit → înainte 0 blocate, acum 5 blocate (3 mutații ale codului vechi, toate prinse) | reparat |
| 3 | 🔴 P1 securitate | Codul de recuperare pe telefon: fără limită de încercări (`INCERCARI_MAXIME = 5` definit, nefolosit) | citit în cod; verificat după reparație A1–A5 | reparat |
| 4 | 🔴 P1 securitate | `POST /api/student/assessment` întorcea `correctAnswer` + `explicație` pentru id-uri de întrebări din orice materie (inclusiv private) | găsit în cod de agentul de scenarii; verificat după reparație: întrebare privată → răspunsul NU apare (H1) | reparat |
| 5 | 🔴 P1 | „Am uitat parola” nu trimitea email pe producție + linkul cu cheie în jurnal + totul în engleză | citit în cod; producția n-are `SMTP_HOST`; local după reparație: jurnalul nu conține linkul | reparat |
| 6 | 🟠 P1 | Emailul cu majuscule: salvat cum e tastat; intrarea cu litere mici eșua; linkul pe email ar fi creat un al doilea cont gol | `capturi/s1/90-intrare-litere-mici.png` (NU MERGE); pe producție: 1 cont real cu majusculă | reparat + cont corectat |
| 7 | 🟠 P2 | Copilul creat de părinte: fără datele de intrare după creare, fără ochi la parolă | `capturi/s2/08-copil-creat.png` | reparat |
| 8 | 🟠 P2 | Invitația și codul de familie se pierdeau la „fă-ți cont”; al doilea părinte primea cont de elev | citit în cod; verificat după reparație I1, I2, J1 | reparat |
| 9 | 🟡 P2 | Erori de intrare (link expirat, email deja folosit altfel) nu se afișau deloc / pagina implicită în engleză | citit în cod (`pages.error` lipsă, `?error=` ignorat) | reparat |
| 10 | 🟡 P2 | Pagina de intrare în română avea „Don't have an account? Create one” | `capturi/s1` | reparat |
| 11 | 🟡 P2 | `<html lang="en">` pe toate paginile, inclusiv cele românești (cititoarele de ecran citesc româna cu voce engleză) | agent faza 6, E17 | reparat |
| 12 | 🔵 P3 | O grupă ștearsă rămâne citibilă (cu membrii) de cei care predau materia | agent faza 6, E7 | deschis |
| 13 | 🔵 P3 | Același răspuns trimis de două ori la o întrebare umflă scorul sesiunii (XP-ul e deja plafonat) | agent faza 6 | deschis |
| 14 | 🔵 P3 | Raportul de grupă îl lasă pe autor chiar dacă nu mai predă materia (celelalte rute nu) | agent faza 6 | deschis |
| 15 | 🔴 P1 securitate | Cine își făcuse cont pe adresa altcuiva putea rămâne în cont după resetarea parolei: la întoarcerea de la Google, Auth.js lega Google-ul de contul din sesiunea veche (verificată doar prin decriptare) — chiar și cu cookie-ul redenumit | revizia 2 + 3, reprodus cu codul Auth.js; test unitar cu `SessionStore` din Auth.js | reparat |
| 16 | 🔴 P1 securitate | Limita de cereri se ocolea scriind numele materiei codificat (`%62ac` = `bac`): fiecare variantă avea bugetul ei — inclusiv la ghicirea codurilor de voucher | reprodus pe copia locală (revizia 2) | reparat |
| 17 | 🟠 P2 securitate | Ghicirea codurilor (voucher, familie, clasă) se număra pe cont: cu conturi noi (gratuite) bugetul se înmulțea | reviziile 2–4 | reparat: pe adresă; la vouchere contează doar codurile inexistente (20 / 10 min), pe toate cele 5 rute care caută un cod — o familie cu un cod bun nu e încetinită |
| 18 | 🟠 P2 | Linkul de resetare (cheie + email) ajungea în analiza de trafic comună (Umami) | revizia 2 | reparat (curățitor înainte de trimitere) |
| 19 | 🟠 P2 | O intrare cu parola veche care se suprapunea cu resetarea primea o sesiune pe care resetarea n-o mai închidea | revizia 2 | reparat |
| 20 | 🟠 P2 | Intrările cu Google ale unei clase întregi consumau bugetul de parole (20/min pe adresă) | revizia 2 | reparat |
| 21 | 🟠 P2 | Linkul de intrare pe email ducea înapoi pe pagina cu eroarea veche („linkul a expirat”) | revizia 2 | reparat |
| 22 | 🟡 P3 | Un cont vechi salvat cu majuscule putea primi un „geamăn” cu litere mici care îi lua intrările | revizia 2 | reparat + migrarea 0073 |
| 24 | 🟠 P2 | O rută nefolosită (`/api/<materie>/vouchers/redeem`) consuma utilizările unui cod fără să dea nimic: cine știa un cod cu număr limitat de folosiri îl putea „epuiza” pentru toate familiile | revizia 7 (cod mai vechi) | ruta ștearsă (nimic din aplicație n-o apela) |
| 23 | 🟡 P3 | Mărunte: copilul creat nu apărea în listă dacă panoul se închidea cu „Închide”; rolul de părinte se pierdea pe calea cu codul de familie; o rafală de cereri de resetare trimitea multe emailuri; „Înapoi” după o eroare de intrare arăta altă pagină; „etutor.ro” scris cu t mic | reviziile 2–3 | reparat |

---

## Deciziile tale din 28.09 — aplicate

1. **Conturile vechi cu emailul marcat „confirmat”** (22 reale): rămân confirmate — risc acceptat.
2. **Bannerul cu prețuri la elevul care își face singur cont**: ascuns. Elevul vede doar cât mai ține
   proba (fără preț, fără −30%, fără link spre pachete). Aceeași regulă și la reducerea Telegram și pe
   pagina „Abonament”: un elev care poate fi minor vede „Abonamentul familiei îl alege părintele tău”.
3. **Anul nașterii + acordul părintelui**: la înregistrare elevul își alege anul nașterii; sub 16 ani dă
   emailul unui părinte, care primește un link („Sunt de acord” / „Nu sunt de acord”, cu confirmare).
   Contul merge 7 zile cât așteaptă; fără răspuns sau după un refuz, paginile de învățat, API-ul și
   mesajele automate se opresc (Abonament, Setări, Ajutor rămân deschise). Refuzul ține până la un
   „da”; părintelui care a refuzat i se poate scrie cel mult o dată pe zi. Elevii care și-au făcut
   cont înainte (sau cu Google) sunt întrebați anul la prima intrare. Nu sunt întrebați: copiii legați
   de un părinte, părinții, profesorii, cursanții firmelor (Poșta), invitații. Dovada fiecărui răspuns
   rămâne în `ParentalConsent` (cine, ce text, când, de unde).
4. **Conturile copiilor create de părinte**: nume de utilizator (propus din nume), email opțional;
   părintele care a făcut contul, sau un părinte invitat de el, poate schimba parola copilului din
   „Familia mea”. Un adult străin legat de copil nu poate.
5. **Ecranul de pauză**: prețul Elev apare doar elevului sigur major (după anul nașterii); unui minor
   i se spune doar că accesul se reia când un părinte se ocupă de cont, cu drumul spre codul de familie
   — fără pagină de vânzare.

**De confirmat cu Alina**: textul acordului (`src/lib/parent-consent.ts`, versiunea `PC-2026-09-28`),
pragul de 16 ani și ce se întâmplă cu datele unui cont refuzat (păstrare / ștergere).

Verificat: 1.296 de teste unitare, 75 de probe în browser și în bază pe copia locală, trei runde de
revizie independentă pe codul nou.

---

## Scenariile de flux (faza 6) — rulate pe producție

| Scenariu | Rezultat | Observații |
|---|---|---|
| E1 exersare | PASS | pornire 200 (15 întrebări), 3 răspunsuri 200, încheiere 200, a doua încheiere 400 |
| E2 examen | PASS | pornire **403** „Această funcție face parte dintr-un pachet.” — poarta de pachet, voită |
| E3 evaluare | PASS | + scurgerea #4 găsită în cod |
| E5 progres/XP | PASS | 9 citiri, toate 200 |
| E6 notificări | PASS | |
| E7 grupe | PARTIAL | ștergerea doar oprește grupa, care rămâne citibilă (#12) |
| E8 monitorizare instructor | PASS | |
| E10 rapoarte | PASS | INSTRUCTOR2 pe materie pe care n-o predă → 403 |
| E11 admin întrebări | PASS | ADMIN vede doar aviația (24) |
| E12 admin materii | PASS | ADMIN de materie → 403, superadmin → 200 (voit) |
| E14 părinte (watcher) | PASS | vede doar copilul legat; 7 citiri 200 |
| E15 superadmin | PASS | 25/26 200; `admin/creatori` 405 (n-are GET) |
| E16 intrare | PASS | parolă greșită / email necunoscut → fără sesiune; 9 apeluri anonime → 401 |
| E17 limbă | PARTIAL → reparat | `lang="en"` pe `/ro` (#11); `/en` are titlul în română (rămâne) |
| E4, E9, E13 | neexecutate azi | fără schimbări de cod în zonă de la ultima rulare (2026-09-05, PASS) |
| E18 elev își face cont → prima întrebare | FAIL → **PASS după reparație** | #1, #6 |
| E19 părinte → copil creat direct → copilul intră | PARTIAL → **PASS** | #7 |
| E20 invitație al doilea părinte fără cont | FAIL → **PASS** | #8 |
| E21 cod de familie fără cont | FAIL → **PASS** | #8 |
| E22 parolă uitată pe email | FAIL (producție) → **PASS** | #5 |
| E23 recuperare pe telefon | FAIL (limită) → **PASS** | #3 |

**Granițe de acces**: 42 din 43 verificări cum trebuie (elevul: 403 pe toate rutele de instructor/admin;
instructorul doar pe materia lui; părintele doar pe copilul lui, `?domainId=` nu-i lărgește vederea).
Singura abatere: elevul citește progresul (gol, al lui) pe o materie publică neînscris — voit.

## Concurență și stress (fazele 7, 9)
- F1: elev + admin pornesc sesiuni simultan → 2×200, id-uri diferite.
- F2: elev și instructor citesc progresul în paralel → aceleași cifre.
- 10 sesiuni pornite deodată → 10×200, fără 429/500, median 459 ms.
- 20 de cereri deodată pe `/ro` → 20×200, median 1,0 s, max 2,5 s.

---

## Acoperirea pe roluri

| Rol | Cont | Faze |
|---|---|---|
| Elev (cont vechi) | test_student | 3, 4, 6, 7, 9 |
| Elev nou, făcut singur | e2e-0926-elev-* | 6 (E18), 8 |
| Părinte nou | e2e-0926-parinte-* | 6 (E19), 8 |
| Copil creat de părinte | e2e-0926-copil-* | 6 (E19), 8 |
| Părinte (watcher) | test_watcher | 3, 6 (E14) |
| Instructor ×2 | instructor-test, test_instructor | 3, 6, 7 |
| Admin de materie | test_admin | 6 (E11, E12) |
| Superadmin | admin-test | 3, 6 (E15) |
| Invitat Poșta | demo.posta | 1 (doar intrare — Poșta e în pauză) |

---

## Unelte

| Unealtă | Rulată | Rezultat |
|---|---|---|
| `/review` | da ×8 | defecte #1–#10 confirmate în cod; încă șase runde pe reparații (#15–#24), fiecare constatare cu 2 verificatori |
| [7] CODE | da | 95/100 |
| [8] Journey | da | 4 roluri, 18 OK / 1 zgomot |
| Tester-Gateway | da | PASSED, 0 P0 |
| TWG | nu (N/A, motiv mai sus) | — |

Config reparat în audit: selectorul câmpului de email era `input[type=email]`, dar pe pagina de intrare
câmpul e acum de tip text (acceptă și nume de utilizator) → `#email` în `.journey-audit.json` și în
`Tester-Gateway/apps/tutor.json`.

---

## Publicare

LIVE pe `https://etutor.ro`, 2026-09-28 07:54 UTC (10:54 ora României).

- **Commit** Tutor `1cf2466` (+ Tester-Gateway `1c4a4c6`, doar `apps/tutor.json`), urcate pe GitHub.
- **Copie de siguranță** înainte: `VPS2:/root/backups/tutor-pre-true-e2e-2026-09-28.dump` (77 de tabele).
- **Migrări**: `0072_session_version` (coloana `sessionVersion`) și `0073_lowercase_emails` — cele 4
  emailuri cu majuscule (1 real + 3 de test) sunt acum cu litere mici, 0 conflicte.
- **Build + repornire**: 3,5 minute (`/root/tutor-deploy-true-e2e-2026-09-28.log`, `DEPLOY_DONE`).
- **Verificat live**: `/ro`, `/ro/auth/signin`, `/ro/auth/forgot-password`, `/ro/auth/register`,
  `/ro/parinte`, `/api/health` → 200; `<html lang="ro">` pe `/ro` și `"en"` pe `/en`; curățitorul
  analizei de trafic legat de Umami; „Enter your password” dispărut; o cale `/api` cu codificare greșită
  → 400; parola uitată pe un email inexistent → același răspuns „trimis”; ruta de voucher ștearsă → 404.
  În browser real (telefon): elevul de test intră cu emailul scris cu MAJUSCULE, ajunge la exersare;
  părintele de test intră și vede „Familia mea”; `?error=AccessDenied` explică în română; 0 erori în
  pagină.
- **Curățenie**: cele 6 conturi `e2e-0926-*` și grupa `e2e-0926-group` șterse (tranzacție cu verificarea
  numărului de rânduri); rămas 0.

### A doua publicare — deciziile din 28.09 (`a26e69b`, LIVE 10:14 UTC)
- Copie de siguranță: `VPS2:/root/backups/tutor-pre-decizii-2026-09-28.dump`; migrarea `0074_child_accounts_and_age` aplicată.
- Cele 10 conturi de test (din `tutor-test-users.env`) au primit anul 1990, ca verificările automate să nu se
  oprească la întrebarea nouă. Conturile reale de elev fără an vor fi întrebate la prima intrare.
- Verificat live: paginile 200; `/ro/auth/register` are anul nașterii, iar pentru 2013 apare emailul
  părintelui; un link de acord greșit → „Linkul nu mai e valid”; API-urile noi → 401 fără cont, 400 cu link
  greșit; elevul de test intră fără întrebarea de vârstă și fără prețuri în panou; părintele de test intră;
  0 erori în pagină; jurnalul de erori al serverului neatins de publicare.
