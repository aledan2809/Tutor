# True E2E Full Audit [10] — eTutor.ro — 2026-10-05

**Întrebarea ta:** „Văd un număr foarte mare de vizitatori care cred că încearcă aplicația, dar fără nicio înrolare la Users.”
Plus: fluxuri incomplete / incorecte / de optimizat, și UX cu CTA aproape iminent.

**Ce s-a rulat:** cele 3 unelte ([7] cod, [8] parcurgere pagini pe 4 roluri, Tester-Gateway), 12 fluxuri parcurse în
browser pe telefon + desktop (11 cu verdict, al 12-lea cu jurnal), 4 revizii de cod cu 10 constatări verificate independent,
scenariile E1–E17 + concurență + stres pe producție, pâlnia măsurată în Umami și în baza de date. Artefacte:
`Reports/true-e2e-2026-10-05/` (capturi, scripturi, jurnale, `agent-results.json`, `umami-30d.json`).

---

## 0. Pâlnia: vizitatori → conturi (30 de zile, 05.09–05.10)

| Pas | Cifră | De unde |
|---|---|---|
| Vizitatori unici | **115** (224 vizite, 1.782 pagini; 80 de pe telefon, 59 iOS) | Umami |
| Intră pe prima pagină `/ro` | **78** → **47 pleacă direct de pe ea** | Umami intrări/ieșiri |
| Intră pe `/ro/parinte` (flyer) | 7 intrări, 12 vederi → **8 ieșiri** | Umami |
| Văd pagina de **creare cont** | **6 vederi** în 30 de zile (1 intrare directă) | Umami |
| Văd pagina de **intrare** (signin) | **38 vederi**, 16 ieșiri; 13 vizite au `callbackUrl` (trimiși la signin din linkuri spre panou) | Umami |
| Încearcă demo-ul fără cont `/ro/try` | **1 vedere** | Umami |
| Conturi create organic | **~2–4** (12 în 6 săptămâni, din care 8 sunt invitații cu nume de utilizator la aviație) | DB prod |
| Conturi active în 30 de zile | 11 din 44 | DB prod |
| Evenimente măsurate (clic pe butoane, înregistrare) | **0** — nu există | Umami |

**Concluzie:** vizitatorii vin (Facebook în primul rând, de pe telefon), ajung pe prima pagină și pleacă; aproape nimeni
nu vede pagina de creare cont. Nu e o problemă de „aplicația nu-i convinge” — majoritatea nu ajung să vadă butonul.

### Scurgerile, în ordinea impactului (toate verificate azi pe producție, pe iPhone 13, 390×664 px util)

