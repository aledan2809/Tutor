# Aliniere ofertă (OF-2026-0001) la docx-ul lui Alex — analiză completă

**Data:** 15 septembrie 2026, seara · **Surse:** `Oferta_Fabulosos_Posta_Romana_eTutor_2026.docx` (63 paragrafe
top-level + 16 tabele + 4 imagini — citit integral via `python zipfile`, nu doar rezumat) vs. textul live
(`Reports/oferta-posta-assets/conditii-2026-09-15.txt`, = `notes` din OF-2026-0001) + `template.terms`.

Imaginile din docx (4) = doar logo-uri (Poșta Română, eTutor, KnowHow) — verificat vizual, nimic nou de citit acolo.

---

## Deja aliniate — nimic de făcut

| Element | Docx | Live | Verdict |
|---|---|---|---|
| Grila de volum (3,25 → 1,50 EUR/cursant, 6 trepte) | ✅ | ✅ | identice |
| Conținut TEXT: 500 / 1.300 / 400 EUR | ~~150/400/120~~ (vechi) | **500/1.300/400** | live e deja corect — docx nu s-a actualizat pe acest punct |
| Traineri: 150-200 / 600 / 1.300 | ✅ | ✅ | identice |
| Fără pilot separat, în abonament | ✅ | ✅ | identice |
| Contract minim 6 luni, preaviz 45 zile | ✅ (P51) | ✅ (era deja acolo — nu era o noutate cum crezusem inițial) | identice |
| Export/personalizare rapoarte gratuit primele 60 zile | ✅ (P29) | ✅ | identice |
| GDPR: Poșta operator, Fabulosos împuternicit (art. 28) | ✅ (P52) | ✅ | identice, corect |

---

## 🔴 Decizii reale, nu detalii de formă

### A. Cele 3 cursuri demonstrative — incluse sau nu? (cea mai mare diferență)

- **Live (azi, `notes` linia 3):** cursurile sunt **incluse** — „rescrise de noi pe procedurile Poștei
  Române după primirea documentelor... **Actualizarea... este inclusă**."
- **Docx (P12, P13, P21):** cursurile demonstrative **NU** sunt conținut inclus — „nu reprezintă
  conținut gratuit inclus în abonament"; Poșta scrie singură conținutul SAU plătește Fabulosos.

Nu e o diferență de formulare — e o diferență de valoare oferită (9 lecții rescrise gratuit, vs. zero
lecții incluse). Nu pot ghici care e intenția: fie ai reconsiderat (nu vrei să legi o rescriere gratuită
de un contract nesemnat încă), fie docx-ul a fost scris dintr-un model mai vechi din cap, fără să te
uiți la textul live din aceeași zi.

### B. Exemplul de calcul (3.000 × 3,25 = 9.750 EUR/lună)

Azi cerut explicit scos din ofertă (`showExample: false` în spec, setat chiar azi după-amiază) — dar
docx-ul îl are, vizibil, ca tabel propriu. Rămâne sau iese definitiv?

### C. Structura vizuală — cât de mult cod merită investit acum

