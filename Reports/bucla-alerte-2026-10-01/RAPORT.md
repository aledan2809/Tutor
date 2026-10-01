# Bucla de e-mailuri către părinți — reparată (01.10.2026)

## Ce s-a întâmplat

Pe 30.09, alertele către părinți („copilul nu a reacționat”, „a reacționat ✅”) au plecat în buclă.
Anto a primit 548 de alerte într-o zi, iar Alex 400. Pe o săptămână, un părinte a ajuns la ~1.100 de e-mailuri.
Contul de trimitere e comun pentru toate aplicațiile, așa că și-a atins plafonul zilnic pentru toate.
Pe 01.10, Alex a oprit ambele cron-uri de remindere de pe VPS2. Liniile au acum prefixul
`#PAUSED-TUTOR-EMAIL-LOOP-2026-10-01`, iar copia crontab-ului e în
`/root/backups/crontab.bak-2026-10-01-pre-tutor-reminders-pause`.

## De ce (măsurat pe producție, doar citire)

1. **Rulări suprapuse.** Cron-ul de la 15 minute apelează `curl` fără limită de timp. Unele rulări au durat ore,
   iar mai multe lucrau în paralel, fiecare din lista ei veche. Aceeași închidere de episod s-a anunțat de mai multe ori:
   am găsit episoade rezolvate care au fost atinse din nou la 14 ore după rezolvare.
2. **Episoadele se adunau.** O ratare nouă deschidea un episod nou, chiar dacă cel vechi aștepta încă.
   Rareș ajungea la 4–6 episoade pe zi pentru fiecare părinte.
3. **Re-anunțul nu se oprea niciodată.** Fiecare episod deschis își retrimitea mesajul la 30 de minute, la nesfârșit.
   Unele episoade au ajuns la treapta 84.
4. **Câte un „A reacționat ✅” pentru fiecare episod.** Când copilul intra în aplicație, fiecare episod deschis își trimitea
   propriul anunț, către fiecare părinte. Erau până la 25 de mesaje într-o singură rulare.
5. **Adrese de test.** Mesajele plecau și spre adrese care nu pot primi nimic (`test.com`, `example.*`).
   Se întorceau toate ca respinse, iar respingerile strică reputația contului comun de trimitere.

## Ce face codul acum

- **O singură rulare a cron-ului de 15 minute odată.** Toată ruta ia „rândul” (`withCronLease`, 30 de minute), iar
  monitorizarea părinților mai are și rândul ei. O a doua rulare, venită cât prima încă lucrează, nu face nimic.
  Garda e pe server, nu în crontab, pentru că o rulare continuă pe server chiar dacă apelul `curl` e întrerupt.
- **Un lanț de remindere se recunoaște după prima lui treaptă**, exact cum îl recunoaște motorul de remindere.
  Înainte, începutul lanțului era cel mai vechi eveniment rămas în fereastra de 12 ore. Pe măsură ce evenimentele
  ieșeau din fereastră, începutul aluneca înainte și aceeași ratare părea nouă. Asta era mecanismul celor 4–6 episoade
  pe zi. Acum o ratare are episodul ei o singură dată, oricând ar apărea treptele ei. Asta include treptele unei
  cascade lente setate de părinte, create după ce s-a deschis episodul.
- **Reminderul suplimentar autorizat de părinte nu deschide niciodată un episod nou.** Rezultatul lui îl anunță doar
  pasul care îl urmărește, o singură dată, indiferent dacă părintele are plan plătit.
- **Un singur episod deschis per copil, iar o ratare nouă îl înlocuiește pe cel care aștepta** (stare nouă:
  `superseded`). Părintele află de ratarea de dimineață, nu doar de cea de aseară. Deschiderea se face sub un lacăt
  pe copil, în baza de date, deci nici două rulări suprapuse nu pot deschide aceeași ratare de două ori.
- **Ratarea de seară se raportează și dacă dimineața copilul răspunsese.** Înainte, cele două lanțuri erau văzute ca unul
  singur, iar reacția de dimineață o ascundea pe cea de seară.
- **Cel mult 3 re-anunțuri pe episod.** După ele, episodul așteaptă în liniște reacția părintelui
  (`MAX_PARENT_RENOTIFY`).