| # | Unde | Ce se întâmplă | Dovadă | Schimbarea concretă |
|---|---|---|---|---|
| 1 | **Bannerul de cookie-uri acoperă butoanele principale pe telefon, la prima vizită** | Pe `/ro` bannerul ocupă 470–664 px, exact unde stau „Începe testul ✨” (551) și „Fă-ți cont gratuit” (648, iese și sub margine). Pe `/ro/parinte` acoperă singurul buton („Începe cu 24,90 lei/lună”, 636). Pe `/ro/auth/register` acoperă „Creează cont” (562). La fel pe `/acces/<cod>`, `/family/join`, Familia mea. | `funnel/_ro-mobil.png`, `_ro_parinte-mobil.png`, `_ro_auth_register-mobil.png`; fluxurile F01, F02, F04, F05, F11 | Banner pe **o linie, jos, fără să acopere** (sau afișat după primul gest). Butoanele principale **deasupra** lui. Fără asta, orice alt CTA e invizibil pentru 70% din vizitatori. |
| 2 | **Demo-ul fără cont există, merge și nu-l vede nimeni** | `/ro/try` dă o grilă reală în 2 atingeri, 0 erori. Dar: pe `/ro` butonul lui e sub banner; pe `/ro/grile*` e un link de 20 px „Demo gratuit”; pe `/ro/parinte` și `/ro/preturi` lipsește. 1 vizită în 30 de zile. | `funnel/try-02-after-first-tap.png`, Umami | „**Încearcă o grilă acum — fără cont**” ca buton principal pe `/ro`, pe fiecare `/ro/grile/*`, pe `/ro/parinte`; la finalul demo-ului un singur buton „Salvează progresul — fă-ți cont (gratuit)”. |
| 3 | **Linkurile spre panou trimit anonimii la *intrare*, nu la *cont nou*** | `/ro/dashboard` → `/ro/auth/signin?callbackUrl=…` (13 vizite așa). Pe signin, „Fă-ți unul” e un text de 28 px sub două rânduri de linkuri lipite. Titlul paginii: „Sign In - Tutor” — și pe pagina de **înregistrare**. | `funnel/_ro_dashboard-mobil.png`; Umami `callbackUrl` | Pentru vizitator fără cont: pagină cu „**Cont nou gratuit**” mare + „Am deja cont” mic. Titluri corecte în română. |
| 4 | **Pagina pentru părinți începe cu prețul** | Primul (și singurul) buton vizibil: „Începe cu 24,90 lei/lună”; „Încearcă fără card” e sub primul ecran. 8 din 12 pleacă. | `_ro_parinte-mobil.png`; F02 | Inversat: „**Încearcă 7 zile fără card**” primul, prețul al doilea („apoi 24,90 lei/lună, oprești oricând”). |
| 5 | **`/ro/preturi` n-are niciun buton pe primul ecran** | Doar antet + banner. „Alege Family” e la ~1.386 px (al 3-lea ecran). Pentru un utilizator logat, „Alege Family” duce la **formularul de înregistrare** (fundătură). | `_ro_preturi-mobil.png`; F10 | Buton fix jos „Începe gratuit”; pachetul Family primul; logat → `/dashboard/packages?plan=FAMILY`. |
| 6 | **Formularul de cont cere prea mult** | 7 câmpuri (nume, email, zi, lună, an, parolă, confirmă parola) + banner peste buton. | F01 `mobile-adult-03-register-filled.png` | Scoate „Confirmă parola” (există ochiul), data nașterii ca un singur câmp sau după prima grilă (unde legea nu cere altfel). |
| 7 | **După cont, prima grilă e la încă 4–5 atingeri** | „Testul de calibrare / 90 de secunde” cere din nou clasa + 28 de bife, apoi un test de 15 întrebări cu cronometru de 72 min. | F01, F02, F04 | Preia clasa din materia aleasă, bifează programa implicit, pornește direct 5 întrebări. |
| 8 | **Nu măsurăm nimic din pâlnie** | Umami: 0 evenimente. Nu știm câți apasă „Fă-ți cont”, câți termină formularul. | `umami-30d.json` | Evenimente Umami: `cta_register`, `cta_try`, `register_done`, `first_question`. 1 oră de lucru, apoi vedem efectul fiecărei schimbări. |
| 9 | **Proba de 7 zile e promisă, dar comutatorul e oprit** | Paginile spun „7 zile fără card”; `accessTrial` e OPRIT pe prod; invitații B2B (acces plătit de angajator) văd totuși bannerul de probă cu cronometru; după 7 zile locurile din familie dispar fără ca nimic să se pună pe pauză. | F05, F11; revizie R11 | Decide: pornești comutatorul (cu conturile de test marcate „Gratuit permanent”) sau scoți promisiunea din pagini. Ascunde bannerul de probă pentru conturile venite pe cod de curs. |
| 10 | **Brand și titluri** | „Tutor - … \| etutor.ro \| Tutor” (dublu), „Sign In - Tutor”, „Tutor - Adaptive Learning Platform” pe `/ro/try`; pagina de panou pe `/en` are „Panou de control”. | sonda, [8] | Un singur șablon de titlu „… \| eTutor.ro”, în limba paginii. |

Scurgerile 1–3 sunt **dovedite** (capturi + Umami). 4–7 sunt dovedite ca frecare în flux; efectul lor pe cifre e estimare
până măsurăm (scurgerea 8).

---

## 1. Verdict pe scurt

- **Pâlnia e ruptă înainte de produs**: bannerul de cookie-uri + butoane sub margine fac ca pe telefon, la prima vizită,
  niciun CTA să nu fie vizibil pe `/ro`, `/ro/parinte` și pe formularul de cont. 6 vederi ale paginii de cont în 30 de zile.
- **Incorect (de reparat primele)**: invitația pe e-mail injectează HTML din numele invitatorului și n-are plafon (P1,
  dovedit pe QA — un cont gratuit poate trimite linkuri spre orice adresă); e-mailul de acord al părintelui poate fi trimis
  spre orice adresă fără plafon pe IP (P1); un adult venit pe cod B2B primește fals „Nu am putut trimite emailul către
  părinte” și e blocat de poarta de vârstă înainte de prima lecție (P1); pagina de notificări a părintelui face ~50 de cereri
  și primește 429, afișat ca „Niciun student de monitorizat” (P1); intrarea cu cod comun creează alt cont la fiecare intrare
  și poate fura rândul altui telefon (P2); un elev neînscris la o materie îi poate cere `/progress` (gardă lipsă, P2).
