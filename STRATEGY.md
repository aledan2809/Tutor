# Tutor — Strategie & Roadmap
**Ultima actualizare:** 2026-04-15
**Versiune:** 1.0

## Changelog
- [2026-04-15] v1.1: Adăugat Referral Engine (comision perpetuu, 2 nivele, anti-fraud), Content Sourcing (surse gratuite, plan 2 săpt), IVP (Instructor Verification Program cu incentive stacking)
- [2026-04-15] v1.0: Document inițial — viziune, piață, features actuale, roadmap pe faze

---

## 1. VIZIUNE

**Tutor** este o platformă SaaS de meditații și învățare adaptivă, destinată familiilor cu copii de școală.

**Propunere de valoare:**
> Părinții plătesc un abonament lunar prin care primesc control și vizibilitate totală asupra progresului copilului, acces la meditatori profesioniști, și un sistem inteligent care adaptează materia la nevoile copilului.

**Modelul de roluri:**
| Rol | Cine | Ce face |
|-----|------|---------|
| **Student** | Copilul | Învață, practică, dă examene, câștigă XP |
| **Instructor** | Mediatorul/Profesorul | Creează conținut, urmărește elevii, trimite mesaje, setează obiective |
| **Watcher** | Părintele | Monitorizează progresul, primește alerte, vede rapoarte, plătește |
| **Admin** | Operatorul platformei | Gestionează totul, configurează domenii, planuri, utilizatori |

**Diferențiatori față de competiție (Kahoot, Quizlet, Brainly):**
1. **Escaladare automată** — dacă copilul nu învață, părintele și mediatorul sunt alertați automat (push → WhatsApp → SMS → email → apel)
2. **Spaced repetition** (SM-2) — nu doar quiz-uri, ci învățare optimizată științific
3. **Trio coordonat** — student + mediator + părinte lucrează împreună, nu independent
4. **Conținut localizat** — curriculum românesc (BAC, Evaluare Națională, materii specifice)
5. **AI integrat** — generare automată de întrebări din orice material de studiu

---

## 2. PIAȚA ȚINTĂ

### Segment primar: Familii cu elevi clasa 5-12 (România)
- **Mărime**: ~1.5M elevi în clasele 5-12, ~60% au meditații private
- **Pain points**: 
  - Părinții nu știu ce face copilul la meditații
  - Meditatorii nu au instrumente digitale
  - Copiii uită materia între sesiuni
  - Prețuri mari pentru meditații (150-300 RON/h) fără metrics

### Segment secundar: Școli de pilot / certificări profesionale
- Deja funcțional (domeniul Aviation)
- Nișă valoroasă (preț mai mare, B2B)

### Segment terțiar: Cursuri corporate / onboarding
- Training angajați cu quizuri adaptive
- Compliance testing cu certificate

---

## 3. CE EXISTĂ ACUM (Fundația)

### Core Learning Engine
- Spaced Repetition (SM-2) — revizuire optimizată temporal
- 6 tipuri de sesiuni: micro, quick, deep, repair, recovery, intensive
- Selecție adaptivă a întrebărilor (review due + noi + weak areas)
- Daily Challenge cu XP dublu

### Gamification
- XP, Nivele (Cadet → Captain → Instructor), Streaks
- Achievements (first_blood, perfect_score, marathon_7, etc.)
- Leaderboard săptămânal per domeniu
- Daily Challenges

### Examen Simulator
- Formate configurabile per domeniu (timp, nr. întrebări, passing score)
- Moduri: Practice vs Real
- Generare certificat PDF
- Istoric + trends (passRate, bestScore)

### Content Management
- Import: PDF, DOCX, CSV, Imagini (OCR + AI Vision 2-step)
- **Generare din teorie**: Upload material → AI creează întrebări
- AI Generate: Creeare întrebări de la zero cu AI
- Review Queue: DRAFT → APPROVED → PUBLISHED
- Subjects/Topics management

### Escalation System (6 nivele)
- L1: Push in-app → L2: WhatsApp friendly → L3: WhatsApp cu stats → L4: SMS → L5: Email instructor → L6: Call trigger
- Smart timing (quiet hours, optimal study time)
- Channel preferences per user
- Auto-cancel la reluarea activității

### Instructor Dashboard
- Roster elevi cu stats
- Predictive failure detection (% risc abandon)
- Mesagerie multi-canal (in-app, WhatsApp, SMS, email)
- Goal setting per elev
- Grupuri/clase

### Auth & Roles
- Google OAuth + Email Magic Link + Credentials
- Multi-rol per user per domeniu
- JWT cu refresh automat din DB

### Monetizare (parțial)
- Stripe integration (planuri, checkout)
- Voucher system (discount codes)
- Revenue dashboard

