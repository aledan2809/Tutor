# Acordul părintelui, ștergerea conturilor, bara probei — livrarea din 29.09.2026

Deciziile lui Alex (28–29.09.2026), puse în cod:

| # | Decizia | Ce face aplicația |
|---|---|---|
| 1 | „tb data nasterii, nu doar anul” | Înregistrarea cere ziua, luna și anul. Pragul de 16 ani se calculează pe ziua exactă (ora României, 29 februarie tratat). Conturile vechi, cu doar anul, primesc 31 decembrie al acelui an: nu apar niciodată mai mari decât sunt. |
| 2 | „Nu poti pastra datele unui cont refuzat” | La „nu” al părintelui contul copilului se șterge pe loc, cu tot ce a lucrat. Fără răspuns: 7 zile contul merge, apoi se oprește; se șterge în ziua 37, dar niciodată înainte de data numită în ultimul reminder și cel puțin 2 zile după el. |
| 3 | „Pune totul in Legal Hub” | Textul „Acordul părintelui” (vE1.0, ro/en) e publicat în Legal Hub. Răspunsul părintelui se scrie în Hub ÎNAINTE să fie aplicat în Tutor: ce a răspuns, când, ce text a văzut, IP, browser și o amprentă a adresei (nu adresa). Ștergerea contului se notează și ea acolo. Rândurile nu se pot modifica sau șterge nici din baza de date. |
| 4 | Invită & Câștigă | Rămâne; ascuns elevilor minori. Regulile de recomandare intră în Termeni (text propus, vezi mai jos). |
| 5 | 29.09: bara de sus | Timpul rămas din proba gratuită, mereu în antet: albastru, chihlimbar în ultimele 48 de ore, roșu în ultimele 24. Părintele vede și −30% pe viață (scos în evidență în ultimele 48 h). Elevul care și-a făcut singur cont vede doar timpul. Copilul unui părinte nu vede bara. Pe telefon: clepsidră + timp fără secunde. |
| 6 | 29.09: 48 de ore | Mesaj nou „Ultimele 48 de ore din proba gratuită”, în aplicație și pe e-mail, cu butonul „Păstrez −30%”. |
| 7 | 29.09: remindere părinte | 3 remindere: ziua 7 (contul s-a oprit), 30 (se șterge în 7 zile), 35 (se șterge pe data X). Fără preț și fără ofertă — adresa a dat-o un copil. |
| 8 | 29.09: conturi inactive | Contul în pauză în care nimeni din familie nu intră 12 luni se șterge. Avertismente cu 30, 7 și 1 zi înainte. Adulții primesc oferta de revenire: −30% cât rămân abonați, valabilă până în ziua ștergerii. Elevii care pot fi copii primesc doar avertismentul. **Nu se șterge niciodată fără ultimul avertisment** (cel puțin o zi după el). Plățile vechi rămân în evidență, fără datele persoanei. |

## Verificare

- `verificare-acord-parinte.mjs` — **83/83** (după a doua verificare; prima variantă: 54/54) pe stiva locală (Tutor QA + Legal Hub local, cron-ul adevărat, e-mailuri prinse într-o cutie poștală falsă): reminderele 7/30/35 o singură dată și cu link nou, rulare întârziată = doar ultimul reminder, data niciodată mai devreme de 2 zile; ștergere completă verificată în 13 locuri + fișiere; răspuns ajuns doar în Hub = aplicat, nu șters; refuz neterminat terminat de cron; cont cu plăți ținut pentru un om + scriptul manual; 16 ani împliniți; două răspunsuri simultane; bara (albastru/chihlimbar/roșu, cine vede reducerea, telefon 375 și 320 px); mesajul de 48 h; conturile inactive (avertismente, oferta de revenire la plată, ștergere doar după ultimul avertisment, familia ține contul, plăți vechi).
- `verificare-legal-hub.mjs` — **36/36** (Legal Hub: semnătura, cheia valabilă doar pe ruta asta, un singur răspuns pe link, „fără răspuns” refuzat după un „da”, rândurile nu se pot modifica/șterge).
- Regresia livrării precedente `../true-e2e-2026-09-26/verificare-reparatii.mjs` — **75/75**.
- Teste unitare Tutor **1345/1345**, Legal **26/26**; tipuri și lint curate.