- **Incomplet**: după crearea copilului, panoul părintelui spune „Leagă contul copilului” deși e legat; părintele nu vede
  codul de familie pe care l-a generat; după „Gata!” copilul are doar un link subliniat; instructorul aterizează pe panoul de
  elev; rapoartele n-au previzualizare; cursantul B2B n-are link de copiat când WhatsApp pică.
- **De optimizat**: formular de cont de 7 câmpuri, „calibrare” de 4–5 pași, răspunsurile sub margine pe prima grilă, meniuri
  de 5 rânduri pe telefon, engleză în panou („Regular practice”, „8 days since last session”, „Create Group”, motive de risc).
- **Primul lucru de făcut**: scurgerile 1 + 2 + 3 (banner, demo vizibil, cont nou în loc de intrare) — cel mai mare efect,
  cel mai mic efort. Apoi evenimentele Umami, ca să vedem efectul.
- Infrastructura e sănătoasă: [7] 93/100 fără critice, [8] 72/72 pagini OK pe 4 roluri, Tester-Gateway trecut, stres fără
  erori.

---

## 2. Matrice scope-vs-executat

| # | Fază | Stare | Artefact |
|---|---|---|---|
| 0 | `/review` (baza de cod) | **DONE** — 4 dimensiuni (conturi/auth/coduri · drum spre conținut · partea părintelui · bani/legal): 43 constatări; **10 verificate independent, 0 refutate** (3 cu gravitatea corectată); 33 neverificate (majoritatea P3) | `agent-results.json` → `review:*`, `verify:*`; `verif-invite-html/` |
| 1 | Prerechizite | **DONE** — 6 conturi de test intră pe producție; stiva QA locală (build 10543f7) + cutie poștală falsă | `scenarii/descoperire.log`, `mailbox/` |
| 2 | [7] E2E CODE | **DONE** — **93/100**, 0 critice/high; real: 7/19 butoane sub 44 px pe panou (telefon); restul = limitări de unealtă | `Reports/AUDIT_E2E_2026-10-05.md` |
| 3 | [8] Journey | **DONE** — 4 roluri × 18 pagini OK; singura semnalare = cuvântul „error” în Termenii EN (zgomot) | `journey-audit-results/2026-10-05-*/`, `journey-audit.log` |
| 4 | TRWG-GW | **DONE** — PASSED; 1 P1 cunoscut (`/api/aviation/curriculum` 404, materie fără programă) | `Tester-Gateway/reports/tutor/2026-10-05T07-18-52-155Z/` |
| 5 | Bucla TWG | **N/A** (din sesiune interactivă bucla nu produce semnal — L340; reparațiile se propun mai jos, nu s-a aplicat nimic) | — |
| 6 | Scenarii E1–E17 | **DONE** — 9 PASS, 4 PARTIAL (E7 grupa ștearsă încă citibilă — deschis din 26.09; E10 ruta de rapoarte cere `type`; E12 contul ADMIN de materie n-are `/api/admin/domains` — corect după 05.09; E15 `creatori` 405 la GET — zgomot); E4/E9/E13 doar la nivel de pagină prin [8] | `scenarii/faze-6-7-9.log`, `scenarii/rezultate-faze-6-7-9.json` |
| 7 | Concurență F1, F2 | **DONE** — PASS (2 sesiuni simultane distincte; citiri elev + instructor consistente) | idem |
| 8 | Browser real | **DONE (parțial)** — 11 din 12 fluxuri cu verdict pe telefon + desktop; **F03** (al doilea părinte prin invitație) parcurs în jurnal până la panou (14 pași mobil, 27 desktop), fără verdict structurat — agentul a fost oprit de limita de sesiune | `flow-F01…F12/`, `funnel/` |
| 8b | Persona-walk | **N/A** (nu a fost cerut `--persona`) | — |
| 9 | Paritate · Stres | Paritate **N/A** (nu există mediu demo) · Stres **PASS**: 30 cereri simultane → `/ro` p95 2,0 s, `/ro/parinte` 2,4 s, `/ro/preturi` 1,4 s, signin/try 0,9 s, 0 erori; 10 sesiuni simultane `session/start` p50 526 ms | `scenarii-stres.log`, `scenarii/faze-6-7-9.log` |

