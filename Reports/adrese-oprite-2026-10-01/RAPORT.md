# Adresele care nu mai primesc mesaje automate + limite de timp la trimitere (01.10.2026)

Continuarea reparației buclei de alerte (`Reports/bucla-alerte-2026-10-01/`), cerută de sesiunea MA.
Contul Resend rămâne același, comun cu celelalte aplicații. Nu se schimbă furnizorul, contul și nici adresa de
expeditor (pe producție: `eTutor <noreply@techbiz.ae>`, același domeniu ca MA).

## De la ce pornim

Resend ține o listă de adrese oprite pentru tot contul. După ce o adresă a respins definitiv un mesaj sau a marcat unul
ca spam, Resend aruncă orice mesaj următor spre ea, de la orice aplicație de pe cont. Până acum eTutor nu știa asta:
trimitea, Resend accepta cererea și apoi arunca mesajul, iar eTutor socotea că mesajul „a plecat”. O alertă către
părinte nu mai trecea la alt canal, iar un reminder era numărat ca trimis.

## Ce face

- **eTutor ține o copie a listei Resend.** Resend anunță printr-un webhook adresele respinse definitiv, plângerile de
  spam și adresele pe care le oprește deja, de la orice aplicație de pe cont. eTutor nu le mai trimite **mesaje
  automate**. Alerta se oprește cinstit, iar sistemul trece la alt canal, de exemplu notificarea din aplicație.
- **Ce cere omul pleacă mereu la Resend**, adică linkul de autentificare și resetarea parolei. Decide Resend, la fel ca
  înainte. Copia noastră nu blochează nimic în plus și nu dezvăluie nimănui starea unei adrese.
- **O adresă iese singură din listă** când Resend raportează, mai târziu, un mesaj livrat cu succes către ea. Asta se
  întâmplă de exemplu după ce Alex o scoate din lista Resend. Ordinea întârzierilor e respectată în ambele sensuri: o
  livrare raportată cu întârziere, mai veche decât plângerea, nu o scoate, iar o plângere veche sosită după eliberare nu
  o oprește din nou.
- **Un mesaj cu mai mulți destinatari e ignorat**, pentru că Resend nu spune care dintre ei a respins. eTutor scrie
  mereu unei singure persoane. Ce scapă astfel se prinde la următorul mesaj, prin evenimentul „suppressed”.
- **Nu se păstrează adresele, doar o amprentă a lor**, făcută cu cheia secretă a serverului: tabelul nu poate fi
  comparat cu o listă de adrese din altă parte. Majoritatea adreselor din listă sunt ale clienților altor aplicații.
  Rândurile fără nicio veste de un an se șterg singure; dacă adresa e încă oprită la Resend, revine la primul mesaj.
  Jurnalul păstrează doar numărul și motivul.
- **Limite de timp la trimitere.** Resend are 20 de secunde să răspundă. Dacă nu răspunde, mesajul nu se mai trimite a
  doua oară prin SMTP, ca să nu ajungă dublu. La SMTP: 10 secunde pentru conectare și salut, 20 de secunde pentru
  răspuns. Înainte, un server tăcut putea ține o trimitere până la 10 minute.

Fișiere: `src/lib/email-suppression.ts`, `src/app/api/webhooks/resend/route.ts`, `src/lib/email.ts`, tabelul nou
`EmailSuppression` (migrarea `0077_email_suppression`, doar adaugă). Webhook-ul e scos din limita de cereri pe adresă,
ca plata de la Stripe: e semnat și verificat în rută, iar într-un minut aglomerat poate raporta multe livrări. În schimb
refuză înainte de a citi conținutul orice cerere fără anteturile semnăturii sau cu data veche, și orice conținut peste
64 KB.

## Verificare

- Teste unitare: 1.371/1.371. Cele noi verifică semnătura, inclusiv pe exemplul publicat de Svix, citirea evenimentelor,
  amprenta, eliberarea și limitele de trimitere.
- Cap-coadă pe stiva de test locală, cu webhook-ul semnat ca de Resend și o cutie poștală falsă: **8/8**
  (`verificare-adrese-oprite.mjs`):
  1. fără semnătură, cu semnătură veche sau prea mare: refuzat;
  2. o respingere definitivă oprește adresa, se păstrează doar amprenta, iar reîncercarea aceluiași eveniment nu
     dublează nimic;
  3. plângerea oprește adresa, de la orice aplicație; o respingere rămâne respingere; „suppressed” e notată; un mesaj
     cu mai mulți destinatari e ignorat;
  4. alerta automată nu pleacă spre adresele oprite, dar rămâne în aplicație; o adresă normală o primește;
  5. resetarea parolei cerută de om nu e oprită de listă;
  6. o livrare mai veche decât plângerea nu o eliberează, una mai nouă da, iar o plângere veche sosită târziu nu o
     oprește din nou;
  7. după eliberare, alerta automată ajunge din nou la adresă;
  8. un server de e-mail care tace după mesaj e abandonat în 21 de secunde, în loc de 10 minute.
- Verificarea buclei de alerte, pe aceeași construcție: 19/19.
- Două revizii independente. Prima a confirmat semnătura și limitele de timp și a găsit că domeniul de trimitere e comun
  cu MA, iar lista Resend e pe tot contul; designul a fost refăcut după asta. A doua a confirmat forma nouă și a cerut
  regula unui singur destinatar, refuzul timpuriu al cererilor mari, datele salvate în UTC, eliberarea păstrată și
  amprenta cu cheie. Toate sunt aplicate.

## Livrare (cu OK-ul lui Alex)

1. Copie a bazei, apoi pe VPS2: `git pull`, `npx prisma migrate deploy` (doar tabelul nou), `npx prisma generate`,
   construcție, repornire `tutor`. Până la pasul 3, webhook-ul răspunde „neconfigurat”, iar trimiterile merg ca acum.
2. **Alex, în panoul Resend** (contul comun): Webhooks → Add Endpoint →
   - URL: `https://etutor.ro/api/webhooks/resend`
   - evenimente: `email.bounced`, `email.complained`, `email.suppressed`, `email.delivered`
   - după salvare, copiezi „Signing Secret” (începe cu `whsec_`).
3. Secretul intră în `/var/www/tutor/.env` ca `RESEND_WEBHOOK_SECRET=…` și în `Master/credentials/tutor.env`, apoi
   repornire `tutor`. Evenimentele refuzate până atunci sunt retrimise de Resend.
4. Verificare live, fără să oprească nicio adresă: o cerere semnată cu secretul, cu un eveniment care nu schimbă nimic
   (`email.opened`), trebuie să primească 200; una nesemnată, 401.

Webhook-ul existent al MA (`ma.techbiz.ae/api/webhooks/resend`) rămâne neatins: Resend permite mai multe endpoint-uri
pe același cont.

## Rămâne deschis

- Callback-ul de plată de la Stripe (`/api/stripe/callback`) are aceeași scutire de limită și citește tot conținutul
  înainte de verificare. E mai vechi decât lucrul de azi. Merită aceeași limită de 64 KB, separat.
- Adresele pe care Resend le avea deja oprite înainte de livrare intră în copia noastră abia la primul mesaj trimis spre
  ele (Resend raportează atunci `email.suppressed`). Până atunci, un singur mesaj automat mai poate fi „acceptat” fără să
  plece.
- Reminderele pentru acordul părintelui și avertismentele pentru conturile inactive reîncearcă din oră în oră, de câteva
  ori, când un mesaj nu pleacă. Spre o adresă oprită, reîncercările nu trimit nimic, dar mută data afișată cu câte o oră
  până se socotește dat.