Defecte prinse de probă și reparate pe loc: (1) un calcul greșit („NaN”) care ar fi împiedicat orice ștergere de cont inactiv — mutat într-o funcție cu test; (2) conturile inactive puteau fi șterse fără niciun avertisment dacă trimiterea e-mailurilor cădea — acum ultimul avertisment e obligatoriu; (3) pe telefon, bara împingea clopoțelul în afara ecranului.

## A doua verificare independentă (29.09)

Șase revizori pe domenii (acordul părintelui, ștergerea, Legal Hub, conturile inactive și oferta, textele și ecranele,
siguranța publicării), fiecare constatare contestată de trei alți revizori: **43 confirmate, toate reparate**, plus trei
verificate de mine. Cele mai importante:

- **Bani**: un cont cu un abonament separat încă activ (materie sau loc în plus) putea fi șters, iar cardul taxat în
  continuare → acum nimic încă plătit (card, abonament separat, comisioane de primit) nu se șterge fără un om.
  Comisioanele celui care a recomandat familia dispăreau odată cu contul → migrația 0076 le păstrează.
- **Ștergeri greșite**: reminderele unei perioade vechi puteau șterge contul mai devreme decât data comunicată → fiecare
  reminder e legat de perioada lui. Un părinte putea fi șters deși celălalt părinte al copilului intra în cont → familia
  înseamnă acum toți cei legați. Un refuz „expira” la 16 ani → ține până la ștergere.
- **Promisiuni neadevărate**: „Nimic nu se șterge” (mesajul de lansare, pagina pentru părinți); textul acordului spunea
  că nu păstrăm adresa părintelui (acum o ștergem după răspuns); oferta −30% expira înaintea datei din e-mail; e-mailul
  retrimis spunea „se oprește după 7 zile” unui cont deja oprit; datele „până pe 8 octombrie” țin acum toată ziua.
- **Ecrane**: bara lărgea pagina la unele lățimi și era citită de cititoarele de ecran în fiecare secundă; câmpurile
  datei nu încăpeau la 320 px.

## Publicat (29.09, noaptea)

- Legal Hub (`843e3dd`): copie de siguranță, repetiție pe o copie refăcută (migrația și textul curate, 280 de consimțăminte
  neatinse), apoi publicare; textul acordului vE1.0 servit public; ruta nouă refuză cererile nesemnate.
- eTutor (`1617e4f`): copie de siguranță, migrațiile 0075 + 0076, build, repornire; cron orar
  `/api/cron/account-retention`. Prima rulare pe prod n-a atins niciun cont (comutatorul probei e oprit, niciun minor,
  cel mai vechi cont e din martie).

## Rămâne la Alex

1. Textele propuse pentru Politica de confidențialitate vE1.2 și Termeni vE1.1 (`privacy-*-vE1.2-propus.md`, `tos-*-vE1.1-propus.md`) — de citit și confirmat înainte de publicare.
2. Pentru Termeni §9A.5 (recomandări): pragul minim de plată, cât de des se plătește, în ce cont și reținerea de impozit.
3. ~~Rândul „Alte conturi inactive — 24 luni”~~ — **decis 29.09: se scoate** (făcut în textul propus).
4. ~~Ștergerea contului din Setări~~ — **decis 29.09: se scoate promisiunea din Termeni**; ștergerea se cere din formularul de pe pagina Politicii de confidențialitate sau prin e-mail (textul propus corectat, și la drepturi și la retragerea acordului, unde apărea „Setări → Contul meu”, pagină care nu există).
5. ~~Conturile blocate~~ — **decis 29.09: se păstrează cât timp sunt blocate** (scris în politică).
6. Comutatorul probei e oprit pe prod: bara de sus, mesajul de 48 h și ștergerea la 12 luni pornesc doar când e aprins.