**Executat: 8 din 10 faze** (faza 8 parțial: 11/12 fluxuri), **2 N/A** cu motiv. Nicio fază sărită tăcut.

---

## 3. Fluxurile, pas cu pas

Pași = atingeri/trimiteri de la pagina de intrare până la „prima valoare” (prima grilă sau primul buton clar). Secundele
sunt ale scriptului (un om e mai lent la formulare). CTA 1–5: 5 = pasul următor e evident și la o atingere, vizibil fără
scroll, la fiecare pas.

| Flux | Rol | Pași | Sec | CTA | Stare | Ce lipsește |
|---|---|---|---|---|---|---|
| F01 Elev își face cont (telefon) → prima grilă | elev | 7 + 7 câmpuri | 18 | 3 | PARTIAL | banner peste buton; calibrare cere clasa + 28 bife; răspunsuri sub margine; „Regular practice” în RO |
| F02 Flyer `/cafea` → părinte → copil → prima grilă | părinte+copil | 6 | 4,5 | 3 | PASS | banner peste ambele butoane; după „Gata, am notat” nimic; panoul zice „Leagă contul copilului” deși e legat; formularul „Adaugă copil” se deschide sub ecran |
| F03 Al doilea părinte prin invitație, fără cont | părinte | ~3 după link | — | — | parcurs (jurnal) | linkul din e-mail → „Fă-ți cont” → rolul Părinte preselectat → „Accept ca părinte” → panou. De confirmat: pe desktop, după accept, `/dashboard/family` a cerut din nou intrare (sesiune pierdută?) |
| F04 Copilul cu codul de familie, fără cont | copil | 7 (+5 până la grilă) | 9,9 | 3 | PASS | află că-i trebuie cont abia după „Accept”; după „Gata!” doar un link subliniat; părintele nu vede codul generat; spațiile din cod respinse |
| F05 Cod de acces B2B `/acces/<cod>` | invitat | 2 | 0,9 | 3 | PARTIAL | codul greșit se află după 3 câmpuri; a doua intrare = cont nou (P1 de produs); banner de probă la angajat; 429 arată ca „link expirat” |
| F06 Parolă uitată pe e-mail | elev | 7 | 8,4 | 3 | PASS | link refolosit: eroarea după completare; fără „Retrimite”; e-mailul nu e precompletat la intrare; mesaj „parolă prea scurtă” în engleză |
| F07 Elev care revine → „Astăzi” → grila | elev (prod) | 2 | 5 | **4** | PASS | panoul se încarcă de 2 ori; „8 days since last session” în RO; Setări→Notificări în engleză |
| F08 Părinte revine → copil → ce face | părinte (prod) | 3 | 6 | 3 | PASS | **~50 cereri → 429** pe Notificări; 429 afișat ca „Niciun student”; vocabular de instructor („Monitor Progres Studenți”); formularul WhatsApp înaintea sintezei |
| F09 Setări părinte: rezumat zilnic + Telegram | părinte (prod) | 3 | 9 | 3 | PASS | rezumatul e la ~1.750 px; două pagini de notificări cu opțiuni diferite; „Zilnic la ora” vs „Rezumat zilnic la ora” se confundă; date în format US |
| F10 Prețuri → pachet → buton de plată | părinte (prod) | 4 | 45 | **2** | PARTIAL | niciun buton pe primul ecran; logat → „Alege Family” duce la înregistrare; `?plan=` ignorat; 5 butoane identice „Alege pachetul” |
| F11 B2B: import cursanți → invitație → `/acces/<token>` → lecția | admin+cursant | 9 | 7,8 | 3 | PARTIAL | adult blocat de poarta de vârstă + mesaj fals de e-mail (P1); invitația doar pe WhatsApp, fără link de copiat (P1); link greșit cade în „Spune-ne cine ești” |
| F12 Instructor: grupă → elev → raport | instructor (prod) | 8 | 19 | **2** | PARTIAL | aterizează pe panoul de elev; „Create Group” și motivele de risc în engleză; fără previzualizare de raport; „Grupuri 0” lângă 2 grupe; toți utilizatorii apar ca „studenți” |

---

## 4. Defectele reale, cu dovezi

Gravități: P1 = cineva nu-și poate termina drumul sau e o problemă de securitate; P2 = comportament greșit pe o cale
realistă; P3 = finisaj. „✔” = verificat independent (a doua pereche de ochi, pe cod sau pe QA); „◦” = constatare
neverificată independent (dovada e cea indicată).

### Securitate și corectitudine (din revizia de cod)