### Deployment
- VPS2 (tutor.knowbest.ro), PM2, Neon PostgreSQL
- i18n RO/EN, PWA, Rate limiting, Security headers

---

## 4. ROADMAP PE FAZE

### FAZA 1 — Rich Content & Media (1-2 săptămâni)
**Obiectiv:** Lecțiile devin multimedia — nu doar text Markdown.

**Features:**
- [ ] **Video embed în lecții** — YouTube/Vimeo iframe în Markdown (`![video](https://youtube.com/...)`)
- [ ] **Imagini în lecții** — upload direct sau URL extern, render inline
- [ ] **Explicații video pe întrebări** — câmp `explanationVideoUrl` pe Question model
- [ ] **Lesson Player** — pagină dedicată cu:
  - Video player (YouTube embed, progres tracked)
  - Conținut Markdown rendered cu imagini
  - Quiz integrat la final de lecție ("Verifică-ți cunoștințele")
  - Buton "Generează întrebări din această lecție" (folosește AI from-content)
- [ ] **Audio narration** — TTS opțional pe lecții (API extern sau browser Speech API)
- [ ] **Drawing board** — whiteboard simplu pentru explicații vizuale (canvas)

**Schema changes:**
```prisma
model Lesson {
  // existing fields...
  videoUrl      String?  // YouTube/Vimeo URL
  thumbnailUrl  String?  // Preview image
  attachments   Json?    // [{name, url, type}]
  estimatedMin  Int?     // Estimated reading/watch time
}

model Question {
  // existing fields...
  explanationVideoUrl String? // Video explanation for answer
  imageUrl            String? // Image attached to question
}
```

---

### FAZA 2 — Family Pack & Watcher Dashboard (2-3 săptămâni)
**Obiectiv:** Părintele devine client principal. Dashboard dedicat cu control total.

**Features:**
- [ ] **Family Account** — un părinte poate avea N copii linkuiți
  - Invitation flow: părinte trimite link → copil creează cont → se leagă automat
  - Family group cu shared billing
- [ ] **Watcher Dashboard redesign:**
  - **Overview**: card per copil cu stats rapide (streak, XP today, accuracy, next exam)
  - **Activity Feed**: timeline cu ce a făcut copilul (sesiuni, examene, achievements)
  - **Weekly Digest**: raport automat trimis pe email/WhatsApp
  - **Alert Config**: părintele setează praguri (ex: "alertă dacă nu studiază 2 zile")
  - **Comparative View**: dacă are mai mulți copii, compară progresul
  - **Spending Dashboard**: cât s-a cheltuit, pe ce domenii, ROI (note vs. investiție)
- [ ] **Watcher → Instructor link**: părintele poate vedea cine e mediatorul, contacta direct
- [ ] **Progress Sharing**: părinte generează link public de vizualizare progres (ex: pentru profesorul de la școală)
- [ ] **Parental Controls**: 
  - Limită de timp studiu/zi
  - Notificări la obiective atinse
  - Blocare acces la domenii specifice

**Schema changes:**
```prisma
model FamilyGroup {
  id        String   @id @default(cuid())
  name      String
  ownerId   String   // Parent user ID
  createdAt DateTime @default(now())
  
  owner    User          @relation("FamilyOwner")
  members  FamilyMember[]
}

model FamilyMember {
  id        String @id @default(cuid())
  groupId   String
  userId    String // Child user ID
  role      String @default("child") // child, co-parent
  
  group FamilyGroup @relation(...)
  user  User        @relation(...)
  
  @@unique([groupId, userId])
}
```

---

### FAZA 3 — Marketplace de Meditatori (2-3 săptămâni)
**Obiectiv:** Conectăm părinții cu meditatorii. Platforma devine marketplace.

**Features:**
- [ ] **Instructor Profile Page** — pagină publică cu:
  - Bio, experiență, materii, disponibilitate
  - Rating & reviews de la părinți
  - Tarif/oră sau per pachet
  - Certificări/diplome uploadate
  - Statistici: nr. elevi, pass rate mediu, satisfaction score
- [ ] **Search & Filter** — caută mediator pe:
  - Materie (Matematică, Fizică, Română, etc.)
  - Oraș/Online
  - Preț
  - Rating
  - Disponibilitate
- [ ] **Booking Flow**: 
  - Părinte alege mediator → Request → Mediator acceptă → Calendar sync
  - Google Calendar integration (deja există)
  - Reminder automat înainte de sesiune
- [ ] **In-Platform Messaging** (deja există, extins):
  - Chat între părinte ↔ mediator
  - Sharing de fișiere/screenshots
  - Voice notes (opțional)
