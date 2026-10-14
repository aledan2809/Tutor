# Pâlnia, lotul 1 — confirmarea pe producție (14.10.2026)

Livrat pe 13.10 (`85b135c`). Verificat azi pe https://etutor.ro, doar citire.

## Sonda (`sonda-palnie-qa.mjs`, BASE=https://etutor.ro, iPhone 13 + calculator 1366×768)

Rezultatul complet: `sonda.txt`; capturile au rămas local (nu se comit, ca la celelalte sonde).

- **Bannerul de cookie-uri**: 57 px pe telefon (pe 05.10 acoperea aproape jumătate de ecran, peste butoanele principale).
- **`/ro` pe telefon**: „Încearcă o grilă acum — fără cont” și „Fă-ți cont gratuit” pe primul ecran, deasupra bannerului.
- **`/ro/parinte`**: „Începe cu 24,90 lei/lună”, „Încearcă fără card”, „Încearcă o grilă acum — fără cont”, toate vizibile.
- **`/ro/auth/register`**, **`/ro/try`**, **`/ro/grile`**: butonul principal vizibil. Titlurile sunt „… | eTutor.ro”.
- **Ce a marcat sonda ca problemă** (5), citit pe capturi:
  - `/ro/preturi` pe telefon: „Începe gratuit” la 674 px, sub primul ecran (664) — e pasul 9 din lotul 2, știut.
  - `/ro/auth/signin` pe telefon și `/ro/auth/register` pe calculator: linkul secundar „Încearcă fără cont” stă sub
    banner; butonul principal e vizibil, iar pagina se derulează (bannerul nu mai blochează). Mărunt.
  - `/ro/family/join` (ambele): fals — pagina are „Verifică codul”, pe care sonda nu-l recunoaște ca buton principal.
- **De reținut pentru lotul 2** (văzut pe captura de intrare pe telefon): titlul „Autentifică-te în **Tutor**” (marca e
  eTutor.ro); linkurile „Nu ai email? Recuperează pe telefon” și „Ai uitat parola?” se lipesc („telefonparola?”);
  „Folosește magic link” e jargon.

## Evenimentele în Umami (analytics.knowbest.ro, site etutor.ro, prin API)

- De la livrare: `cta_try` 1, `first_question` 1. Evenimentele ajung.
- `cta_register`, `register_done`, `cta_parinte_fara_card`: încă 0. Explicația e traficul: de la livrare, 4 vizitatori și
  15 afișări de pagină. Mecanismul e același pentru toate cinci, deci nu am creat conturi false pe producție ca să le forțez.
  De recitit peste o săptămână.
- Vizitele sondei nu apar în Umami (Umami ignoră browserele automate).

## Concluzie

Lotul 1 merge pe producție. Ce a rămas sunt pașii știuți din lotul 2 (în special 9: butonul de pe `/ro/preturi`).