| # | Grav. | Ce | Dovadă | Propunere |
|---|---|---|---|---|
| S1 ✔ | **P1** | **Invitația pe e-mail pune numele invitatorului ca HTML neescapat și n-are plafon**: un cont gratuit cu numele `<a href="…">Banca ta</a>` a trimis 5 invitații spre 5 adrese, toate livrate, linkul activ în mail | `src/lib/family-invite.ts:665,675`; `verif-invite-html/RESULT.txt`, `01-invite-mail.json` | `escapeHtml(inviterName)` (există în `@/lib/sanitize`); plafon 10 invitații/zi per invitator și 2 per adresă-țintă |
| S2 ✔ | **P1** | E-mailul de acord al părintelui pleacă spre orice adresă, fără plafon pe IP (plafoanele sunt pe cont, iar contul e nou de fiecare dată) | `src/app/api/auth/register/route.ts:229`; verificat pe QA | contor per IP (5/oră) + plafon zilnic global pe acordurile trimise |
| S3 ✔ | P2 | Intrarea cu cod comun: telefonul tastat „fură” rândul `Recipient` al altcuiva (`upsert` suprascrie `userId`) | `src/lib/auth.ts:161`; F05 | `updateMany` doar dacă `userId` e null; altfel conflict afișat |
| S4 ✔ | P2 | Fiecare intrare cu același cod/telefon creează alt utilizator și consumă o folosire a codului; progresul se pierde | `src/lib/auth.ts:171`; F05 | dacă telefonul are deja `Recipient` cu `userId`, reintră în acel cont |
| S5 ✔ | P2 | E-mailul copilului tastat de părinte, neconfirmat, permite resetarea parolei pe el și blochează înregistrarea adevăratului proprietar | `src/lib/family-invite.ts:849` | e-mailul copilului devine identificator doar după confirmare |
| S6 ✔ | P2 | Codul 100% la înscriere nu scrie `VoucherRedemption` → poate fi refolosit din `/api/activate` | `register/route.ts:167` | aceeași tranzacție scrie și răscumpărarea (cum face `activate`) |
| S7 ◦ | P2 | Checkout-ul și `/api/plans` nu refuză pe server un cont de copil (regula UCPD e doar în interfață) | `src/app/api/admin/stripe/checkout/route.ts:43` | același calcul `child` ca în `plans/route.ts`, pe server |
| S8 ◦ | P2 | **Elevul înscris doar la aviație primește 200 la `/api/matematica-v-viii/progress`** (gardă de materie lipsă pe o rută) | `scenarii/faze-6-7-9.log:145` | aceeași poartă de înscriere ca pe celelalte rute de materie |
| S9 ◦ | P2 | Pagina „Astăzi”: răspunsul de eroare al API-ului intră în stare ca date și prăbușește pagina (401/403/500) | `src/app/[locale]/dashboard/page.tsx:108` | verifică `r.ok` înainte de `setData` |
| S10 ◦ | P2 | Schimbarea materiei pe „Astăzi” pornește o a doua cerere fără `domainId` care poate suprascrie răspunsul bun | `dashboard/page.tsx:105` | un singur efect cu dependența `[activeDomainId]` |
| S11 ✔ | P2 | Zonele slabe și sesiunile recente nu sunt filtrate pe materia activă → hero-ul poate propune un subiect din altă materie | `src/app/api/student/dashboard/route.ts:113` | filtrează pe `activeDomainId` |
| S12 ✔ | P2 | Hero-ul „Începe ▶” promite un subiect, dar face „Continuă” pe orice materie | `dashboard/page.tsx:587` | `onContinue` trimite materia activă |
| S13 ✔ | P2 | Wizardul de început: pe materii cu curs pasul 2 pică garantat (409), listează materii fără grile | `src/components/dashboard/onboarding-wizard.tsx:56` | ascunde materiile fără grile; pentru curs, deschide prima lecție |
| S14 ✔ | P2 | Pasul 3 „Simulări” duce la lista nefiltrată pe materie, fără mesaj | `exam-bank/page.tsx:12` | `?domain=` + ascunde pasul când materia n-are simulări |
| S15 ✔ | P2 (din P1) | Contul unui minor se șterge după ce „remindere” trimise spre o adresă oprită/greșită sunt socotite trimise | `src/lib/consent-reminders.ts:187` | o adresă fără livrare după N eșecuri **blochează** ștergerea (contul rămâne oprit) |
| S16 ✔ | P2 | Copilul vede „Am trimis” chiar dacă e-mailul către părinte n-a plecat | `src/components/consent/age-consent.tsx:241` | verifică `suppressionFor` înainte și spune „adresa nu poate primi mailuri” |
| S17 ◦ | P2 | Rezumatul zilnic nelivrat (adresă oprită, fără push) consumă ziua; evenimentele nu se mai povestesc | `src/lib/escalation/parent-digest.ts:271` | la `delivered=false` eliberează ziua (max 3 reîncercări) |
| S18 ◦ | P2 | Părintele nu află niciodată că adresa lui e pe lista de suprimare | `notification-preferences.tsx:212` | banner „Adresa ta nu mai primește mailuri de la noi — schimb-o” |
| S19 ◦ | P2 | Pornirea unei sesiuni din Exersare tace pe 404/403/5xx | `practice/page.tsx:150` | mesaj tradus + buton „Încearcă din nou” |
| S20 ◦ | P3 | `openedAt` al linkului personal se scrie la GET (previzualizarea WhatsApp „apasă” linkul) | `acces/[code]/page.tsx:63` | scrie la primul gest real |
| S21 ◦ | P3 | Proxy-ul de consimțământ interpolează `type` neprelucrat în calea spre Legal Hub | `api/v1/consent/record/route.ts:53` | whitelist `cookies/privacy/terms` |
| S22 ◦ | P3 | Orele de liniște se salvează fără validare HH:MM | `preferences/route.ts:76` | același regex ca la `selfAlertAt` |
| S23 ◦ | P3 | 409 „cont există” la înregistrare permite enumerarea adreselor; fără blocare pe cont la parole | `register/route.ts:60` | mesaj unic + e-mail „ai deja cont” |