- [ ] **Instructor Onboarding**:
  - Formular de aplicare
  - Verificare documente (manual de admin)
  - Trial period (primele 3 sesiuni monitorizate)

---

### FAZA 4 — Curriculum Românesc & Pachetele pe Materii (2-3 săptămâni)
**Obiectiv:** Conținut aliniat cu programa școlară. Vânzare pe materie.

**Domenii prioritare:**
| # | Materie | Target | Prioritate |
|---|---------|--------|-----------|
| 1 | **Matematică** | Clasa 5-12, EN, BAC | P0 |
| 2 | **Limba Română** | Clasa 5-12, EN, BAC | P0 |
| 3 | **Fizică** | Clasa 7-12, BAC | P1 |
| 4 | **Chimie** | Clasa 7-12 | P1 |
| 5 | **Biologie** | Clasa 5-12, BAC | P1 |
| 6 | **Informatică** | Clasa 9-12, BAC | P2 |
| 7 | **Istorie** | Clasa 5-12, BAC | P2 |
| 8 | **Geografie** | Clasa 5-12, EN | P2 |
| 9 | **Engleză** | Clasa 5-12, Cambridge | P2 |
| 10 | **Aviation** | Certificări profesionale | Existent |

**Features:**
- [ ] **Subject Packs** — domenii vândute individual sau ca bundle:
  - Pack Evaluare Națională (Mate + Română)
  - Pack BAC Real (Mate + Fizică + Info)
  - Pack BAC Uman (Română + Istorie + Geografie)
  - Pack All-Inclusive
- [ ] **Curriculum Tree** — structură ierarhică:
  ```
  Domeniu → Clasă → Capitol → Lecție → Exerciții/Întrebări
  ```
- [ ] **Seed automat** — generare conținut cu AI din manualele digitale (programă oficială)
- [ ] **Exam Templates** — formate oficiale:
  - Evaluare Națională Matematică (30 itemi, 2h)
  - BAC Matematică M1/M2 (Subiect I/II/III)
  - BAC Limba Română (comprehensiune + eseu)
  - Cambridge B1/B2 (reading, listening, writing)
- [ ] **Progress per clasă** — elevul selectează clasa, vede doar materia relevantă

---

### FAZA 5 — Monetizare & Pricing (1-2 săptămâni)
**Obiectiv:** Stripe live, planuri concrete, primii clienți.

**Pricing Strategy — PER MATERIE, NU PER LUNĂ:**

Principiu: **Plătești per materie, schimbi oricând.** Flexibil, accesibil, adaptat la sezon.

#### Prețuri per materie/lună:

| Materie | Preț standard | Preț sezon BAC/EN (Feb-Iul) | Preț vacanță (Iul-Sept) |
|---------|--------------|----------------------------|------------------------|
| **Per materie** | 19.90 RON/lună | 9.90 RON/lună | 4.90 RON/lună (voucher vacanță) |
| **Pack 3 materii** | 49.90 RON/lună | 24.90 RON/lună | 12.90 RON/lună |
| **All-Inclusive** | 79.90 RON/lună | 39.90 RON/lună | 19.90 RON/lună |

#### Pachete speciale (materii pre-selectate):

| Pack | Materii incluse | Preț sezon BAC |
|------|----------------|----------------|
| **Pack EN (cls 8)** | Matematică + Română | 14.90 RON/lună |
| **Pack BAC Real** | Mate + Fizică + Info | 24.90 RON/lună |
| **Pack BAC Uman** | Română + Istorie + Geografie | 24.90 RON/lună |
| **Pack Cambridge** | Engleză B1/B2 | 9.90 RON/lună |

#### Planuri pentru Meditatori:

| Plan | Preț | Include |
|------|------|---------|
| **Mediator Free** | 0 | Max 5 elevi, tools de bază, fără AI generation |
| **Mediator** | 49 RON/lună | Max 30 elevi, AI generation, analytics, branding |
| **Mediator Pro** | 99 RON/lună | Nelimitat elevi, white-label, API, content revenue share |

#### Watcher (Părinte) add-ons:

| Add-on | Preț | Ce include |
|--------|------|-----------|
| **WhatsApp/SMS alerts** | +9.90 RON/lună | Escaladare pe WhatsApp + SMS (inclus în pack 3+) |
| **Weekly digest email** | Gratuit | Inclus în orice plan plătit |
| **Extra copil** | +4.90 RON/lună | Al 2-lea, al 3-lea copil pe același cont |
| **Mediator dedicat** | +29.90 RON/lună | Matching cu mediator verificat, sesiuni programate |

#### Campanii sezonale:

