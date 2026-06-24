# Gap Analysis — Strategie vs. Cod (Tutor / etutor.ro)

**Data:** 2026-06-20
**Tip:** Introspecție read-only (analiză, zero modificări de cod)
**Proiect:** Tutor — platformă de meditații + învățare adaptivă, LIVE la https://etutor.ro
**Bază de cod măsurată azi:** 84 pagini (`page.tsx`), 122 rute API (`route.ts`), 55 modele Prisma, ~40 fișiere în `src/lib`.

---

## 🗣️ Pe înțelesul tău + implicații (non-tehnic)

Gândește-te la Tutor ca la o școală digitală cu 4 tipuri de oameni înăuntru: **elevul** (învață), **părintele/Watcher** (plătește și supraveghează), **meditatorul/Instructor** (predă, urmărește, alertează) și **administratorul** (umple platforma cu conținut). Verdictul scurt după ce am citit tot codul:

**Vestea bună — motorul e construit și e mult mai bogat decât pare la prima vedere.** Ai deja:
- un sistem de **învățare inteligent** (repetiție la intervale optime, 6 tipuri de sesiuni, simulări de examen cu certificat),
- un **strat viral** complet (quiz gratuit fără cont, duel cu un prieten, card de scor de pus pe WhatsApp, program de referral cu comision 50%),
- un **sistem de „chasing" pe 6 trepte** (push gratis → WhatsApp → SMS → email → apel) care urmărește copilul când nu mai învață,
- **281 de grile de Bacalaureat la Matematică (M1/M2/M3) + 47 de simulări complete + 75 grile la Română** — conținut real, verificat manual, nu „umplutură".

**Vestea care cere atenție — strategia ta scrisă (STRATEGY.md) e RĂMASĂ ÎN URMA codului în unele zone, și ÎNAINTEA lui în altele.**

1. **Codul a depășit strategia (drift bun).** Multe lucruri pe care strategia le marchează „de făcut în Faza 5/6/7" sunt deja LIVE: viral layer (Faza 0 — complet), referral (Faza 7 — funcțional), escaladare multi-canal (descris ca „existent parțial", de fapt complet construit + Telegram gratuit pe deasupra), banca de examene oficiale BAC/EN. **Implicație:** nu ai un produs „de construit", ai un produs **de povestit corect și de pornit motorul**. Documentația trebuie ridicată la nivelul codului, nu invers. Nu se taie nimic.

2. **Strategia promite lucruri pe care codul NU le are încă (gap real).** Cel mai important: **„Family Pack" — legătura clară Părinte→Copil**. Pe pagina de prețuri vinzi planuri „Family / Duo / Trio" (un părinte, doi părinți, plus meditator) — DAR în cod **nu există încă o legătură explicită părinte↔copil**. În momentul de față, un părinte vede TOȚI elevii înscriși la aceeași materie, nu doar copilul lui. Asta e și o problemă de **corectitudine/intimitate**, nu doar o funcție lipsă. **Implicație:** vinzi un pachet de familie a cărui „instalație electrică" încă nu e trasă — prioritate maximă înainte de a împinge planurile de familie la public.

3. **Motorul de retenție (escaladarea) e construit dar OPRIT (dormant).** Sistemul care urmărește copilul și-l readuce la învățat e gata, dar e „pe pauză" în producție (un comutator e pe `false`, iar „ceasul" care-l pornește la fiecare 15 minute nu e programat pe server). **Implicație:** ai cumpărat o mașină scumpă și o ții în garaj. Activarea ei (cu grijă, ca să nu trimită mesaje pe spate la elevi reali) e cel mai ieftin câștig mare disponibil.

4. **Banii nu circulă încă în ambele sensuri.** Încasezi prin Stripe (abonamente, vouchere) — DAR **plata efectivă a comisioanelor către promotori/creatori NU e construită** (Stripe Connect/payout lipsește), iar **facturarea automată românească (SmartBill) lipsește**. **Implicație:** poți recruta promotori și creatori, dar momentan nu le poți vira banii automat — e o promisiune pe care platforma încă n-o poate onora singură.

**Pe scurt:** Tutor e un produs **mai matur decât crede propria strategie** pe partea de motor + achiziție, dar are **3-4 „țevi nelegate" pe partea de bani și de relații de familie** care trebuie conectate înainte de scalare. Niciuna nu cere reconstrucție — toate sunt „de finalizat ce a fost început".

