# Verificare de adevăr — pagina `/posta`

**Data:** 10 septembrie 2026 · **Cerere:** „asigură-te că ce am scris în landing page este adevărat 100%"

Fiecare afirmație verificabilă de pe pagină a fost confruntată cu **codul**, cu **baza de
producție** și cu **comportamentul real**, nu cu documentația. Metoda a contat: din cinci
suspiciuni inițiale, **trei s-au dovedit greșite** după verificare temeinică — le-am formulat
prea repede, uitându-mă la un singur fișier.

---

## Confirmate ADEVĂRATE (verificate, nu presupuse)

| Afirmație | Cum a fost verificată |
|---|---|
| 10 puncte/răspuns corect, +5 sub 5 secunde, 50/sesiune, 100/scor perfect, 15 în fereastră | citite din `gamification-constants.ts` — toate șase exacte |
| Seria: 3 zile ratate, 5 întrebări, 3 corecte, 2 minute | `STREAK_RECOVERY` — toate patru exacte |
| Trepte 0 · 500 · 2.000 · 5.000, clasament primii 10 | `DEFAULT_LEVELS` + `LEADERBOARD_TOP` |
| Provocarea zilei, punctele se dublează | `DAILY_CHALLENGE_MULTIPLIER = 2`; se **creează singură** la prima deschidere (0 rânduri pe materiile Poștei = n-a intrat nimeni, nu că lipsește) |
| Cascada se oprește când omul reia | `cancelEscalation`, verificat în engine |
| Importul în doi timpi | `import-form.tsx` — previzualizare, apoi confirmare |
| Cod comun, cu expirare și număr maxim de folosiri | `Domain.joinCode`, `joinCodeExpiresAt`, `joinCodeMaxUses` |
| Recuperare parolă pe cod WhatsApp, fără e-mail | `/auth/recuperare` + `/api/auth/recuperare/{cere,schimba}` |
| **Linkul merge o singură dată** | ⚠️ concluzionasem GREȘIT că e fals. Ruta `/api/acces/activare` refuză a doua folosire (`recipient.userId` setat), iar pagina afișează „Contul tău e deja creat. Intră cu numele de utilizator și parola ta." + buton |
| Materia privată, nu apare în catalog | poarta `resolveDomainOrForbid` pe toate rutele |
| Conținutul se schimbă din panou | `/dashboard/admin/lessons` |
| **Operatorul de date e Class RDA Impex SRL** | Legal Hub: `tutor` → Class RDA Impex SRL, rol CONTROLLER |
| Fiecare curs se termină cu un singur număr | ⚠️ prima verificare (potrivire de text) a zis „fals pe două cursuri"; **citind finalul lecțiilor**, e prezent la toate trei |
| Scorul se colorează verde >70 / chihlimbar 50-70 / roșu sub | identic cu `roster.tsx` |
| 3 cursuri × 3 module, fiecare cu lecție și test | verificat în bază: 13/6/5 · 7/8/4 · 7/5/7 grile publicate |

---

## Găsite FALSE și reparate

### 1. Numele cursurilor și modulelor nu se potriveau cu platforma

| Pagina spunea | În platformă era |
|---|---|
| curs „La ghișeu" | „La geam" |
| modul „Ești singurul om de la Poștă pe care clientul îl vede" | „Omul de la ușă ești tu" |
| modul „Coada **de la** prânz și reclamația" | „Coada de prânz și reclamația" |

Clientul ar fi deschis platforma și ar fi văzut alte denumiri decât în propunere.

**Reparat**: redenumit în bază (tranzacție unică). `questionTopic` e coloană separată de
titlu, deci grilele au rămas legate — verificat după: 13/6/5 · 7/8/4 · 7/5/7, identice.
Copie de siguranță: `/root/backups/posta-titluri-pre-redenumire-2026-09-10.json`.

### 2. Remindere pe SMS — canal care nu există în cascadă

Cascada are **patru** trepte: push → Telegram → e-mail → WhatsApp. **SMS nu e treaptă.**
Mecanismul de trimitere SMS există în cod (`@aledan/sms`, SMSLink, cu plafon zilnic), dar
`SMSLINK_CONNECTION_ID` și `SMSLINK_PASSWORD` **nu sunt setate pe producție** — deci n-ar
pleca nimic nici dacă ar fi treaptă.

**Reparat în text** (nu se poate face adevărat fără credențiale): enumerarea spune acum
exact cele patru canale reale.

### 3. „Rata de eroare pe fiecare temă… se vede ce n-a fost înțeles în general"

Nu exista. Căutat temeinic: **niciun `groupBy` pe temă în tot panoul de admin**. Datele per
om erau acolo, dar nicio vedere agregată.

**Reparat prin construcție**, nu prin ștergerea afirmației: panou nou peste tabloul de
cursanți — rata de greșeală per modul, pe toată grupa, cu numărul de răspunsuri și de
cursanți în spatele fiecărei cifre. Calculul e o funcție pură cu 9 teste.

⚠️ Un defect prins la `/review` merită spus: prima variantă sorta pe rata brută, deci un
modul cu **un singur** răspuns greșit ieșea 100% și trecea peste unul la care picaseră 400
din 500 de oameni — exact decizia pe care panoul o servește era îndreptată greșit de un
răspuns. Sortarea folosește acum rată netezită; procentul afișat rămâne cel brut.

### 4. „Ritmul reminderelor îl fixați dvs."

Mecanismul de reglare **există** (`NotificationPreference.escalationSteps`, minute per
treaptă — deci și pe zile), dar nu există nicio cale prin care **clientul** să-l seteze: doar
preferințele proprii ale unui utilizator sau ale unui părinte pentru copil. Un singur cont din
toată platforma are ritm personalizat.

**Reparat în text**: spune acum că îl așezăm noi, împreună, înainte de primul om.

---

## Rămase deschise — cer decizie sau sesiune proprie

### 🔴 Cascada implicită e periculoasă pentru un curs de serviciu

Treptele implicite sunt la **10 minute** una de alta, fiindcă mecanismul a fost construit
pentru un elev care ratează o ședință în seara aceea. Dacă cascada pornește pe materiile
Poștei, un factor care ratează o zi primește **patru mesaje în 30 de minute** — inclusiv
WhatsApp, pe numărul lui real.

**Nu e activ**: cascada n-a pornit niciodată pe niciun cursant de la Poștă (0 evenimente).
Dar devine activ în ziua în care intră primii factori reali.

**De făcut**: un ritm implicit **pe materie** (azi nu există decât pe om). Schemă + cablare
în motor + reglaj în panou. Sesiune proprie — atinge motorul de notificări al unei aplicații
live.

### ⚠️ „Politicile sunt publice și versionate" — termenii lipsesc

Verificat pe Legal Hub: `privacy` **200** (vE1.0, cu amprentă de conținut) · `cookies` **200** ·
`terms` **404**. Afirmația e adevărată pentru două din trei documente.

Legal Hub e **NO-TOUCH CRITIC** → seedarea documentului de termeni pentru `tutor` cere
propose-confirm-apply, nu se face autonom.

### ⚠️ SMS, dacă îl vrei în propunere

Cere `SMSLINK_CONNECTION_ID` + `SMSLINK_PASSWORD` (acțiune de-a ta), apoi SMS-ul devine
treaptă în cascadă. Până atunci, textul nu-l promite.

---

## Ce a rămas neatins deliberat

Cifra „peste 1000 lanțuri de remindere" — măsurat, sunt **825** de evenimente (823 duse la
capăt). Semnalat, iar decizia ta a fost să rămână: e decizie de marketing, iar cifra oricum
va fi depășită până când clientul decide.
