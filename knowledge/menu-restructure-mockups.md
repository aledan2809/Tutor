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
   Recomandă       ← (decizie deschisă: comision vs credit la părinte)
   Notificări
   Setări
── ascunse: fluxul de învățare al elevului (Practică/Simulări/Progres/...)
```

### Monitorizare (piesa centrală)
- **✅ azi**: listă copii + carduri metrici (acuratețe, serii, puncte, nivel) + top 3 zone slabe + istoric examene + sesiuni recente. RAW metrics.
- **🔨 de construit (visiune user)**: „se fac rapoarte, sinteze si se dau si exemple de zone cu probleme (ex. greseli frecvente la ecuatiile de gradul 2, reparat formulele trigonometrice cu cos 30, etc)" — strat de **sinteză narativă AI** + **exemple concrete** de zone cu probleme.
- **Atenție granularitate**: `WeakArea` are doar materie/topic. „cos 30°" / „discriminant" cer fie tag-uire mai fină a întrebărilor, fie analiză AI a răspunsurilor greșite (`Attempt`).

### Alerte
- **🟡 azi**: UI listă notificări clasificate + mark-read. Logica de declanșare (`EscalationThreshold`/`EscalationEvent`) e stub/externă.
- **🔨**: pragurile (când se declanșează) + cine le setează.

### Recomandă / Invită (părinte)
- ❓ decizie deschisă: la părinte (adult) păstrăm comision cash 50% SAU tot model credit ca la elev?

### Notificări (istoric) ✅ · Setări (generic azi) — vezi roadmap pachet/delegare.

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

1. **🔨 Strat de sinteză narativă AI** (peste `WeakArea` + `Attempt`) — alimentează Monitorizare-sinteză (părinte) + Analiză-recomandare + Rapoarte-narativ (meditator). Decizie: granularitate fină prin tag-uire întrebări vs analiză AI a greșelilor.
2. **🔨 Logica de escaladare/praguri** — pentru Alerte (cine setează, când se declanșează).
3. **🔨 Referral credit model** (elev) — înlocuiește comisionul; vezi Decizie 2.
4. **🔨 Setări → Notificări: pachet + delegare** (vezi roadmap mai jos).

# Roadmap — Setări → Notificări (developments, NU în meniul Notificări)
**Cerință user (verbatim):**
> extindere SubscriptionPlan cu compoziție (seat-uri: maxParinti/maxMeditatori + canale incluse per pachet);
> model de delegare (toggle în Setări părinte: „le fac eu pentru copil" / „lasă copilul să și le facă singur");
> gating canale pe pachet;
> tranziție la upgrade pachet (copil-only → +părinți +meditator: provizionezi seat-urile noi + default prefs).

Stare azi: `SubscriptionPlan` e generic (nume/preț/interval/features JSON) — fără compoziție/seats. `NotificationPreference` = self-only, fără delegare, fără gating pe pachet. Tot blocul = 0% construit.