Restul constatărilor P3 din revizie (14) sunt în `agent-results.json` → `review:*` (texte neinternaționalizate, N+1 pe
panou, `localStorage` neprotejat, `/continue` pe sesiuni terminate, linkuri fără locale etc.).

### Din parcurgerile în browser (toate cu capturi în `flow-F*/`)

| # | Grav. | Ce | Dovadă |
|---|---|---|---|
| B1 | **P1** | Notificările părintelui: ~50 de cereri `nudge-targets` deodată → **429**; pe panou 429 e afișat ca „Niciun student de monitorizat” | F08, `flow-F08/mobile-03…`, `steps.json` |
| B2 | **P1** | Adultul venit pe cod B2B: mesaj fals „Nu am putut trimite emailul către părinte” (`sent: minor` = false la adulți) și poarta de vârstă înaintea primei lecții | F11 `mobile-13-first-value.png`; `src/app/api/me/age/route.ts:68` |
| B3 | **P1** | Invitația B2B depinde doar de WhatsApp; la eșec: „Mesajul nu a plecat · 401: WhatsApp API error” și niciun link de copiat | F11 `mobile-07-invitatii-send-result.png` |
| B4 | **P1** (produs) | Cod comun: a doua intrare cu același telefon = cont nou, progresul vechi abandonat (vezi S4) | F05 |
| B5 | P2 | Panoul părintelui spune „Leagă contul copilului” deși copilul e creat și legat; după „Gata, am notat” nu există pas următor | F02 `mobile-p-10/11.png`; cod `dashboard/page.tsx:196` ✔ |
| B6 | P2 | Părintele nu vede codul de familie după ce îl generează (fereastra se închide la reîncărcare) | F04 |
| B7 | P2 | Monitorizarea redirecționează tăcut la panou cât timp copilul legat n-are materie | F04 `PW-watcher.png` |
| B8 | P2 | „Începe sesiunea” de pe Grile e acoperit de bara de jos pe telefon și eșuează tăcut până bifezi capitole | F02 child3 |
| B9 | P2 | Alegerea pachetului nu arată eroare când plata pică (500 pe QA — broker fals, dar lipsa mesajului e reală) | F02 `pkg.mjs` |
| B10 | P2 | Logat, „Alege Family” de pe `/preturi` duce la înregistrare; `?plan=FAMILY` ignorat pe `/dashboard/packages` | F10 |
| B11 | P2 | Instructorul: „Create Group” și motivele de risc în engleză; „Grupuri 0” lângă 2 grupe; toți utilizatorii platformei apar ca „studenți” în selecții | F12 |
| B12 | P2 | Pagina elevului/instructorului cere `/api/aviation/curriculum` (404) și `/api/admin/domains` (403) la fiecare încărcare | F08, F12 |
| B13 | P2 | Butoanele blocate de pachet („Adaugă al 2-lea părinte”) arată ca butoane active | F02 |
| B14 | P2 | Două bannere (probă + „Instalează eTutor”) ocupă primul ecran pe telefon, în panou și în Setări | F02, F09, F10 |
| B15 | P2 | Link de resetare refolosit: eroarea apare după completarea parolei; fără „Cere unul nou” | F06 |
| B16 | P3 | Hamburger-ul plutitor acoperă textul întrebării la derulare; antet de 2 rânduri pe panou | F01, F02, F07 |
| B17 | P3 | Pagina de acord al părintelui are „CUI: TBD · Adresă: TBD, RO”; linkul din e-mail cu paranteze lipite | F01 |
| B18 | P3 | Date în format US în alerte; „Quick”, „Co-pilot”, „Enable Push”, „← Settings” pe pagini românești | F08, F09 |

