# Restructurare meniuri pe roluri — mockup-uri + decizii (design doc)

> **Scop**: documentul de design pentru restructurarea sidebar-ului Tutor pe cele 3 roluri
> (ELEV → PĂRINTE → MEDITATOR). Sursă de adevăr pentru implementare. Cross-ref: `TODO_PERSISTENT.md` §213.
> **Creat**: 2026-06-04. **Status**: ELEV = decizii BLOCATE; PĂRINTE/MEDITATOR = mockup propus, feedback parțial.

## Ordine obligatorie (cerută user)
**(1) ELEV mai întâi → (2) PĂRINTE → (3) MEDITATOR.** Un rol complet (audit + ascundere + verificare pe prod) înainte de următorul; fără paralelizare.

## Mecanism
Conditional render în `src/components/sidebar.tsx` (`HIDDEN_NAV` set + filtru `visibleNavItems`). **Rutele rămân funcționale**, reversibil. NU se șterg rute/cod.

## Content audit pe prod (2026-06-04, real counts)
| Item | Model | Count | Verdict |
|---|---|---|---|
| Practică | Question PUBLISHED | 30 | ✅ (misfiled sub „Aviation", vezi §188) |
| Simulări | ExamPaper | 26 | ✅ real (EN VIII Mate) |
| Lecții | Lesson | 0 | 🚫 ASCUNS |
| Evaluare | Assessment | 0 | 🚫 ASCUNS |
| Examene | ExamSimulation | 1 | 🚫 ASCUNS |
| Bibliografie | Bibliography | 11 | 🚫 ASCUNS (juridic/aviation) |
| Domenii | Domain | 8 (3 cu grile) | ⚠️ păstrat (decizie user) |
| Calendar | UserCalendar | — | ⚠️ păstrat (decizie user) |
| Progres·Gamificare·Notificări·Invită·Setări | features | — | ✅ |
| Monitorizare·Alerte (părinte) · Instructor (meditator) | features | — | ✅ |

**Ascundere globală 4 item-uri** (Lecții/Evaluare/Examene/Bibliografie) = FĂCUT 2026-06-04 (commit `6ff013e`), verificat autentificat. Decizia per item (populăm/unificăm/scoatem) rămâne deschisă în §213.

---

# 🧑‍🎓 ROL 1 — ELEV  (decizii BLOCATE 2026-06-04)

**Flux**: login → „ce fac azi" (Practică + Simulări) → Progresul meu (statistici + realizări mă motivează) → invit un prieten.

**Sidebar final ELEV** (vizibil):
```
🏠 Panou de control
   Practică                 (banca de grile)
   Simulări                 (exam-bank, 26 variante EN VIII Mate)
   Progresul meu            ← MERGE Progres + Gamificare (2 secțiuni)
   Domenii                  (păstrat)
   Calendar                 (păstrat)
   Invită un prieten        ← redenumit + model credit (vezi mai jos)
   Notificări               (doar istoric — rămâne așa)
   Setări                   (program de lucru + Google Calendar + link notif)
── ascunse global: Lecții · Evaluare · Examene · Bibliografie
```

### Decizie 1 — MERGE Progres + Gamificare → „Progresul meu"
- Zero conflict de date (arbori diferiți: `Progress`/`WeakArea`/`Attempt` vs `UserGamification`/`LeaderboardEntry`/`DailyChallenge`). Merge = doar UX, fără migrare.
- Un singur item **„Progresul meu"**, 2 secțiuni:
  - **Statistici** — acuratețe, zone slabe, pe materii.
  - **Realizări** — puncte, nivel, serii, clasament, provocarea zilei, insigne.
- De-anglicizare copy intern (fără cuvântul „Gamificare" vizibil): `XP`→**puncte**, `streak`→**serii**, `achievements`→**insigne**, `leaderboard`→**clasament**, `level`→**nivel**.

### Decizie 2 — „Invită un prieten" = model CREDIT (NU comision)
**Cerință user (verbatim, NU reformulată):**
> e prea mult comision perpetuu - pare schema piramidala. Punem pentru invitat 1 luna gratis (pe a doua, ca pe prima sa si-o plateasca imediat) si 1 luna gratis pentru cel care a facut invitatia (cu conditia ca cel care a facut invitatia sa aiba macar o luna platita. La a doua invitatie care se concretizeaza se transforma iar in credit pe inca o luna si tot asa. Poate ajunge la un moment dat cu o luna platita sa aiba chiar si credite pentru un an intreg - va fi un ambasador pentru aplicatie
> Decizie: DA, păstrăm comisionul doar pentru Creatori și punem credit-free-month pe elev

**Mecanică (interpretare, de validat la implementare):**
- **Prietenul invitat**: plătește luna 1 imediat → primește **luna 2 gratis** (credit).
- **Cel care invită**: primește **+1 lună credit** per invitație **concretizată** (= prietenul a plătit luna 1). **Condiție**: cel care invită are deja **≥1 lună plătită**.
- Acumulare: a 2-a invitație concretizată → +1 lună, ș.a.m.d. Plafon practic ~12 luni (un an) → user devine **ambasador**.
- Comisionul 50% perpetuu **rămâne DOAR pentru programul Creatori** (§286), NU pentru elevi.

> **⚠️ SUPERSEDAT 2026-06-04** — modelul „1 lună gratis" de mai sus a fost **unificat**: vezi „Matricea câștigurilor" — referral final = **50% credit pe primele 3 luni** din abonamentul invitatului, identic pentru elev și părinte. Textul de mai sus se păstrează ca trail al deciziei.

**Status azi**: codul actual (`src/lib/referral.ts`) face comision 50% cash perpetuu + voucher −25% pentru invitat. Modelul de **credit NU există** — e muncă nouă (mecanism de credit aplicat la subscription + landing page cu detalii). Vezi TODO item dedicat.

### Decizie 3 — Notificări (elev) = doar istoric, rămâne. Dezvoltările → Setări → Notificări (vezi roadmap pachet/delegare mai jos).

---

# 👪 ROL 2 — PĂRINTE  (✅ SIDEBAR DONE 2026-06-04 · feature-uri = sesiuni dedicate)

> **✅ Sidebar restructure LIVE** (commit `e884255`): cont WATCHER pur vede doar Panou · Monitorizare · Alerte · Invită un prieten · Notificări · Setări (verificat autentificat etutor.ro — 6 items, fluxul de învățare ascuns). Feature-urile de mai jos (sinteză AI, baterie remedială, alerte configurabile, earnings) = 🔨 sesiuni dedicate, NU în restructurarea de sidebar.

**Flux**: login → lista copiilor (sau direct copilul) → sinteză + zone de reparat + evoluție → primește alerte → (recomandă altor părinți).

```
🏠 Panou de control
   COPILUL MEU
    Monitorizare   ← sinteză + zone de reparat + evoluție
    Alerte         ← escaladări
   Recomandă       ← credit 50% din prima lună a invitatului (NU comision)
   Notificări
   Setări
── ascunse: fluxul de învățare al elevului (Practică/Simulări/Progres/...)
```

### Monitorizare (piesa centrală)
- **✅ azi**: listă copii + carduri metrici (acuratețe, serii, puncte, nivel) + top 3 zone slabe + istoric examene + sesiuni recente. RAW metrics.
- **🔨 de construit (visiune user)**: „se fac rapoarte, sinteze si se dau si exemple de zone cu probleme (ex. greseli frecvente la ecuatiile de gradul 2, reparat formulele trigonometrice cu cos 30, etc)" — strat de **sinteză narativă AI** + **exemple concrete** de zone cu probleme.
- **🔨 BATERIE DE TESTE REMEDIALE (AI) — PUNCTUL FORTE al aplicației** (user 2026-06-04): pe baza zonelor slabe, AI **caută + creează o baterie de teste exact pe punctele slabe** ale copilului. Diferențiatorul-cheie al aplicației. Apare în Monitorizare (părinte îl vede) + alimentează sesiunile de reparare ale elevului.
- **🏗️ Decizie arhitecturală — TAG-UIRE LA IMPORT** (user 2026-06-04): „AI va analiza si cataloga greselile si va tag-ui in log. Ulterior, insa va fi nevoie de search laborios. Poate ar fi bine ca aceste tag-uri sa apara chiar de la import cand se analizeaza materialele? Astfel matchingul va fi mult mai bun." → tag-urile de concept fin („cos 30°", „discriminant") se generează **CHIAR DE LA IMPORT** (când AI analizează materialele), nu doar post-hoc din greșeli. Matching „zonă slabă → întrebări remediale + baterie" net superior + evită search laborios. Conectează: importere exam-bank (azi doar `topic` grosier), **Content Quality Mesh §278**, **§188** (misfiling).

### Alerte
- **🟡 azi**: UI listă notificări clasificate + mark-read. Logica de declanșare (`EscalationThreshold`/`EscalationEvent`) e stub/externă.
- **🔨 NIVEL DE ALERTARE configurabil de PĂRINTE** (user 2026-06-04): granularitate la nivel de **ORĂ** (părintele vrea să știe în aceeași oră când copilul a sărit peste o oră de studiu) SAU la nivel de **X ore** (6/12/24/48h, etc.).
- **Regulă**: escaladarea NU se face după 4 zile — „n-a mai intrat de 4 zile" apare DOAR în **sumar** (Monitorizare), nu ca alertă de escaladare.

### Recomandă / Invită (părinte) — DECIZIE 2026-06-04: 50% din prima lună, ca CREDIT
**Cerință user (verbatim, NU reformulată)**:
> da, OK cu 50% castig din echivalentul primei luni, dar il facem tot sub forma de credite (ex. Invitatul a platit un abonament de 100 de lei/luna - chiar daca a platit in avans pe 1 an intreg, iar parintele care a invitat primeste credit de 50 de lei. Daca abonamentul sau pe luna este de 75 de lei, va mai plati doar 25 de lei in acea luna si trecem 50 de lei ca si discount. Daca face 3 invitatii de cate 80 de lei fiecare si aceia au platit, atunci i se cumuleaza un credit de 120 de lei pe care ii va folosi in 2 luni (in prima nu va plati nimic din cei 75 de lei, iar in a doua va plati doar 45 de lei).

- Mecanică (versiunea inițială, păstrată ca trail): credit = 50% din echivalentul PRIMEI luni a invitatului, acumulat și aplicat pe abonamentul propriu lunar până se epuizează.
- ✅ **REZOLVAT 2026-06-04**: (1) **aritmetică confirmată** — regula = creditul acoperă abonamentul până se epuizează (luna 2 = 75−45 = **30**, nu 45; user a confirmat eroarea de calcul). (2) **UNIFICAT cu elev** → vezi „Matricea câștigurilor": referral final = **50% credit pe primele 3 luni** din abonamentul invitatului, identic elev și părinte, acumulat la familie sau copil. (Versiunea „50% din PRIMA lună" e înlocuită de „50% pe primele 3 luni".)

### Notificări (istoric) ✅ — **5 canale** = Push (web/browser) · WhatsApp · SMS · Email · Apel (telefonic); **fus** = fus orar (ca orele de liniște să se aplice corect). · Setări (generic azi) — vezi roadmap pachet/delegare.

---

# 👨‍🏫 ROL 3 — MEDITATOR  (✅ SIDEBAR DONE 2026-06-04 · feature-uri = sesiuni dedicate)

> **✅ Sidebar restructure LIVE** (commit `915f7a8`): cont INSTRUCTOR pur vede Panou · Instructor (hub) · Practică · Simulări · **Invită un prieten** · Notificări · Setări (7 items, verificat autentificat etutor.ro). „Invită un prieten" = vizibil (decizie user 2026-06-04 — meditatorul câștigă din referral). De-anglicizare „XP→Puncte" aplicată în `StudentProgressCard` (partajat cu părinte). Feature-urile de mai jos (mesaje in-app, rapoarte narativ, sinteză AI, pagina câștiguri) = 🔨 sesiuni dedicate.

**Flux**: login → hub Instructor (Studenți, Grupuri, Obiective, Mesaje, Analiză, Rapoarte) → preview conținut → comunică.

```
🏠 Panou de control (hub Instructor)
   ELEVII MEI
    Studenți · Grupuri · Obiective · Mesaje · Analiză · Rapoarte
   CONȚINUT (preview)
    Practică · Simulări
   Notificări · Setări
── ascunse: concepte de elev (Gamificare/Progres propriu, etc.)
```

| Funcție | Status | Note |
|---|---|---|
| Prezentare (hub) | ✅ | carduri studenți/grupuri/obiective/mesaje + activitate recentă |
| Studenți | ✅ | carduri + badge RISC (euristic, 6 factori) + sortare risc/acuratețe/nume; detaliu = profil + atribuie sesiune + setează obiectiv |
| Grupuri | ✅ | CRUD + bulk export JSON |
| Obiective | ✅ | CRUD per elev + filtru active/completate |
| Mesaje | ✅→🔨 | inbox chat; **DOAR in-app** — scoate email/WhatsApp/SMS (decizie user 2026-06-04) |
| Analiză | ✅ | risc agregat euristic (NU AI/ML) |
| Rapoarte | 🟡→🔨 | azi DUMP CSV/JSON brut; vision = raport narativ PDF/HTML stilizat |
| Conținut: Practică | ✅ | de fapt /instructor/questions (CRUD bancă întrebări) |
| Conținut: Simulări | ✅ | exam-bank read (26 papers) |

- **🔨 recomandare Studenți/Analiză**: azi text generic pe prag (>70% „intervenție imediată"); vision = sinteză AI concretă per elev.

### Meditator — câștiguri (BANI, nu credit) + Conținut — decizie user 2026-06-04
**Cerință user (verbatim, NU reformulată)**:
> similar cu creatorul de continut, meditatorul trebuie stimulat sa foloseasca aplicatia si sa o recomande si elevilor/parintilor. El poate castiga bani din aplicatie si prin Invita si castiga - sa primeasca 50% din abonamentul minim pentru fiecare elev in primele 3 luni de plata ale elevului sau parintelui (dupa caz)
> continut - Practica - instructor questions - daca sunt anumite instructiuni pe care le face/selecteaza Meditatorul e OK. Daca insa discutam despre materiale auxiliare (continut pus direct de catre meditator) la care se aboneaza elevul/studentul sau aboneaza parintele printr-un pachet, atunci acela e un castig suplimentar perpetuu pentru meditator cu 50% din cat plateste elevul sau parintele. Trebuie explicat clar in pagina sa de meditator.

- **Mesaje DOAR in-app** (fără email/WA/SMS).
- **Câștig 1 — Invită și câștigă**: 50% din **abonamentul invitatului** (aliniat cu clienții; NU „minim"), per elev, în **primele 3 luni** de plată ale elevului/părintelui (după caz). = **BANI**.
- **Câștig 2 — Conținut** = **ACELAȘI mecanism ca Creator §286** (nu unul separat): materiale puse direct de meditator, abonate prin pachet → 50% **PERPETUU** din plata cumpărătorului = **BANI**. Meditatorul-care-publică = creator. (Distinct de instructor-questions pe care le selectează/creează ca parte din predare = fără plată extra.)
- **Trebuie explicat CLAR în pagina lui de meditator.**

---

## 💰 Matricea câștigurilor pe roluri (UNIFICAT 2026-06-04)
**Cerință user (verbatim, NU reformulată)** — unificarea referral elev+părinte:
> da, era deliberat - in functie de rol, era diferit. Insa, ce facem daca si elevul si parintele/parintii fac invitatii si ele se concretizeaza - ar fi mai bine sa se cumuleze ca si credite pe familie, dar ii confuzam pe oameni. Hai mai bine sa unificam la echivalentul a 50% credite pe primele 3 luni din abonamentul pe care il face invitatul, indiferent daca e parinte sau copil. Se cumuleaza la familie sau la copil. Si e in linie si cu castigul meditatorului (doar ca el nu plateste, ci incaseaza banii in cont)

| Rol | Mecanism | Reward | Tip | Durată | Acumulare |
|---|---|---|---|---|---|
| **ELEV + PĂRINTE** (clienți) | invită (oricine) | 50% din abonamentul invitatului | **credit** | primele 3 luni | la familie SAU la copil |
| MEDITATOR | invită elev/părinte | 50% din abonamentul invitatului | **bani** | primele 3 luni | cont meditator |
| **CREATOR** (= și meditatorul care publică conținut) | conținut auxiliar (pachet) | 50% din plata cumpărătorului | **bani** | **perpetuu** | cont |

- **Model referral UNIFICAT**: 50% × primele 3 luni din abonamentul invitatului, **indiferent de rolul invitatorului** (înlocuiește vechile „1-lună-gratis-elev" + „50%-prima-lună-părinte").
- **Split clienți vs profesioniști**: elev/părinte = **CREDIT** (aplicat pe abonament, acumulat la familie sau copil); meditator/creator = **BANI** (payout în cont).
- **Aritmetică confirmată (user 2026-06-04)**: creditul acoperă abonamentul până se epuizează (ex. 120 credit / 75 abonament → luna 1 = 0, luna 2 = 75−45 = **30**, nu 45).
- ✅ **Bază aliniată (user 2026-06-04)**: TOATE referral = 50% din abonamentul **ACTUAL** al invitatului (nu „minim"). Reziduul minim-vs-actual = REZOLVAT.
- ✅ **Conținut = UN singur mecanism (user 2026-06-04)**: „meditator conținut auxiliar" și „Creator §286" sunt ACELAȘI lucru (50% perpetuu pe plata cumpărătorului) — NU se plătește de 2 ori. Meditatorul care publică conținut = creator.
- **→ doar 2 TIPURI de earning**: (A) **Referral** = 50% din abonamentul invitatului, primele 3 luni (credit la clienți / bani la meditator); (B) **Conținut** = 50% din plata cumpărătorului, perpetuu, bani (creator/meditator-publică). Ambele cer **un motor unificat de earnings/credit**.

### Condiție esențială de acumulare (user 2026-06-04)
**Cerință user (verbatim, NU reformulată)**:
> Conditia esentiala oferirii creditelor (elev/parinte/familie) sau a banilor in cont (meditator) este ca invitatul sa fi platit deja (fie pentru luna in curs, fie pentru lunile respective). Deci, de fiecare data se plateste pro rata din incasari - dar pe maximum de 3 luni pentru invitatii sau perpetuu (lunar, indiferent de cum plateste elevul/parintele) pentru creatorii de continut.

- Earning-ul **accruează DOAR pe plată efectiv încasată** (nu la „invitație concretizată" în avans). **Pro rata din încasări**, lună de lună.
- **Referral** = 50% pe **fiecare lună plătită efectiv**, plafonat la **max 3 luni**. Dacă invitatul renunță după luna 1 → se acordă doar 50% pe luna 1.
- **Creator conținut** = 50% pe **fiecare lună plătită**, **perpetuu**.

### ⚖️ Refund / clawback — drepturi consumator (user 2026-06-04, ridicat ca risc)
**Cerință user (verbatim, NU reformulată)**:
> Avem o problema - mi se pare ca conform drepturilor consumatorului, fiecare abonat are dreptul sa se razgandeasca si sa isi ceara banii inapoi? Daca e asa, atunci trebuie facute rectificarile respective si pentru creditele primite sau/si banii primiti de creatori.

- **Onest, NU consultanță juridică** — termenii exacți trăiesc în **Legal** (`legal.knowbest.ro`, NO-TOUCH CRITIC) + ToS. RO/UE: drept de retragere 14 zile la distanță (OUG 34/2014 / Dir. 2011/83), DAR **renunțabil** pentru servicii/conținut digital cu consimțământ expres la începere imediată + recunoașterea pierderii dreptului. Plus refund/chargeback oricând.
- **Cerință de inginerie (indiferent de termeni)**: motorul de earnings **TREBUIE să suporte CLAWBACK** — la refund al plății-sursă, earning-ul derivat (credit SAU bani) se **stornează**.
- Cod azi: `ReferralEarning` are deja **hold 30 zile** (PENDING→PAYABLE→PAID) = buffer anti-refund pentru bani. **De adăugat**: reversal credit (inclusiv recuperare dacă creditul a fost deja consumat → sold negativ / dedus din viitor) + reversal payout post-PAID (recuperare).
- **Dependență Legal**: politica de refund + waiver dreptul de retragere se definește în Legal hub, nu aici.

---

# 🎯 Capabilități de construit (comune pe roluri)

1. **🔨 Strat de sinteză narativă AI** (peste `WeakArea` + `Attempt`) — alimentează Monitorizare-sinteză (părinte) + Analiză-recomandare + Rapoarte-narativ (meditator).
2. **🔨🏆 Baterie de teste remediale (AI) — PUNCTUL FORTE** — AI caută + creează teste exact pe punctele slabe ale copilului (vezi Monitorizare). Depinde de #4 (tag-uire fină).
3. **🔨🏗️ Tag-uire la IMPORT** (decizie arhitecturală) — concept fin („cos 30°", „discriminant") generat de AI la ingest, nu post-hoc. Face #1 + #2 precise. Conectează Content Quality Mesh §278 + §188. **Premisă pentru sinteză + baterie remedială.**
4. **🔨 Logica de escaladare/praguri** — pentru Alerte (nivel configurabil de părinte: oră / 6/12/24/48h; escaladarea NU după 4 zile = doar în sumar).
5. **🔨 Motor unificat de earnings/credit** — DOAR 2 tipuri (vezi „Matricea câștigurilor"): **(A) Referral** = 50% din abonamentul invitatului, primele 3 luni — credit la elev+părinte (acumulat la familie/copil), bani la meditator; **(B) Conținut** = 50% din plata cumpărătorului, perpetuu, bani (creator = și meditatorul care publică, ACELAȘI mecanism §286). Înlocuiește comisionul universal de azi. **Accruează DOAR pe plată încasată (pro-rata, lună de lună); suportă CLAWBACK la refund (storno credit/bani — inclusiv recuperare credit deja consumat). Hold 30 zile existent. Dependență Legal (legal.knowbest.ro) pentru politica refund/retragere.**
6. **🔨 Conținut creator/meditator (revenue-share §286)** — cine publică materiale auxiliare vândute prin pachet (creator SAU meditator) → 50% perpetuu (bani), ACELAȘI mecanism (nu se plătește de 2 ori). Conținut nou + abonare pe pachet + split la plată.
7. **🔨 Setări → Notificări: pachet + delegare** (vezi roadmap mai jos).

# Roadmap — Setări → Notificări (developments, NU în meniul Notificări)
**Cerință user (verbatim):**
> extindere SubscriptionPlan cu compoziție (seat-uri: maxParinti/maxMeditatori + canale incluse per pachet);
> model de delegare (toggle în Setări părinte: „le fac eu pentru copil" / „lasă copilul să și le facă singur");
> gating canale pe pachet;
> tranziție la upgrade pachet (copil-only → +părinți +meditator: provizionezi seat-urile noi + default prefs).

Stare azi: `SubscriptionPlan` e generic (nume/preț/interval/features JSON) — fără compoziție/seats. `NotificationPreference` = self-only, fără delegare, fără gating pe pachet. Tot blocul = 0% construit.