- **Un episod lăsat peste o zi se închide singur, fără niciun mesaj** (stare nouă: `expired`). Ziua se numără de
  la deschiderea episodului. Unul cu reminder suplimentar autorizat, rămas nerezolvat, se închide la două zile după
  autorizare.
- **Un singur „A reacționat ✅” per copil**, oricâte episoade se închid deodată. Când copilul răspunde prompt,
  anunțul pleacă o singură dată și rămâne notat. Nu se repetă nici dacă părintele îl șterge din listă.
- **Fiecare trimitere e „revendicată” în baza de date înainte să plece.** Doar rularea care schimbă starea trimite.
  Asta se aplică la închideri și re-anunțuri, dar și la alertele de prag, la rapoartele către părinți și la mesajele
  cerute de părinte. Două rulări nu mai pot trimite același mesaj.
- **Cel mult 8 alerte pe zi ajunse pe dispozitivele unui părinte.** Ziua e cea calendaristică, după ora României
  (`PARENT_ALERTS_PER_DAY`). Se numără doar mesajele care chiar au plecat; rândurile rămase doar în aplicație
  nu consumă plafonul. **Prima alertă a unei ratări pleacă oricum**, fiindcă e chiar alerta pentru care există funcția.
  Peste plafon, restul rămân în lista din aplicație, fără e-mail, push sau Telegram.
- **Un părinte scos din familie nu mai primește re-anunțuri.**
- **Fiecare rulare își termină lucrul în cel mult 20 de minute**, apoi lasă restul pentru rularea următoare. Pe 30.09,
  rulările de ore întregi se suprapuneau tocmai pentru că depășeau rândul de 30 de minute. O eroare la un copil nu mai
  oprește alertele celorlalți.
- **Nimic spre adrese de test sau rezervate** (`test.com`, `example.*`, `.test`, `.invalid`, `.localhost`, numele
  rezervate singure, domeniile de test ale eTutor). Filtrul e pus în toate locurile care trimit e-mailuri automate din
  aceste cron-uri: alertele către părinți, alertele de prag, rapoartele către părinți și reminderele copilului.
  La reminderele copilului, treapta de e-mail e sărită, nu reîncercată. Fișierul e `src/lib/email-recipients.ts`.

**Neatins, cu intenție:** transportul de e-mail. Sesiunea MA lucrează la separarea pe conturi, cu un domeniu de trimitere
propriu pentru eTutor, deci întâi ne coordonăm. La fel, citirea respingerilor de la Resend (webhook-uri bounce/complaint)
cere coordonare pe contul comun.

## Verificare

- **Teste unitare:** 1.351/1.351 trec, inclusiv cele noi pentru filtrul de adrese și pentru plafonul de re-anunțuri.
  Verificarea de tipuri și eslint sunt curate, iar construcția trece.
- **Revizii independente.** Prima a confirmat bucla închisă și a găsit trei probleme medii, toate reparate:
  ratarea nouă era ascunsă, plafonul se consuma pe mesaje care nu plecaseră, iar restul cron-ului se putea suprapune.
  A doua a găsit două probleme serioase în reparația mea, tot reparate. Treptele unei cascade lente erau luate drept
  ratări noi, iar reminderul autorizat de un părinte fără plan era raportat de două ori. Soluția a fost recunoașterea
  lanțului după prima treaptă. A treia nu a găsit nicio problemă gravă. Am aplicat ce a semnalat: expirarea se
  numără de la deschiderea episodului, lanțul e căutat pe 14 zile (cât îl ține motorul în viață), iar reacția promptă
  e notată sub același lacăt. Am pregătit și curățenia de la repornire.