**Zgomot verificat (nu sunt defecte):** [7] secțiunea 5b a „recenzat” propriul meu script de probă; scanerul a11y nu
poate rula din cauza CSP (protecție corectă); `/en/terms` HAS_ERRORS = cuvântul „error” în text; E15 `creatori` 405 la GET
(ruta e POST); E12 403 pentru ADMIN de materie e comportamentul corect din 05.09.

---

## 5. UX — unde CTA nu e iminent (grupat)

**Incorect (CTA promite altceva sau e ascuns)**
- Banner cookie peste CTA pe toate paginile de acțiune, pe telefon (scurgerea 1).
- `/ro/preturi` fără buton pe primul ecran; „Alege Family” → înregistrare pentru cel logat (F10).
- Panoul părintelui: „Leagă contul copilului” când e deja legat (B5).
- „Răspunde ca să vezi feedback imediat” dar mai e un pas „Trimite” (F01).
- Hero „Exersează <subiect>” care de fapt continuă ultima sesiune din orice materie (S12).

**Incomplet (lipsește pasul următor)**
- După „Gata, am notat” (copil creat): nimic — trebuie „Copiază datele”, „Trimite pe WhatsApp”, „Alege materia” (F02).
- După „Gata! Ești legat de familie”: un link subliniat; trebuie „Începe prima grilă” care preia clasa (F04).
- Codul de familie generat nu e afișat mare, cu „Copiază”/„Trimite” (F04).
- Watcher fără copii: „Niciun student de monitorizat” fără buton „Adaugă primul copil” (revizie R6).
- Capitolul copilului: singura acțiune „Trimite-i un reminder”; lipsesc „Vezi ce a greșit”, „Schimbă programul”; pentru
  copil fără materie: „Alege materia și programul” (F08, R5).
- Rapoarte instructor: doar export, fără previzualizare; buton inactiv fără explicație (F12).
- „Uită-te în email”: fără „Retrimite” și fără „Deschide Gmail” (F06).

**De optimizat (prea mulți pași / prea mult pe ecran)**
- Formular de cont: 7 câmpuri → 4 (scoate „Confirmă parola”, data nașterii într-un câmp) (F01, F02).
- Calibrarea: clasa + 28 de bife + 15 întrebări/72 min → preia clasa, bifează implicit, 5 întrebări (F01, F02, F04).
- Prima grilă pe telefon: ~450 px de banner + titlu + indiciu înaintea enunțului; răspunsurile sub margine → ascunde bannerul
  de probă în sesiune, indiciu pe un rând (F01, F02).
- Meniuri: Administrare 16 butoane / Instructor 10 file pe ~5 rânduri înaintea conținutului (F11, F12) → bară derulabilă.
- Instructorul aterizează pe panoul de elev → direct `/dashboard/instructor` (F12).
- Rezumatul zilnic la 1.750 px în Setări; două pagini de notificări cu opțiuni diferite; „Zilnic la ora” vs „Rezumat zilnic la
  ora” → „Aceeași alertă, o dată pe zi” vs „Un singur mesaj-rezumat pe zi” (F09).
- Vocabular de părinte: „Copiii mei”, „Cât de des te anunțăm”, „Sesiune rapidă”, „Activează notificările” (F08).
- Engleză pe `/ro`: „Regular practice”, „8 days since last session”, „Create Group”, „Insufficient session data”,
  Setări→Notificări integral, „Close menu” (F01, F07, F09, F12; revizie F9).

---

## 6. Plan de reparații propus (nimic aplicat — tu decizi)