---

## (a) Promis în strategie, DAR lipsește în cod

> Regula: aici listez ce STRATEGY.md/knowledge promit explicit și nu există ca implementare funcțională în cod azi.

| # | Promisiune (sursă) | Stare reală în cod | Dovadă |
|---|---|---|---|
| A1 | **Family Pack / legătură Părinte→Copil explicită** (`STRATEGY.md` Faza 2: `FamilyGroup`/`FamilyMember`; `knowledge/MONETIZATION-FAMILY-PLANS.md` §1 „DE CONSTRUIT (nou): legătura Părinte↔Copil↔Meditator + multi-părinte") | **LIPSEȘTE.** Niciun model `FamilyGroup`/`FamilyMember`/`Guardian`. Watcher-ul vede copiii prin co-înscriere la aceeași materie. | `grep '^model (Family\|Guardian\|...)' prisma/schema.prisma` → 0 hits. `src/app/api/dashboard/watcher/route.ts`: „Get all students enrolled in these domains" — filtrează pe `domainId`, nu pe relație părinte-copil. |
| A2 | **Watcher vede DOAR copilul/copiii lui** (model „control parental", `STRATEGY.md` §1, §5 principiu 5 „transparență pentru părinți") | **GAP de corectitudine.** Watcher-ul vede toți elevii cu rol STUDENT din domeniile unde el are rol WATCHER — nu există filtrare per copil. | `src/app/api/dashboard/watcher/route.ts:34-40` — `where: { domainId: { in: domainIds }, roles: { hasSome: ["STUDENT"] }, userId: { not: userId } }`. Nicio condiție de legătură 1:1. |
| A3 | **Plata comisioanelor (payout real) către promotori** (`STRATEGY.md` §7 model `ReferralPayout`; Tier 2 „Deferred: transfer real de bani — Stripe Connect/payout") | **LIPSEȘTE.** Comisionul se *acumulează* (`ReferralEarning`) dar nu se *plătește*. Niciun Stripe Connect / payout. | Niciun model `ReferralPayout` în schema. `grep -rl Connect\|payout src/app/api` → doar fișiere telegram (fals pozitiv). `src/lib/referral.ts` acumulează, nu virează. |
| A4 | **Revenue-share creatori (plată pro-rata pe consum)** (`knowledge/creator-program-plan.md` §1) | **PARȚIAL.** Există `/creatori` (waitlist) + `CreatorWaitlist`, dar **fără** motor de atribuire pe consum + fără payout. | `CreatorWaitlist` model există; niciun model de „creator earnings pe consum". Plan marcat „execution DEFERRED". |
| A5 | **Facturare automată RO — SmartBill API** (`STRATEGY.md` Faza 5 mecanică) | **LIPSEȘTE.** Zero referință SmartBill. | `grep -rl -i smartbill src/` → 0 hits. |
| A6 | **Marketplace de meditatori** (profil public, search/filter, booking, reviews/rating — `STRATEGY.md` Faza 3) | **LIPSEȘTE.** Niciun model Booking/Review/Rating/profil public instructor. | `grep '^model (Booking\|Review\|Marketplace)'` → 0. Instructor are doar `Group`, `InstructorGoal`, `InstructorMessage`, `EscalationThreshold`. |
| A7 | **Lecții multimedia (video embed, imagini, audio TTS, drawing board, Lesson Player)** (`STRATEGY.md` Faza 1) | **PARȚIAL.** `Lesson`/`LessonProgress` există + viewer Markdown (`/dashboard/lessons/[id]`), dar fără câmpuri `videoUrl`/`thumbnailUrl`/`attachments` și fără player video/TTS/whiteboard. | `src/app/[locale]/dashboard/lessons/[id]/page.tsx` randează Markdown; modelul `Lesson` nu are câmpurile media promise. |
| A8 | **AI Tutor / Homework Scanner / Concept Explainer / Study Plan generator** (`STRATEGY.md` Faza 6) | **LIPSEȘTE (ca produs pentru elev).** `src/lib/ai-tutor.ts` e doar generator de întrebări pentru admin (stub), NU chat-pe-întrebare / scanner temă pentru elev. | `src/lib/ai-tutor.ts` — o singură funcție `generateQuestions()`, fără DB, fără chat. Nicio rută elev de tip „explică-mi". |
| A9 | **Gift cards** (`STRATEGY.md` Faza 5) | **LIPSEȘTE.** Voucher există; gift card (cumperi credit, altcineva alege materiile) nu. | `Voucher` model există; niciun model/route „gift card". |
| A10 | **Schimbare materii oricând cu facturare pro-rata** (`STRATEGY.md` Faza 5) | **NEVERIFICAT/probabil parțial.** Există `/dashboard/domains` (enroll self-service) + `Payment`, dar mecanica pro-rata la mijloc de lună nu apare explicit. | `src/app/[locale]/dashboard/domains/page.tsx` — enroll, dar fără logica pro-rata vizibilă. |

---

## (b) Construit, DAR nedocumentat — DRIFT (codul e mai avansat decât strategia)

> **Regula critică:** unde codul e mai avansat decât strategia, **STRATEGIA e cea învechită**. NU se recomandă tăierea/eliminarea funcțiilor. Driftul se încadrează ca **„documentație/strategie de ridicat la nivelul codului"**.

| # | Ce e construit (cod real) | Cum apare în strategie | Acțiune recomandată (ridicare doc) |
|---|---|---|---|
| B1 | **Strat viral COMPLET** — Magic Quiz public fără cont, persistare, duel (`/duel/[id]`), card OG de scor (`/api/og/score`, `/scor`), certificat partajabil (`/certificat/[id]`), lazy-save la signup. | În `STRATEGY.md` „Faza 0" e marcat în mare parte `[x]` LIVE — aici e ALINIAT. Bun. Dar **Faza 7 „Social Features / Challenge a friend"** apare ca viitor, deși duelul e deja LIVE. | Marchează în Faza 7 că „Challenge a friend (duel)" e DEJA LIVE (cross-ref Faza 0 Tier 1). |
| B2 | **Escaladare 6 niveluri COMPLET + segmentare free/paid + Telegram gratuit ca alternativă la WhatsApp plătit.** `src/lib/escalation/{engine,config,segmentation,timing}.ts`, wired pe `@aledan/notify-ladder`, fallback Telegram. | `STRATEGY.md` §3 zice „Escalation System (6 nivele)" ca „existent" — dar nu menționează segmentarea free/paid (cap 4 atingeri WhatsApp + zid de upgrade) nici canalul Telegram gratuit. | Ridică §3: documentează segmentarea free/paid + canalul Telegram (lever de cost real). |
| B3 | **Conținut BAC masiv real** — 281 grile Matematică (M1=83 + M2=96 + M3=102) + 47 simulări full-paper + 75 grile Română BAC + grile EN VIII. Toate verbatim din barem CNPEE, verificate manual. | `STRATEGY.md` Faza 4 „Curriculum Românesc" e tot `[ ]`. Realitatea: e deja mult depășită pe Mate+Română BAC. | Mută în Faza 4 statusul real: Mate BAC M1/M2/M3 + Română BAC LIVE; restul materiilor = roadmap. |
| B4 | **Content Quality Mesh (Track A) LIVE** — 3 lentile adversariale + judecător Claude CLI ($0) pe VPS + auto-fix gated, integrat în pipeline-ul de generare grile. | `STRATEGY.md` Tier 5 e marcat `[x]` Track A DONE — ALINIAT. Bun. Dar valoarea (97%+ teacher-quality gated) merită evidențiată ca diferențiator. | Ridică Tier 5 la nivel de diferențiator competitiv în §6 (vs. Kahoot/Quizlet). |
| B5 | **Exam Bank cu scoring barem oficial** (`src/lib/exam-bank/{score,sanitize}.ts`) — note 1-10 scalate, TF_GRID auto-grade, extrapolare pe atempt parțial, strip răspunsuri anti-cheat. | Apare doar implicit ca „Examen Simulator" în §3. Banca de examene oficiale cu barem e mai sofisticată decât descrierea. | Documentează Exam Bank ca produs separat (oficial, barem-anchored) în §3. |
| B6 | **Campaign attribution + linkuri campanie directe** (`/evaluare`, `/bac` → register cu voucher auto-aplicat 100%, `campaign-attribution.ts`, `CampaignSignup`). | Lipsește din STRATEGY.md (apare doar în DEV_STATUS + TODO). | Adaugă în §7 / Faza 5 mecanismul de campanii directe (voucher 100% nelimitat per campanie). |
| B7 | **Telegram connect-flow complet** (`src/lib/telegram/connect.ts`, webhook fail-closed, bot @eTUTORro_Notifications_bot LIVE). | Strategia nu menționează Telegram deloc. | Adaugă în §3 + Faza 7 canalul Telegram (gratuit, opt-in). |
| B8 | **Predictive analytics (risc abandon per elev) wired în instructor dashboard** (`src/lib/predictive-analytics.ts` + `/dashboard/instructor/analytics`). | `STRATEGY.md` Faza 8 „Churn risk" e `[ ]` viitor, dar e deja LIVE pentru instructor. | Mută în Faza 8 statusul: „risc abandon per elev = LIVE pe instructor". |
| B9 | **InfoTooltip + UX tooltips pe /dashboard/practice** (DONE 2026-06-13). | Nu e în STRATEGY.md. | Minor — ledger DEV_STATUS suficient. |

---

## (c) Reconciliere TODO

> Stare reală a celor mai relevante items din `TODO_PERSISTENT.md` + `DEVELOPMENT_STATUS.md`, verificată în cod azi.

| Item TODO | Marcaj TODO | Verificare azi | Verdict |
|---|---|---|---|
| Link campanie BAC (`/bac`) + EVALUARE (`/evaluare`) | `[x]` DONE 2026-06-12/13 | Rute `src/app/bac/route.ts` + `src/app/evaluare/route.ts` + preset `CAMPAIGNS` în register. | ✅ Confirmat construit. |
| UX tooltips `/dashboard/practice` | `[x]` DONE 2026-06-13 | `src/components/ui/info-tooltip.tsx` există. | ✅ Confirmat. |
| BAC Mate M1/M2/M3 grile + simulări | `[x]`/`[~]` DONE 2026-06-10 | 281 grile + 47 simulări (confirmat în DEV_STATUS + script-uri import). | ✅ Confirmat (DB autoritativ; verif UI walk autentificat rămas la unele — risc mic). |
| BAC Română grile (13 papers, 75 grile) | `[x]` DONE 2026-06-09 | Confirmat în TODO + script `import-grile-bac-ro.mjs`. | ✅ Confirmat. |
| Funnel re-engagement (Tutor) | În **Master** TODO `[ ]/[~]` plan | Motorul de escaladare e construit dar **dormant** (vezi P0 mai jos). Planul de funnel free/paid + WhatsApp oficial e DECIS dar NEÎNCEPUT (cod). | ⚠️ Plan da, cod nu. |
| Faza B 12 simulări M1 | DEV_STATUS „RĂMAS" | De fapt marcate DONE 13/13 mai jos în TODO. | ✅ Probabil DONE (contradicție internă DEV_STATUS vs TODO — TODO mai recent). |
| AUDIT_GAPS open | „no open gaps as of 2026-05-30" | Confirmat — ledger curat după re-audit TRUE-E2E 2026-05-30. | ✅ Curat (dar audit-ul nu acoperă gap-urile de *strategie* din acest raport). |

**Notă de reconciliere:** `DEVELOPMENT_STATUS.md` (sesiunea 2026-06-10) listează „Faza B: 12 lucrări rămase", dar `TODO_PERSISTENT.md` (mai recent) le marchează DONE. DEV_STATUS e ușor în urmă — TODO e sursa de adevăr.

---

## (d) Top 10 gap-uri prioritizate (P0/P1/P2) cu dovezi pe căi reale

### 🔴 P0 — blochează promisiuni publice deja vândute / corectitudine

**P0-1 — Lipsește legătura Părinte→Copil (Family link).**
- **Promis:** planuri Family/Duo/Trio LIVE pe `/preturi` + `/parinte`; `MONETIZATION-FAMILY-PLANS.md` §1 „DE CONSTRUIT: legătura Părinte↔Copil↔Meditator".
- **Realitate:** niciun model de legătură; watcher-ul vede toți elevii din domeniu.
- **Dovadă:** `prisma/schema.prisma` (0 modele Family/Guardian); `src/app/api/dashboard/watcher/route.ts:34-40`.
- **Impact:** vinzi un pachet a cărui mecanică de bază nu există + risc de intimitate (părinte X vede copilul părintelui Y).

**P0-2 — Watcher leakage: un părinte vede copiii altor părinți.**
- **Realitate:** filtrarea e pe `domainId`, nu pe relație părinte-copil.
- **Dovadă:** `src/app/api/dashboard/watcher/route.ts` — query fără condiție de legătură.
- **Impact:** GDPR / intimitatea minorilor (principiu §8 „Privacy by design / copii sub 16"). Decurge din P0-1 dar e raportat separat pentru că e risc de *date*, nu doar funcție lipsă.

**P0-3 — Motorul de escaladare/retenție e construit dar DORMANT în producție.**
- **Realitate:** `ESCALATION_DETECT_ENABLED` implicit `false` + cron-ul `/api/cron/escalation` neprogramat pe server.
- **Dovadă:** `src/lib/escalation/` (complet), `src/app/api/cron/escalation/` (există ca endpoint), DEV_STATUS Master menționează cron neprogramat. `sendPushNotification` întoarce mereu `true` (landmine: la configurarea WhatsApp, lanțurile dormante pot erupe pe elevi reali — vezi Master TODO „Tutor re-engagement FUNNEL").
- **Impact:** cea mai mare valoare de retenție stă oprită; activarea greșită = furtună de mesaje retroactivă.

### 🟠 P1 — blochează monetizarea reală / scalarea

**P1-1 — Payout real comisioane lipsește (Stripe Connect / `ReferralPayout`).**
- **Promis:** `STRATEGY.md` §7 `ReferralPayout`; `/creatori` promite ~50% comision perpetuu.
- **Realitate:** doar acumulare (`ReferralEarning`); zero transfer.
- **Dovadă:** niciun model `ReferralPayout`; `src/lib/referral.ts` (acumulează).
- **Impact:** nu poți onora promisiunea de plată către promotori/creatori → recrutarea creatorilor e blocată practic.

**P1-2 — Facturare RO automată (SmartBill) lipsește.**
- **Dovadă:** `grep -i smartbill src/` → 0.
- **Impact:** la primii clienți plătitori reali, facturarea e manuală → frână operațională + conformitate fiscală RO.

**P1-3 — Activare conturi/abonament: fluxul `/dashboard/activare` + pro-rata schimbare materii neclar.**
- **Dovadă:** `/dashboard/activare/page.tsx` (voucher) + `/dashboard/domains` (enroll), dar fără logică pro-rata la mijloc de lună (promisă Faza 5).
- **Impact:** „schimbi materii oricând" (argument de vânzare) nu e garantat corect la facturare.

**P1-4 — Verificare UI autentificat lipsă pe o parte din conținutul BAC nou importat.**
- **Dovadă:** TODO repetat „TODO verif autentificat UI walk (login SuperAdmin) — neefectuat" pe simulările M1/M2/M3.
- **Impact:** DB autoritativ, dar randarea în UExamRunner pentru itemii OPEN cu rubrici n-a fost plimbată manual pe toate → risc mic de afișare ruptă neprins.

### 🟡 P2 — îmbunătățiri de produs / aliniere doc

**P2-1 — Lecții multimedia (video/imagini/TTS/player) — Faza 1 neînceput.**
- **Dovadă:** `Lesson` model fără câmpuri media; `/dashboard/lessons/[id]` randează doar Markdown.
- **Impact:** lecțiile rămân text — diferențiere slabă vs. Khan/YouTube.

**P2-2 — STRATEGY.md în urma codului (drift de documentație, vezi secțiunea b).**
- **Dovadă:** Faza 4/7/8 marcate `[ ]` deși părți sunt LIVE (conținut BAC, duel, predictive analytics).
- **Impact:** strategie înșelătoare → decizii pe hartă veche. **Acțiune = ridicare doc, nu tăiere cod.**

---

## Concluzie

Tutor are un **motor de produs matur** (învățare adaptivă + viral layer + escaladare + conținut BAC real) care în mai multe zone **a depășit propria strategie scrisă**. Cele 3 priorități P0 nu sunt „funcții lipsă de inventat", ci **țevi de conectat la ce există deja**: (1) legătura Părinte→Copil, (2) etanșarea vizibilității watcher-ului, (3) pornirea controlată a motorului de retenție. Pe P1, banii trebuie să poată circula în ambele sensuri (payout + facturare RO). Restul e ridicarea documentației la nivelul codului — **fără a tăia nimic din ce e construit**.

---

*Generat read-only pe 2026-06-20. Dovezi pe căi reale; zero modificări de cod.*
