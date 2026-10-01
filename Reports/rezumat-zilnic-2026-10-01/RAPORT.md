# Rezumatul zilnic pentru părinți (01.10.2026)

Cerut de Alex prin sesiunea MA: „da, fă și rezumatul zilnic adevărat în eTutor”. Vine după reparația buclei de alerte
(`Reports/bucla-alerte-2026-10-01/`) și după adresele oprite (`Reports/adrese-oprite-2026-10-01/`).

## Ce primește părintele

O opțiune nouă în Setări → Notificări, la alertele despre copil: **„Rezumat zilnic la ora …”**.

- În timpul zilei părintele nu primește nimic pe telefon, pe e-mail, pe WhatsApp sau pe Telegram. Alertele rămân doar în
  aplicație, ca să le poată vedea dacă intră.
- La ora aleasă, socotită în fusul orar al părintelui, primește **un singur mesaj** pe canalele lui obișnuite, în ordinea
  aleasă. Mesajul are câte un rând pentru fiecare copil:
  - ce remindere a ignorat, cu orele lor, și la câte a revenit mai târziu;
  - la câte a răspuns la timp;
  - câte sesiuni de studiu a început;
  - ce a rămas fără răspuns.
- Dacă n-a fost nimic de spus, nu pleacă niciun mesaj.
- Ora aleasă e respectată și când cade în orele de liniște: părintele a cerut-o. O oră târzie (de exemplu 23:50), care
  cade după ultima verificare a zilei, pleacă la verificarea de la miezul nopții, pentru ziua ei.
- Mesajul acoperă exact timpul scurs de la rezumatul anterior, deci nu se pierde nimic între două rezumate: nici seara
  târziu, nici ora în plus de la schimbarea orei, nici o verificare întârziată.
- Spune și ce s-a schimbat între timp: un reminder rămas fără răspuns ieri, la care copilul a răspuns azi.
- Alertele de prag și cele despre bifele materiei nu mai ajung pe telefonul părintelui în timpul zilei. Rămân în
  aplicație și apar în rezumat, la „Alte alerte”.
- Nu pleacă spre adrese de test sau spre adrese oprite la Resend. Părinții cu contul pus pe pauză sunt săriți.

Exemplu de mesaj: „Rezumatul zilei pe eTutor.ro: Rareș” — „Rareș: 2 remindere ignorate (16:00, 18:30); a revenit mai
târziu la unul dintre ele; a răspuns la un reminder; o sesiune de studiu. Încă fără răspuns: reminderul de la 18:30.”

## Cum nu se dublează

Fiecare zi a fiecărui părinte e „luată” o singură dată, printr-un rând al contului în baza de date (se șterge odată cu
contul): două rulări care se suprapun nu pot trimite amândouă, iar o oră schimbată după trimitere nu-l trimite din nou.
E-mailul are și o cheie de unicitate pe zi, așa că Resend refuză o a doua copie. Dacă ceva cade înainte ca mesajul să
existe (de exemplu baza de date e ocupată), ziua rămâne liberă și următoarea verificare o reia.

## Reparații din revizia livrării de dimineață (2857014)

- WhatsApp și SMS: un refuz (șablon oprit, număr greșit) e socotit eșec, nu trimitere. Dacă furnizorul nu răspunde la
  timp, mesajul e socotit trimis, ca să nu fie plătit de două ori.
- Rularea la 15 minute nu-și mai prelungește lacătul general. Fiecare parte are lacătul ei, așa că o parte lentă nu le
  mai poate ține pe celelalte pe loc.
- Episoadele unui copil sunt tratate împreună. O rulare care rămâne fără timp nu le mai împarte, ca rularea următoare să
  nu le anunțe din nou.
- Răspunsurile la 👎 trimise elevului: se numără doar cele care chiar au plecat în afara aplicației.
- Un 409 de la Resend pe o cheie de unicitate înseamnă că mesajul a fost deja primit: nu se mai trimite prin SMTP.

## Verificare

- Teste unitare: 1.391/1.391 (15 pentru rezumat).
- Pe stiva de test locală, cu o cutie poștală falsă: **7/7** (`verificare-rezumat.mjs`):
  1. în timpul zilei nu pleacă nimic pe e-mail, iar alertele rămân în aplicație;
  2. la ora aleasă, chiar în orele de liniște, pleacă exact un mesaj;
  3. mesajul arată cele două remindere ignorate cu orele lor, revenirea, răspunsul și sesiunea;
  4. a doua rulare din aceeași zi nu mai trimite nimic;
  5. o zi fără nimic: niciun mesaj;
  6. rulări suprapuse: un singur mesaj;
  7. rezumatul următor pornește de unde s-a oprit cel dinainte: spune reminderul de ieri la care copilul a răspuns între
     timp și alerta de prag, fără să repete reminderele deja spuse.
- Pe aceeași construcție: alertele părinților 20/20, adresele oprite 8/8, lacătul care se prelungește 3/3.

## Revizia independentă

A găsit o greșeală gravă: o oră aleasă între 23:46 și 23:59 nu pleca niciodată, iar părintele nu mai primea nimic.
Restul, toate reparate: ore pierdute între două rezumate, ziua „consumată” de o eroare trecătoare, alertele de prag care
ajungeau totuși pe telefon, un fus orar inexistent care oprea rezumatul, textul („20 de sesiuni”, „a revenit la el”,
titlu neutru) și rândurile lipite în aplicație. Rămâne doar o alegere asumată: dacă niciun canal nu ia rezumatul (de
exemplu Resend nu răspunde), el rămâne în aplicație și nu se reîncearcă în aceeași zi.

## Livrare (cu OK-ul lui Alex)

Intră în aceeași livrare cu adresele oprite (migrarea `0077`, doar adaugă). Rezumatul nu cere schimbări în bază. După
livrare, cu OK, contul lui Anto trece pe „Rezumat zilnic la 22:00”, iar Alex rămâne pe ora fixă.