| Ord. | Ce | Efort | Risc | De ce întâi |
|---|---|---|---|---|
| 1 | Banner cookie pe o linie, jos, care nu acoperă; butoane ≥44 px; „Fă-ți cont gratuit” și „Începe testul” sus pe `/ro` | **S** | mic | deblochează pâlnia pentru 70% din vizitatori (scurgerea 1) |
| 2 | Demo-ul `/ro/try` ca buton principal pe `/ro`, `/ro/grile/*`, `/ro/parinte` + buton „Salvează progresul — fă-ți cont” la final | **S** | mic | produsul se vede înainte de cont (scurgerea 2) |
| 3 | Anonim pe `/dashboard*` → pagină „Cont nou gratuit” mare / „Am deja cont” mic; titluri corecte RO | **S** | mic | 13 vizite pierdute la signin (scurgerea 3) |
| 4 | Evenimente Umami pe CTA + înregistrare + prima grilă | **S** | nul | fără ele nu vedem efectul schimbărilor |
| 5 | **S1 + S2**: `escapeHtml` pe invitație + plafoane pe invitații și pe e-mailurile de acord | **S** | mic | securitate P1 confirmată |
| 6 | **B1**: o singură cerere per copil pe Notificări (cache) + 429 afișat corect | **S–M** | mic | pagina părintelui e inutilizabilă cu multe alerte |
| 7 | **B2 + B3**: adulții cu `Recipient` nu trec prin poarta de vârstă; mesajul `sent` corect; „Copiază link” în invitații | **M** | mic | cursanții B2B (Poșta) sunt blocați la prima lecție |
| 8 | **S3 + S4**: intrarea cu cod reintră în contul telefonului existent; fără furt de `Recipient` | **M** | mediu (auth) | progres pierdut la fiecare reintrare |
| 9 | `/ro/parinte`: „Încearcă 7 zile fără card” primul; `/ro/preturi` buton fix + Family primul; logat → `packages?plan=` | **S** | mic | scurgerile 4–5 |
| 10 | Formular de cont 4 câmpuri; calibrare fără clasa + bife; răspunsurile vizibile pe prima grilă | **M** | mediu (UX) | timpul până la prima grilă se înjumătățește |
| 11 | Panoul părintelui după crearea copilului (B5) + pas următor după „Gata, am notat” + codul de familie vizibil (B6) | **M** | mic | fluxul principal al flyer-ului |
| 12 | S15/S16/S17/S18 (adrese oprite: ștergerea minorului, „Am trimis”, rezumatul, bannerul părintelui) | **M** | mic | corectitudine GDPR + rezumatul nou |
| 13 | S8 gardă `/progress`; S9/S10/S11/S12 panoul „Astăzi”; S13/S14 wizard + simulări | **M** | mediu | panoul elevului |
| 14 | Decizia pe comutatorul probei (scurgerea 9) + banner de probă ascuns la invitații B2B | decizie + **S** | — | promisiune vs realitate |
| 15 | Texte RO/EN (inventarul din revizie F9 + F07/F08/F09/F12), vocabular de părinte, instructor → `/instructor` | **M** | nul | finisaj |

---

## 7. Ce a mers bine

- Elevul care revine ajunge la prima grilă în **2 atingeri** (F07, CTA 4/5); sesiunea pornește în ~1 s.
- `/cafea` → `/ro/parinte?voucher=V126S` cu prețul 24,90 corect și rolul Părinte preselectat; „Încearcă fără card” duce direct
  la cont (F02).
- Demo-ul fără cont funcționează impecabil (2 atingeri, 0 erori) — doar că nu-l găsește nimeni.
- Toate gărzile de rol verificate: 42 din 43 de limite respectate (elev ≠ instructor ≠ admin ≠ părinte; materii private).
- Infrastructura: 0 erori la 30 cereri simultane; `/api/cron/*` inaccesibil din afară; sesiunile de test închise curat.

---

## Cost și metodă (onest)

Prima rulare a pornit **42 de agenți** (12 parcurgeri + 4 revizii + 1 arhitect + 1 scenarii + 1 sinteză + **23 de
verificatori, unul per constatare**) — ~13,6 M tokeni. Verificatorul per constatare a fost greșeala: trebuia unul per
dimensiune. Reluarea (încă ~11 agenți) a fost oprită la cererea ta după câteva minute; sinteza, pâlnia și scenariile le-am
făcut eu, fără agenți, din rezultatele salvate și cu sonde ieftine. Lecția e scrisă în Master (`knowledge/lessons-learned.md`).
