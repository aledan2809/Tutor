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

**Status azi**: codul actual (`src/lib/referral.ts`) face comision 50% cash perpetuu + voucher −25% pentru invitat. Modelul de **credit/lună-gratis NU există** — e muncă nouă (mecanism de credit lună aplicat la subscription + landing page cu detalii). Vezi TODO item dedicat.

### Decizie 3 — Notificări (elev) = doar istoric, rămâne. Dezvoltările → Setări → Notificări (vezi roadmap pachet/delegare mai jos).

---

# 👪 ROL 2 — PĂRINTE  (mockup propus; feedback parțial)

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

- Mecanică: credit = **50% din echivalentul PRIMEI luni** a invitatului (chiar dacă invitatul plătește în avans pe 1 an), acumulat și aplicat pe abonamentul propriu lunar până se epuizează.
- ⚠️ **De confirmat — aritmetică**: cu regula „creditul acoperă integral abonamentul până se epuizează", exemplul 3×80→120 credit / 75 lei abonament dă: luna 1 = 0 (rămân 45), luna 2 = 75−45 = **30 lei** (user a scris 45). De fixat regula exactă.
- ❓ **De confirmat — diferă de ELEV**: elev = **1 lună gratis** (≈100% din lună); părinte = **50% din prima lună** credit. Intenționat diferite pe persona sau unificăm pe 50%-credit pentru toți?

### Notificări (istoric) ✅ — **5 canale** = Push (web/browser) · WhatsApp · SMS · Email · Apel (telefonic); **fus** = fus orar (ca orele de liniște să se aplice corect). · Setări (generic azi) — vezi roadmap pachet/delegare.

---

# 👨‍🏫 ROL 3 — MEDITATOR  (mockup propus; feedback parțial)

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
| Mesaje | ✅ | inbox chat + compose (in_app/email/WhatsApp/SMS) |
| Analiză | ✅ | risc agregat euristic (NU AI/ML) |
| Rapoarte | 🟡→🔨 | azi DUMP CSV/JSON brut; vision = raport narativ PDF/HTML stilizat |
| Conținut: Practică | ✅ | de fapt /instructor/questions (CRUD bancă întrebări) |
| Conținut: Simulări | ✅ | exam-bank read (26 papers) |

- **🔨 recomandare Studenți/Analiză**: azi text generic pe prag (>70% „intervenție imediată"); vision = sinteză AI concretă per elev.
- ❓ decizie: meditatorul vede „Practică" elev-style sau „Întrebări" admin-style?

---

# 🎯 Capabilități de construit (comune pe roluri)

1. **🔨 Strat de sinteză narativă AI** (peste `WeakArea` + `Attempt`) — alimentează Monitorizare-sinteză (părinte) + Analiză-recomandare + Rapoarte-narativ (meditator).
2. **🔨🏆 Baterie de teste remediale (AI) — PUNCTUL FORTE** — AI caută + creează teste exact pe punctele slabe ale copilului (vezi Monitorizare). Depinde de #4 (tag-uire fină).
3. **🔨🏗️ Tag-uire la IMPORT** (decizie arhitecturală) — concept fin („cos 30°", „discriminant") generat de AI la ingest, nu post-hoc. Face #1 + #2 precise. Conectează Content Quality Mesh §278 + §188. **Premisă pentru sinteză + baterie remedială.**
4. **🔨 Logica de escaladare/praguri** — pentru Alerte (nivel configurabil de părinte: oră / 6/12/24/48h; escaladarea NU după 4 zile = doar în sumar).
5. **🔨 Referral credit model** — elev = 1 lună gratis; părinte = 50% din prima lună ca credit (de confirmat dacă se unifică). Înlocuiește comisionul; vezi deciziile per rol.
6. **🔨 Setări → Notificări: pachet + delegare** (vezi roadmap mai jos).

# Roadmap — Setări → Notificări (developments, NU în meniul Notificări)
**Cerință user (verbatim):**
> extindere SubscriptionPlan cu compoziție (seat-uri: maxParinti/maxMeditatori + canale incluse per pachet);
> model de delegare (toggle în Setări părinte: „le fac eu pentru copil" / „lasă copilul să și le facă singur");
> gating canale pe pachet;
> tranziție la upgrade pachet (copil-only → +părinți +meditator: provizionezi seat-urile noi + default prefs).

Stare azi: `SubscriptionPlan` e generic (nume/preț/interval/features JSON) — fără compoziție/seats. `NotificationPreference` = self-only, fără delegare, fără gating pe pachet. Tot blocul = 0% construit.