| Perioada | Campanie | Ofertă |
|----------|---------|--------|
| **Feb-Mai** | "Pregătire BAC/EN" | Materii la 9.90 RON, pack-uri la jumătate de preț |
| **Iul-Sept** | "Vacanța Inteligentă" | Voucher vacanță: orice materie 4.90 RON, "Recuperează vara!" |
| **Sept** | "Back to School" | Prima lună gratis pe orice pack, -30% pe annual |
| **Dec** | "Cadoul Perfect" | Gift card Tutor (50/100/200 RON) cu +20% bonus |

#### Mecanică:

- [ ] **Schimbare materii oricând** — activezi/dezactivezi materii din dashboard, facturare pro-rata
- [ ] **Annual discount** — -25% dacă plătești pe un an (lock materii selectate)
- [ ] **Stripe Checkout** per materie cu trial 7 zile
- [ ] **Facturare automată** (SmartBill API pentru România)
- [ ] **Voucher codes** pentru campanii sezonale (deja implementat)
- [ ] **Gift cards** — cumperi credit Tutor, recipientul alege materiile
- [ ] **Referral discount** — promotor activ primește -50% la propriile materii

---

### FAZA 6 — AI Tutor & Homework Assistant (2-3 săptămâni)
**Obiectiv:** AI-ul devine un "mediator virtual" care ajută copilul în timp real.

**Features:**
- [ ] **AI Chat pe întrebare** — copilul nu înțelege o întrebare → deschide chat:
  - "Explică-mi de ce răspunsul e B"
  - "Dă-mi un hint fără să-mi spui răspunsul"
  - "Explică conceptul din spatele întrebării"
  - Contextual: AI-ul vede întrebarea, lecția asociată, istoricul elevului
- [ ] **Homework Scanner** — copilul fotografiază tema → AI o rezolvă pas cu pas:
  - Folosește Vision AI (Groq/Gemini) + Text AI
  - NU dă răspunsul direct — ghidează spre soluție
  - Salvează în istoric pentru mediator review
- [ ] **Concept Explainer** — click pe un termen din lecție → AI pop-up:
  - Definiție simplă
  - Exemplu practic
  - Link la lecția relevantă
  - "Ai nevoie de mai mult ajutor?" → escalare la mediator
- [ ] **Study Plan Generator** — AI generează plan personalizat:
  - Input: data examenului, materia, nivelul curent
  - Output: calendar cu sesiuni zilnice, cât timp pe fiecare topic
  - Se sincronizează cu Google Calendar
- [ ] **Adaptive Difficulty** — AI ajustează dificultatea în timp real:
  - 3 corecte consecutive → crește dificultatea
  - 2 greșite consecutive → coboară + oferă hint
  - Tracking per topic, nu global

---

### FAZA 7 — Mobile & Engagement (2 săptămâni)
**Obiectiv:** Experiență nativă pe mobil, notificări reale, offline learning.

**Features:**
- [ ] **PWA optimizat** — deja există, dar:
  - Install prompt la prima vizită
  - Splash screen cu branding
  - Bottom navigation (mobile-first)
  - Offline mode: cache lecții + întrebări, sync la reconectare
- [ ] **Push notifications reale** — deja implementat, dar:
  - Permission request UX elegant (nu spam la prima vizită)
  - Notification types: streak reminder, new achievement, mediator message, weekly digest
  - Deep links: click pe notificare → duce direct la sesiune/examen
- [ ] **Streak Recovery** — n-ai studiat ieri?
  - "Freeze" opțional (1/săptămână pe plan Free, nelimitat pe Premium)
  - Weekend skip opțional
  - "Catch up" session: fă 2x întrebări azi pentru a recupera streak-ul
- [ ] **Social Features**:
  - Challenge a friend (duel quiz)
  - Study groups (chat + shared leaderboard)
  - Achievement sharing pe social media
- [ ] **Gamification extinsă**:
  - Avatare customizabile (câștigate prin XP)
  - Badges colecționabile per materie
  - Seasonal events (ex: "Maratonul BAC" în Mai)
  - Clasament pe școli/orașe (dacă userbase permite)

---

### FAZA 8 — Analytics & Insights (1-2 săptămâni)
**Obiectiv:** Date acționabile pentru toți: elev, mediator, părinte, admin.

**Features:**
- [ ] **Student Insights**:
  - "Învățarea ta pe săptămâna asta" — bar chart vizual
  - "Topicurile unde ai nevoie de ajutor" — heatmap
  - "Predicție notă examen" — bazat pe accuracy + sessions
  - "Comparație cu media" — anonimizată, motivațională
- [ ] **Instructor Analytics**:
  - Effectiveness score per mediator (câți elevi trec examenul)
  - Time-to-mastery per topic (cât durează elevii să ajungă la 80%+)
  - Content quality: care întrebări au cele mai multe greșeli
  - Churn risk: care elevi sunt pe cale să abandoneze