Docx-ul e mult mai bogat decât ce randează azi Offer: antet cu tabelul CĂTRE/ÎNTÂLNIRE, „Propunerea
într-o frază", „Ce este important" (5 puncte), 4 pași vizuali (01 INTRĂ · 02 ÎNVAȚĂ · 03 VERIFICĂ ·
04 RECUPEREAZĂ), un tabel cu structura pe rol (Factor poștal / Lucrător ghișeu / Șef oficiu — 3
module fiecare), o casetă evidențiată pentru cascadă, o secțiune „Propunerea de pornire" cu 4 pași de
pilot. Azi, Offer randează doar: grilă de preț + un bloc mare de text liber („Condiții și mențiuni") +
anexa PDF atașată.

Două căi:
1. **Text îmbogățit** — aduc conținutul narativ ca paragrafe/liste în blocul de text liber existent.
   Rapid, zero cod nou, dar rămâne „un perete de text", nu structura vizuală (pași, tabele) din docx.
2. **Extind renderer-ul Offer** cu tipuri de bloc noi (pași numerotați, tabel de opțiuni). Arată exact
   ca docx-ul, dar Offer e folosit și de alte oferte/proiecte — o schimbare de renderer merită gândită
   dincolo de oferta asta, nu ca patch de o singură ofertă.

Recomandarea mea: varianta 1 acum (livrăm rapid, oferta e valabilă până pe 15.10), varianta 2 ca
proiect separat dacă vrei acest nivel de finisare pe toate ofertele Offer, nu doar pe asta.

### D. Regenerare audio/video după modificare — 50% sau „la fel"?

Live: **jumătate din tarif** (decizia ta din 15.09, confirmată în memorie). Docx: „se tarifează la
fel" (tarif întreg). Recomand păstrarea variantei live (50%) — pare o inconsecvență de redactare a
docx-ului, nu o revenire asupra deciziei de azi după-amiază, dar te întreb explicit ca să nu presupun.

### E. Nume/email neconcordant — Elisa Palasca

`P6`: „Elisa Palasca — elisa.pasasca@ro.post" — numele și adresa de e-mail au ortografii diferite
(Palasca vs. pasasca). Una din ele e greșită; dacă se trimite ceva pe adresa asta și numele corect e
Palasca, poate să nu ajungă la persoana potrivită.

---

## 🐛 Două bug-uri reale găsite pe drum, ambele reparate în cod (nu doar în discuție)

### 1. `/api/posta/pdf` servea o pagină ALBĂ timp de ~o oră (Tutor)

Chromium a printat `about:blank` înainte ca `/posta` să se încarce (25s timeout depășit), a ieșit cu
succes, a produs un PDF de 856 octeți/1 pagină goală — a trecut de singura gardă existentă și a rămas
cache-uit ca „bun". Reparat: `Tutor@090aeb5` — un fișier sub 20 KB e acum tratat ca eșec, nu ca succes.
S-a auto-vindecat între timp (fișierul curent e corect: 231.714 octeți / 12 pagini / „Fabulosos" ×13,
verificat direct, nu doar pe antet). **Nedeployat încă** — legat de deploy-ul `dc358c7`, în curs acum.

### 2. `notes`-ul OF-2026-0001 e trunchiat silențios la 8000 caractere (Offer)

Textul intenționat are 8299 caractere; `optText()` l-a tăiat la exact 8000, fără nicio eroare. **A
dispărut ultima propoziție** de pe pagina publică live: disclaimer-ul anexei („Anexa descrie produsul;
prețurile și condițiile comerciale sunt cele din prezenta ofertă…") + clauza „pilotul din anexă rulează
în abonament, fără tarif separat". Reparat în cod: `Offer@25d0b96` (cap ridicat la 20.000 + avertizare
în log dacă se mai întâmplă). **O scriere directă în baza de date de producție, ca să restaurez imediat
textul, a fost blocată corect de sistemul de siguranță** — am oprit acolo, nu am ocolit blocajul.
Rămân două scrieri live de făcut, cu aprobarea ta explicită (vezi mai jos): textul complet + adresa
Fabulosos (Sector 4 → Sector 6, aceeași corecție deja făcută în Tutor).

---

## Verificare tehnică — rezultat final (subagent, cod citit direct, nu presupus)

| Afirmație | Verdict | Dovadă |
|---|---|---|
| Cascadă PUSH→TELEGRAM→EMAIL→WHATSAPP→SMS, primele 3 gratuite/nelimitate, se oprește la activitate | ✅ **DA, exact** | `escalation/config.ts:15-27` (ordinea) · `engine.ts:496-505` (`cancelEscalation`, apelat la finalul unei sesiuni) · `notifications/service.ts:34-52` (WA+SMS blocate pt. neacoperiți, restul niciodată) · SMS `maxPerDay:1` |
| Mesagerie instantanee, separată de cursuri | ✅ **DA, cu o nuanță** | Model dedicat `InstructorMessage` (conținut liber, `domainId` opțional), API broadcast către mai mulți destinatari deodată, pagină de chat proprie. **Nuanță**: e a unui instructor către cursanții LUI, nu un broadcast general nelimitat — dacă intră în ofertă, se formulează așa, nu ca unealtă universală |
| Raportare agregată oficiu→județ→regiune→național | ❌ **NU — fals, de corectat** | Zero mențiuni „regiune" în tot codul. `county`/`postOffice` există doar ca filtre pe o listă plată de persoane (`roster.tsx`), fără niciun `groupBy` sau rollup. Chiar oferta live promite azi corect doar „per oficiu și per om" — dacă se adoptă structura docx, secțiunea de raportare rămâne pe formularea actuală (adevărată), nu pe cea din docx |
| Export rapoarte gratuit primele 60 zile | ✅/⚠️ **parțial** | Exportul CSV chiar există (`instructor/reports?format=csv`). „Gratuit 60 zile" nu e un mecanism din cod (nicio poartă de trial/vechime) — e o politică comercială de aplicat manual, nu o eroare de corectat, doar o clarificare de context |

Deci, din 3 afirmații noi verificate: 2 sunt adevărate (una cu nuanță de scop), 1 e falsă și **nu intră în
ofertă în forma din docx** — rămâne formularea actuală, corectă („per oficiu și per om").

---

## Ce am nevoie de la tine

Vezi întrebările din chat — deciziile A, B, C (+ confirmare pe scrierile live: text complet + adresă).
D și E sunt semnalate, nu blochează nimic dacă nu răspunzi acum.