- **Cap-coadă pe stiva de test locală**, cu cron-ul adevărat și o cutie poștală falsă: **19/19 trec**.
  Scriptul e `verificare-alerte-parinte.mjs`. Verifică:
  1. o ratare deschide un singur episod per părinte și un singur anunț;
  2. adresa `test.com` primește doar anunțul din aplicație;
  3. aceeași ratare, cu prima treaptă ieșită din fereastră, nu deschide nimic (mecanismul buclei);
  4. vin exact 3 re-anunțuri, apoi liniște;
  5. două rulări simultane trimit o singură dată;
  6. o rulare care ține încă rândul monitorizării o oprește pe următoarea;
  7. o rulare care ține rândul întregului cron o oprește pe următoarea;
  8. o ratare nouă înlocuiește episodul care încă aștepta, iar părintele află de ea;
  9. reacția copilului închide episoadele deschise, cu un singur anunț per părinte;
  10. rularea următoare nu mai trimite nimic;
  11. episodul de peste o zi se închide fără mesaj;
  12. peste 8 alerte livrate azi, re-anunțul rămâne doar în aplicație;
  13. rândurile rămase doar în aplicație nu consumă plafonul;
  14. prima alertă a unei ratări pleacă și peste plafon;
  15. o treaptă târzie a unei cascade lente nu deschide alt episod;
  16. reminderul autorizat de un părinte fără plan, ignorat: un singur „Nu a reacționat ❌”, fără episod nou;
  17. dimineața a răspuns, seara a ignorat: ratarea de seară ajunge la părinte;
  18. o reacție promptă se anunță o dată, chiar dacă părintele șterge anunțul;
  19. un părinte scos din familie nu mai primește re-anunțuri.
- **Contra-probă pe codul vechi** (`contra-proba-cod-vechi.ts.txt` — păstrat ca text, fiindcă importă o copie temporară a codului vechi), pe aceleași situații:

  | | episoade deschise | re-anunțuri | „A reacționat” |
  |---|---|---|---|
  | **Cod vechi** | 2 | 12 | 2 |
  | **Cod nou** | 1 | 3 | 1 |

## Reluarea cron-urilor — doar cu OK-ul lui Alex

1. Livrarea codului pe VPS2 (build + restart `tutor`).
2. **Curățenia, o singură dată, înainte de repornire** (`curatenie-inainte-de-repornire.sql`, după o copie a bazei).
   Fără ea, la repornire ar pleca mesaje vechi sau duble:
   - treptele de remindere care așteptau de dinainte de oprire s-ar trimite la copii cu zile întârziere;
   - episoadele vechi rămase deschise ar mai primi re-anunțuri;
   - episoadele vechi n-au ca început prima treaptă a lanțului, cum cere regula nouă, deci ar declanșa încă o alertă.

   Scriptul închide treptele care așteaptă și episoadele deschise, fără niciun mesaj, și le dă episoadelor vechi
   începutul corect. Repetiția pe baza de test, cu date seminate pentru fiecare situație: **5/5**
   (`repetitie-curatenie.mjs`).
3. Scoaterea prefixului `#PAUSED-TUTOR-EMAIL-LOOP-2026-10-01` de pe cele două linii. Opțional, pe linia de la
   15 minute: `curl -m 840` și `flock -n`, ca la linia de la minut. Codul nu mai depinde de ele, dar curăță procesele.

## Rămâne deschis

- **Respingerile de la Resend** (webhook bounce/complaint), ca o adresă care respinge să nu mai primească nimic.
  Cere coordonare cu sesiunea MA, pe contul comun.
- **Reminderul suplimentar autorizat** (fără buton în aplicație azi, deci nefolosit). Dacă la autorizare copilul are deja
  un lanț în curs, nu pornește niciun reminder nou, iar părintele primește totuși, după o oră, „nici după reminderul
  suplimentar”. Celălalt părinte mai primește „Autorizează…?” pentru aceeași ratare. De reparat înainte să apară butonul.
- **Prima alertă vine prea devreme la cascadele lente.** E un comportament mai vechi decât bucla. Când părintele a pus
  pauze de peste 45 de minute între trepte, alerta „nu a reacționat la niciun canal” pleacă după prima treaptă, deși
  urmează altele. Acum pleacă o singură dată pe lanț, dar textul nu e exact.
- **Timpi-limită la trimiterea e-mailului.** Apelul către Resend nu are nicio limită de timp, iar la SMTP limita
  implicită e de ordinul minutelor. Un e-mail agățat poate lungi o rulare. Bugetul de 20 de minute și lacătele țin rularea în frâu, dar limita ține de transport, deci se face împreună
  cu sesiunea MA.
- Două trimițătoare de e-mail (reminderele pentru acordul părintelui, avertismentele pentru conturile inactive)
  nu folosesc încă filtrul de adrese. Au rândul lor și își notează trimiterea înainte, deci nu pot intra în buclă.
  Le-am lăsat neatinse fiindcă fac parte din drumul acordului și al ștergerii contului: ce se întâmplă cu un
  cont a cărui adresă e refuzată trebuie hotărât acolo, nu aici. Răspunsurile la feedback
  îl folosesc acum.