- [ ] **Parent Reports**:
  - Weekly email: progres, streak, achievements, weak areas, recomandări
  - Monthly PDF report (descărcabil, printabil)
  - Comparison: "Luna asta vs. luna trecută"
- [ ] **Platform Analytics** (Admin):
  - DAU/MAU, retention, conversion, churn
  - Revenue per user (ARPU), LTV
  - Content engagement: care lecții/întrebări sunt cele mai populare
  - Funnel: visit → register → trial → paid → retained

---

## 5. PRINCIPII DE DESIGN

1. **Mobile-first** — 70%+ utilizatorii vor fi pe telefon (copii)
2. **Dark mode default** — deja implementat, ochii copiilor mulțumesc
3. **Gamification everywhere** — fiecare acțiune dă XP, fiecare progres e vizibil
4. **Zero friction** — de la login la prima întrebare: max 3 clickuri
5. **Transparență pentru părinți** — tot ce face copilul e vizibil, nimic ascuns
6. **AI ca asistent, nu înlocuitor** — AI-ul ghidează, nu dă răspunsuri direct
7. **Localizare completă** — RO/EN, monedă RON, curriculum românesc
8. **Privacy by design** — datele copiilor sunt protejate (GDPR + Copii sub 16 ani)

---

## 6. COMPETITIVE LANDSCAPE

| Competitor | Ce face bine | Ce-i lipsește | Avantajul Tutor |
|-----------|-------------|---------------|-----------------|
| **Kahoot** | Gamification quiz-uri | Nu are spaced repetition, nu e pentru studiu individual | SM-2 + sesiuni adaptive |
| **Quizlet** | Flashcards, communitate | Nu are rol de părinte, nu are escaladare | Trio student-mediator-părinte |
| **Brainly** | Q&A comunitate | Nu are structură pe materie, nu are progres tracking | Curriculum structurat + analytics |
| **Meditații.ro** | Director meditatori | Doar listing, fără platformă de learning | End-to-end: conținut + practică + exam + monitoring |
| **Google Classroom** | Gratis, integrat cu Google | Nu are gamification, nu e adaptat pentru meditații private | XP, streaks, escaladare, WhatsApp alerts |

---

## 7. REFERRAL & GROWTH ENGINE

### 7.1 Programul de Promotori — Comision Perpetuu

**Principiu:** Oricine poate deveni promotor. Promotorii câștigă comision recurent din FIECARE plată făcută de clienții pe care i-au adus — **pe toată durata abonamentului**, nu doar prima lună.

**Cum funcționează:**

```
Promotor primește link unic: tutor.knowbest.ro/r/CODPROMOTOR
   │
   ├─ Părinte dă click → cookie 90 zile → se înregistrează → plătește
   │   └─ Promotorul primește 20% din abonament, PERPETUU
   │
   ├─ Mediator dă click → se înregistrează → plătește plan Mediator
   │   └─ Promotorul primește 15% din abonament, PERPETUU
   │
   └─ Al 2-lea nivel: Clientul adus recomandă la rândul lui
       └─ Promotorul inițial primește 5% din clienții de nivel 2
```

**Niveluri de promotor:**

| Nivel | Condiție | Comision L1 | Comision L2 | Bonus |
|-------|----------|-------------|-------------|-------|
| **Bronze** | 1-5 referrals activi | 15% | — | — |
| **Silver** | 6-20 referrals activi | 20% | 5% | Badge pe profil |
| **Gold** | 21-50 referrals activi | 25% | 7% | Plan Premium gratuit |
| **Diamond** | 50+ referrals activi | 30% | 10% | Revenue share pe conținut + acces API |

**Cine devine promotor:**
- **Părinți mulțumiți** — "Recomandă unui prieten" din dashboard → primesc link automat
- **Meditatori** — recomandă platforma elevilor lor → câștigă din abonamentele părinților
- **Profesori de școală** — recomandă părinților → comision pasiv
- **Influenceri edu** — YouTuberi, bloggeri, TikTokeri educaționali
- **Elevi** — "Invită un coleg" → ambii primesc 1 lună gratis + promotorul parental câștigă
- **Centre de meditații** — white-label: centrul recomandă → comision din toți elevii

**Viralitate built-in:**
- La fiecare achievement al copilului → notificare părinte cu "Share pe Facebook/WhatsApp" + link referral
- La fiecare examen trecut → certificat cu logo Tutor + link referral
- Leaderboard public (opțional) — alți părinți văd rezultatele → curiozitate → click
- Testimonial automat: "Copilul meu a trecut EN cu X" → share button cu link

