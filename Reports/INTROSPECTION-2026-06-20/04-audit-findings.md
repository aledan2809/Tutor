# Audit funcțional + UX/Perf/SEO/A11y — Tutor

**Data:** 2026-06-20 · **Proiect:** Tutor / etutor.ro · **Tip:** audit read-only (zero modificări de cod)
**Sursă scoruri:** AIWebAuditor (audit `fee2385c-…`, rulat pe `https://etutor.ro/`, 2026-06-20)

---

## 🗣️ Pe înțelesul tău + implicații (non-tehnic)

Am pus site-ul tău pe un „cântar" automat care îl notează pe 8 dimensiuni (viteză, Google/SEO, securitate tehnică, GDPR/cookie-uri, accesibilitate pentru persoane cu dizabilități, experiență pe mobil, încredere/trust, comparație cu concurența). **Nota generală: 76 din 100.** E o notă de „bine, dar cu câteva găuri vizibile".

Pe scurt, ce înseamnă pentru tine:

- **Viteza e perfectă (100/100).** Site-ul se încarcă rapid (pagina apare în ~1,4 secunde). Asta e bani în buzunar: vizitatorii nu pleacă de plictiseală, iar Google te răsplătește. **Nu ai nimic de făcut aici.**
- **Mobilul e perfect (100/100).** Cum 7 din 10 vizitatori vin de pe telefon, e exact unde trebuie să fii bun.
- **SEO bun (88/100).** Te găsești pe Google. Mici scăpări: titlul paginii principale (`H1`) e încă **în engleză** („Thousands of real practice questions…") deși tot restul site-ului e în română — pentru un site românesc de BAC e ciudat și pierde puncte. Lipsesc și „datele structurate" (acel cod invizibil care îți face site-ul să apară frumos în rezultatele Google).
- **Securitate tehnică foarte bună (95/100).** HTTPS, criptare, anteturi de protecție — toate sunt la locul lor. Detaliile de securitate sunt în raportul separat `04b`.
- **🔴 GDPR / cookie-uri: 20/100 — cea mai mare gaură.** Folosești Google Analytics (care urmărește vizitatorii) **fără banner de cookie-uri și fără pagină de Confidențialitate vizibilă**. Pentru un site românesc care colectează date despre **minori**, asta e și amendă potențială, și pierdere de încredere. **E prioritatea #1 de fixat din acest raport.**
- **Accesibilitate: 75/100.** Persoanele care navighează doar de la tastatură (sau cu cititoare de ecran) au dificultăți: lipsește link-ul „sari direct la conținut", iar unele titluri sar peste niveluri. Nu blochează majoritatea, dar e o barieră pentru o parte din public + un mic risc legal.
- **Trust/încredere: 40/100.** Site-ul nu afișează **telefon, email, adresă, pagină „Despre noi", testimoniale sau recenzii**. Un părinte care plătește vrea să vadă „cine sunt oamenii ăștia?". Lipsa acestor semnale de legitimitate scade conversia — oameni gata să cumpere pleacă pentru că „nu pare destul de serios".

**Verdict:** tehnic ești solid (viteză, mobil, securitate). Pierderile reale de bani și risc sunt pe **3 zone moi**: (1) GDPR/cookie-uri — risc legal pe minori, (2) lipsa semnalelor de încredere — scade vânzarea, (3) mici scăpări de accesibilitate + un titlu în engleză. Niciuna nu cere reconstrucție; toate sunt „de adăugat ce lipsește".

---

## 1. Scoruri AIWebAuditor (tablou complet)

| Dimensiune | Scor | Verdict scurt |
|---|---:|---|
| **General (overall)** | **76 / 100** | Bine, cu găuri pe GDPR + trust |
| Performanță (viteză) | 100 / 100 | ✅ Excelent — LCP 1.44s, FCP 0.77s, CLS 0.1, TTFB 288ms |
| SEO | 88 / 100 | ✅ Bun — minus: H1 în engleză + zero date structurate |
| Securitate (tehnică) | 95 / 100 | ✅ Foarte bun — vezi `04b` pentru nuanțe |
| **GDPR / Privacy** | **20 / 100** | 🔴 **Critic** — fără banner cookie + fără privacy vizibil + GA pre-consimțământ |
| Accesibilitate (a11y) | 75 / 100 | 🟠 Parțial — fără skip-link, ierarhie heading-uri ruptă, navigare tastatură limitată |
| Mobile UX | 100 / 100 | ✅ Excelent |
| Trust / încredere | 40 / 100 | 🟠 Slab — fără contact vizibil, fără About, fără social proof |
| Competitor | 50 / 100 | ➖ N/A — niciun competitor furnizat pentru comparație |

**Core Web Vitals (Google):** LCP 1,44s (target <2,5s ✅) · FID 50ms ✅ · CLS 0,1 (target <0,1, exact la limită) · TTFB 288ms ✅ · Total Blocking Time 100ms ✅.

---

## 2. Probleme detectate (12 issue-uri), grupate pe categorie

### 🔴 GDPR / Confidențialitate (4 issue-uri — categoria cu cel mai mare scor pierdut)

| Severitate | Titlu | Implicație simplă | Efort estimat |
|---|---|---|---|
| **CRITIC** | Lipsește banner-ul de cookie consent | Folosești 1 tracker (Google Analytics) fără să ceri acordul. Ilegal sub GDPR pentru tracking non-esențial. | ~8h |
| **CRITIC** | Lipsește politica de confidențialitate vizibilă | Auditorul nu găsește link de Privacy Policy din footer/homepage. (Notă: ai pagină `/privacy` în cod + integrare Legal Hub — vezi `04b` — dar nu e descoperită din pagina principală.) | ~4h |
| **HIGH** | Google Analytics fără consimțământ | GA se încarcă ÎNAINTE ca utilizatorul să accepte cookie-urile. Trebuie încărcat doar după accept. | ~3h |
| MEDIUM | 1 serviciu de tracking detectat (google_analytics) | Trebuie documentat în politica de confidențialitate + încărcat condiționat. | ~2h |

> **Context agravant (minori):** publicul tău sunt în mare parte elevi sub 18 ani (BAC/Evaluare Națională). GDPR cere protecție întărită pentru date despre minori. Tracking fără consimțământ pe un public de minori = risc legal mai mare decât pe un site obișnuit. **Detaliile de privacy pe minori sunt în `04b`.**

### 🟠 Accesibilitate (3 issue-uri)

| Severitate | Titlu | Implicație simplă | Efort |
|---|---|---|---|
| **HIGH** | Navigare prin tastatură limitată | Cine nu folosește mouse (tastatură / cititor de ecran) nu poate ajunge ușor la toate butoanele. Lipsește „focus visible". | ~4h |
| MEDIUM | Lipsește link-ul „Skip to content" | Fără scurtătura „sari peste meniu", cititoarele de ecran citesc tot meniul la fiecare pagină. | ~1h |
| MEDIUM | Ierarhie heading-uri ruptă (H2 → H4, sare H3) | Structura titlurilor are salturi — confuz pentru cititoare de ecran + ușor minus SEO. | ~1h |

> Notă pozitivă: **0 probleme de contrast culori, 0 imagini fără text alternativ, 0 formulare fără etichete** — acolo stai bine. Nivel WCAG raportat: AA.

### 🟠 Trust / Încredere (3 issue-uri — afectează direct conversia)

| Severitate | Titlu | Implicație simplă | Efort |
|---|---|---|---|
| **HIGH** | Lipsesc datele de contact cheie | Fără telefon/email/adresă vizibile, un părinte ezită să plătească. „Pe cine sun dacă e o problemă?" | ~0,5h |
| MEDIUM | Semnale „Despre noi" slabe | Nicio pagină About în meniu/footer — lipsește povestea + echipa + dovezile. | ~1h |
| MEDIUM | Fără social proof | Niciun testimonial, recenzie, rating sau studiu de caz. Părinții cumpără pe baza experienței altor părinți. | ~2h |

### 🔵 Securitate / SEO / Altele (2 issue-uri)

| Severitate | Titlu | Implicație simplă | Efort |
|---|---|---|---|
| LOW | 1 email expus (`you@example.com`) | E un email **placeholder/demo** rămas în cod (nu un email real care să fie spam-uit). Mai mult o scăpare de curățenie decât un risc. | ~1h |
| MEDIUM | Niciun competitor selectat | Auditul de comparație cu concurența cere un URL de competitor — nu a fost dat. Nu e un defect al site-ului. | 0h |

---

## 3. UX / SEO — observații suplimentare (din date, nu inventate)

- **H1 în engleză pe homepage RO.** Auditorul vede `H1 = "Thousands of real practice questions, on your subject"` pe un site altfel complet românesc (title-ul e RO). Pentru un public de BAC românesc e o disonanță + pierdere SEO pe cuvinte-cheie românești. **Propunere:** H1 în română (ex. „Mii de grile reale, pe materia ta"). *(Aplicarea rămâne la review-ul tău.)*
- **Zero date structurate (`structured_data: []`).** Adăugarea de schema.org (Organization, Course, FAQ, BreadcrumbList) ar îmbunătăți afișarea în Google (stele, întrebări extinse). *(Notă: pagina `/grile/[subject]` deja injectează FAQ JSON-LD — vezi `04b` §Injection — deci infrastructura există parțial; merită extinsă pe homepage + pagini-cheie.)*
- **CLS 0,1 — exact la limita Google.** E „verde la limită". Orice imagine/banner adăugat fără dimensiuni fixe l-ar putea împinge în roșu. Merită monitorizat.
- **Meta description 161 caractere** — ușor peste limita recomandată (~155-160). Google poate trunchia ultimul cuvânt. Minor.

---

## 4. Ce-ți costă cel mai mult (top 3 din acest raport)

1. **GDPR/cookie-uri (20/100) pe public de minori** → risc legal real (amendă ANSPDCP/GDPR) + pierdere de încredere. *Cel mai urgent.*
2. **Trust 40/100 (fără contact + fără social proof)** → conversie pierdută: oameni gata să cumpere pleacă pentru că site-ul „nu pare destul de serios".
3. **Accesibilitate (navigare tastatură + skip-link)** → o parte din public exclus + mic risc legal de accesibilitate; fix relativ ieftin (~6h total).

---

## 5. Concluzie

Tutor stă **excelent pe fundamentul tehnic** (viteză 100, mobil 100, securitate 95) — exact zonele unde majoritatea site-urilor pică. Pierderile reale sunt pe **finisaje de încredere și conformitate**: bannerul de cookie-uri + privacy vizibil (obligatoriu legal, mai ales pe minori), semnalele de legitimitate (contact, About, testimoniale) și câteva ajustări de accesibilitate. **Niciun defect nu necesită reconstrucție** — toate sunt adăugiri pe infrastructură existentă. Securitatea aplicației (autentificare, autorizare, date) e tratată separat în `04b-security-audit.md`, unde apare și cea mai serioasă problemă de date a platformei: scurgerea de date despre minori în portalul de părinte (Watcher).