**Mecanism anti-fraud:**
- Comision plătit doar pe plăți confirmate (nu trial)
- Minim 30 zile client activ înainte de payout
- Same household detection (IP + email domain)
- Payout minim 100 RON, transfer bancar sau voucher

**Schema DB:**
```prisma
model Referral {
  id            String   @id @default(cuid())
  promoterId    String   // User who referred
  referredId    String   // User who was referred
  code          String   @unique // Referral code
  level         Int      @default(1) // 1 = direct, 2 = indirect
  sourceLevel1  String?  // If level 2, who was the L1 promoter
  status        String   @default("PENDING") // PENDING, ACTIVE, CHURNED
  commissionPct Float    // Commission percentage at time of referral
  totalEarned   Float    @default(0)
  createdAt     DateTime @default(now())
  
  promoter User @relation("Promoter")
  referred User @relation("Referred")
}

model ReferralPayout {
  id          String   @id @default(cuid())
  promoterId  String
  amount      Float
  currency    String   @default("RON")
  paymentId   String?  // Stripe payout ID
  status      String   @default("PENDING") // PENDING, PAID, FAILED
  periodStart DateTime
  periodEnd   DateTime
  createdAt   DateTime @default(now())
}
```

### 7.2 Content Sourcing — Materiale de Urcat Rapid

**Obiectiv:** Construim o bază de conținut solidă ÎNAINTE de lansare, fără a scrie manual fiecare întrebare.

#### Surse gratuite și legale (prioritizate)

**Tier 1 — Surse oficiale (cel mai valoros, imediat)**
| Sursă | Ce conține | Cum se folosește | Volum estimat |
|-------|-----------|-----------------|---------------|
| **edu.ro — Programe școlare** | Programa oficială per clasă/materie | Structura curriculum-ului (ce capitole, ce competențe) | Structură pt toate materiile |
| **edu.ro — Subiecte BAC arhivă** | Subiecte + bareme 2010-2026 | Import direct ca întrebări (PDF → AI extract) | ~500 subiecte, ~5000 întrebări |
| **edu.ro — Subiecte EN arhivă** | Evaluare Națională Mate + Română | Import direct | ~300 subiecte, ~3000 întrebări |
| **edu.ro — Modele oficiale** | Modele de subiecte publicate anual | Import + variante generate cu AI | ~50/an |
| **manual.edu.ro** | Manuale digitale gratuite (toate clasele) | AI extrage concepte → generează întrebări | Nelimitat |

**Tier 2 — Open Educational Resources**
| Sursă | Ce conține | Cum se folosește |
|-------|-----------|-----------------|
| **Khan Academy (ro.khanacademy.org)** | Video-uri + exerciții traduse | Link-uri YouTube ca lecții, AI generează întrebări din transcrierile video |
| **Wikipedia educațional** | Articole pe concepte | AI extrage definiții, generează întrebări de comprehensiune |
| **OpenStax** | Manuale universitare open source | Downgrade la nivel liceu, generare întrebări |
| **MIT OpenCourseWare** | Cursuri + probleme | Pentru materii avansate (Info, Fizică) |
| **Project Gutenberg** | Opere literare integrale | Limba Română — texte pentru comprehensiune |

**Tier 3 — Comunitate & AI Generation**
| Metodă | Proces | Volum |
|--------|--------|-------|
| **AI bulk generation din programă** | Dăm AI-ului programa oficială → generează 50 întrebări per capitol | ~10,000 întrebări/materie |
| **Instructor content upload** | Meditatorii urcă materialele lor → AI generează întrebări | Depinde de adoption |
| **Student homework scan** | Copiii fotografiază teme → AI extrage probleme → review → publică | Organic growth |
| **Crowdsource** | Competiție: "Cine creează cele mai bune întrebări câștigă Premium gratuit" | Viral, quality varies |

**Plan de execuție rapid (2 săptămâni):**
```
Săptămâna 1:
  Luni:    Download toate subiectele BAC 2020-2026 (Mate M1, M2, Română, Fizică)
  Marți:   Bulk import PDF → AI extract → ~2000 întrebări DRAFT
  Miercuri: Download subiecte EN 2020-2026 (Mate + Română)
  Joi:     Bulk import → ~1500 întrebări DRAFT
  Vineri:  Download manuale digitale manual.edu.ro (Mate cls 5-8)
           AI from-content: generare 50 întrebări per capitol

Săptămâna 2:
  Luni:    Manuale cls 9-12 (Mate + Fizică)
  Marți:   Manuale Română (texte literare → comprehensiune)
  Miercuri: Review batch 1 (instructor verifică DRAFT-urile)
  Joi:     Khan Academy links ca lecții video
  Vineri:  Quality audit + publish first batch
  
Target: 10,000+ întrebări în DRAFT, 3,000+ PUBLISHED
```

### 7.3 Instructor Verification Program (IVP)

**Problema:** AI generează mii de întrebări, dar calitatea variază. Avem nevoie de oameni care verifică, corectează și aprobă conținutul — fără să plătim salarii.

**Soluția: Instructori-verificatori plătiți din referral + revenue share.**

#### Cum funcționează:

```
AI generează 50 întrebări din manual
  │
  ├─ Status: DRAFT (nevizibil pentru studenți)
  │
  ├─ Intră în "Review Queue" — distribuit către verificatori
  │
  ├─ Verificator primește batch de 10-20 întrebări
  │   ├─ Corectează greșeli
  │   ├─ Îmbunătățește formularea
  │   ├─ Adaugă explicații
  │   ├─ Marchează: APPROVED sau REJECTED (cu motiv)
  │   └─ Timpul mediu: ~2 min/întrebare
  │
  └─ Admin face spot-check pe 10% din aprobări
      └─ Dacă calitate < 80% → verificatorul pierde badge
```

#### Motivația verificatorilor (stacked incentives):

| Incentive | Detalii | Valoare |
|-----------|---------|---------|
| **XP per review** | 5 XP per întrebare verificată, 20 XP per întrebare corectată | Gamification |
| **Badge "Verified Instructor"** | Vizibil pe profil, crește încrederea părinților | Reputație |
| **Revenue share per conținut** | 2 RON per 100 de accesări ale întrebărilor aprobate de tine | ~20-100 RON/lună |
| **Plan gratuit** | 50+ reviews/lună → plan Mediator gratuit (valoare 99 RON) | Economie directă |
| **Referral boost** | Verificatorii primesc 25% comision referral (vs 20% standard) | Extra income |
| **Leaderboard verificatori** | Top 10 verificatori/lună → premii (voucher Emag, etc.) | Competiție |
| **Priority în marketplace** | Verificatorii apar primii în search-ul de meditatori | Mai mulți elevi |

#### Niveluri de verificator:

```
Reviewer (0-100 reviews)
  → Poate aproba/reject DRAFT-uri
  → Spot-checked 20% de admin

Trusted Reviewer (100-500 reviews, >90% accuracy)
  → Auto-approve fără spot-check
  → Poate edita întrebări APPROVED
  → Revenue share activat

Senior Reviewer (500+ reviews, >95% accuracy)
  → Poate verifica alți reviewers
  → Poate crea Exam Templates oficiale
  → Revenue share 2x
  → Badge Gold pe profil
```

#### Fluxul complet integrat:

```
CONTENT PIPELINE:
  
  Surse                    AI Processing              Human Review            Live
  ─────────────────────────────────────────────────────────────────────────────────
  Manuale PDF      ──┐
  Subiecte BAC     ──┤     AI Extract      ──→    DRAFT    ──→   Instructor   ──→  PUBLISHED
  Khan Academy     ──┤     AI Generate              │         Review Queue         (vizibil
  Instructor upload──┤     AI From Content          │              │               studenți)
  Homework scan    ──┘                              │              │
                                                    │         Verified? ──NO──→ REJECTED
                                                    │              │                (feedback
                                                    │             YES               la AI)
                                                    │              │
                                                    └── Quality < 80%? ──→ Recalibrate AI prompt
```

#### Recrutare verificatori:

1. **Studenți la facultăți de profil** — Mate, Fizică, Litere
   - Ofertă: "Verifică 50 întrebări/săptămână → 200 RON + plan Premium gratuit"
   - Canal: Grupuri Facebook "Studenți [Facultate]", LinkedIn
   
2. **Profesori pensionari** — experiență vastă, timp liber
   - Ofertă: "Câștigă extra income din cunoștințele tale"
   - Canal: Asociații de profesori, Facebook groups
   
3. **Meditatori existenți** — deja pe platformă
   - Auto-prompt: "Ai 15 minute? Verifică 5 întrebări și câștigă 25 XP + badge"
   - Gamificat: apare ca "Daily Mission" în dashboard-ul lor

4. **Elevi avansați** — olimpici, nota 10
   - Ofertă: plan Premium gratuit + certificat "Student Reviewer"
   - Limitare: pot verifica doar materia/nivelul la care au >90% accuracy

---

## 8. GO-TO-MARKET

### Faza 0: Content Blitz (înainte de orice — 2 săptămâni)
- Bulk import subiecte BAC + EN din edu.ro (3000+ întrebări)
- AI generation din manuale digitale (5000+ întrebări)
- Recrutare 5-10 verificatori inițiali (studenți la Mate/Fizică)
- Target: 3000 întrebări PUBLISHED, 3 materii (Mate, Română, Fizică)

### Faza 1: Pilot (50 familii)
- **Canal**: Grup Facebook "Meditații [Oraș]", recomandări directe
- **Ofertă**: 3 luni gratis pe plan Family
- **Scope**: 2-3 meditatori onboardați manual, materie: Matematică clasa 8 (EN)
- **Metric succes**: 60% retention după 3 luni, NPS > 8

### Faza 2: Growth (500 familii)
- **Canal**: Facebook/Instagram Ads targetate pe părinți 35-50 ani, copii 10-18 ani
- **Landing page**: knowbest.ro/tutor cu video demo, testimoniale pilot
- **Ofertă**: Trial 14 zile gratis, apoi Starter 49 RON/lună
- **Referral**: Invită un prieten → 1 lună gratis pentru amândoi

### Faza 3: Scale (5000+ familii)
- **Parteneriate**: școli private, centre de meditații, asociații de părinți
- **Content partnerships**: profesori care creează conținut → revenue share
- **SEO**: "meditații online matematică", "pregătire BAC", "evaluare națională"
- **Influencer**: profesori populari pe YouTube/TikTok (MateInfo, etc.)

---

## 9. METRICS CHEIE (North Star)

| Metric | Target 6 luni | Target 12 luni |
|--------|--------------|----------------|
| **Active families** | 200 | 1,000 |
| **MRR (Monthly Recurring Revenue)** | €2,000 | €15,000 |
| **Student sessions/week** | 3.5 avg | 5.0 avg |
| **7-day retention** | 60% | 75% |
| **30-day retention** | 35% | 50% |
| **NPS** | 40+ | 50+ |
| **Exam pass rate** | 75% | 85% |
| **Avg streak length** | 5 days | 12 days |
| **Referral conversion rate** | 15% | 25% |
| **Active promoters** | 30 | 200 |
| **Questions PUBLISHED** | 10,000 | 50,000 |
| **Verified instructors** | 15 | 60 |
| **Viral coefficient (K)** | 0.5 | 1.2+ (viral growth) |

---

## 10. RISCURI & MITIGĂRI

| Risc | Probabilitate | Impact | Mitigare |
|------|--------------|--------|----------|
| Copiii nu se motivează singuri | Mare | Mare | Gamification agresivă + escaladare la părinte + mediator activ |
| Meditatorii nu adoptă platforma | Mediu | Mare | Onboarding ghidat, tools gratuite, revenue share pe conținut |
| Conținut insuficient la lansare | Mare | Mediu | AI generation din manuale + import bulk + seed comunitar |
| GDPR/Copii sub 16 | Mediu | Mare | Consent parental obligatoriu, date minimale, audit privacy |
| Churn după trial | Mare | Mediu | Onboarding email sequence, first-week WOW moment, check-in call |
| Referral fraud (conturi fictive) | Mediu | Mediu | Payout doar după 30 zile client activ, same-household detection, minim 100 RON payout |
| Conținut AI incorect publicat | Mediu | Mare | IVP obligatoriu, spot-check admin 10%, rating întrebări de către elevi |
| Verificatori low-quality | Mic | Mediu | Accuracy tracking, demotion automată sub 80%, peer review |

---

## 11. PRIORITATEA EXECUȚIEI

```
ACUM (Aprilie)     → Faza 1: Rich Content & Media                [1-2 sapt]
                   → Content Blitz: import BAC/EN + AI gen        [în paralel, 2 sapt]
Mai 2026           → Faza 2: Family Pack & Watcher Dashboard      [2-3 sapt]
                   → Referral Engine (promotorii, comision perpetuu) [1 sapt]
Iunie 2026         → Faza 4: Curriculum Românesc (Mate + RO)       [2-3 sapt]
                   → IVP: Instructor Verification Program launch    [1 sapt]
Iulie 2026         → Faza 5: Monetizare & Stripe Live              [1-2 sapt]
                   → LANSARE PILOT (50 familii + 10 promotori)
August 2026        → Faza 3: Marketplace Meditatori                 [2-3 sapt]
Septembrie 2026    → Faza 7: Mobile & Engagement                    [2 sapt]
                   → GROWTH PHASE (Back to School + referral push)
Octombrie 2026     → Faza 6: AI Tutor                               [2-3 sapt]
Noiembrie 2026     → Faza 8: Analytics & Insights                   [1-2 sapt]
Ongoing            → Iterare, conținut nou, materii noi, referral optimization
```

---

*Document creat de Claude Opus 4.6 — 2026-04-15*
*Bazat pe audit complet al codebase-ului Tutor + DevLearningPlatform*
