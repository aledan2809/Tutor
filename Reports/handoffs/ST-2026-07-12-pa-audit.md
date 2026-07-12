# ST — Tutor: audit COMPLET /pa + True E2E [10] (handoff 2026-07-12)

Mode: Y Direct (mesh) — audit → cod-actual vs STRATEGY.md → propunere+mockups → APROBARE user → TWG. Deploy DOAR cu confirmare explicită (site LIVE auth+billing). NU deploy rafală.

## Pre-flight
- `ssh root@72.62.155.74 'cd /var/www/tutor && git rev-parse --short HEAD'` (așteptat = `3c8cdd1` sau mai nou) + `pm2 tutor online`
- `pm2 logs tutor --err --lines 15 --nostream` ÎNTÂI (doar „Push not delivered" = benign, L20)
- `curl https://etutor.ro/ro` → 200
- Login real: `admin-test@tutor.app` / `vqAY88Ym7aJ7xwQM` (CSRF → callback/credentials → session)

## Current state (Batch 3 închis 2026-07-12)
Remindere & escaladare configurabile COMPLET LIVE (Batch 1+2 `c7fa557` · Batch 3 `cc66fde`, migrație 0041). F1 cadența părintelui (`selfAlertMode/EveryH/At` pe NotificationPreference, `/watcher/setari`) + F2 presetări/trepte copil (`NotificationPreference.escalationSteps`, cardul copilului). Detalii în `TODO_PERSISTENT.md` item „Remindere & escaladare" + DEVELOPMENT_STATUS.md.

## Task (cerut de user, DUPĂ Batch 3)
Audit COMPLET `/pa` pe **toate rolurile** (elev / părinte / meditator / admin / superadmin / vizitator) + **True E2E [10]** pe TOT scope-ul:
- Fluxuri end-to-end, butoane, meniuri, **ergonomie** — lentila „vreau să vând app-ul": experiență proactivă, auto-descoperită, **zero 404**, fără să ai nevoie de help/manual.
- **Cod-actual vs `STRATEGY.md`** — unde codul e mai avansat decât strategia → ridică strategia (NU tăia feature-uri, memory `feedback-audit-no-cut-when-code-ahead`).
- Livrabil: propunere + **mockups** (mockup-first) → aprobare user → TWG per item.
- `/pa` skill = capability map (F0 strategy-steward · F1 gap · F2 persona-walk · F3 WOW redesign). Vezi `/pa` help.

## Facilities
- Creds: `Master/credentials/tutor.env` · test admin: `admin-test@tutor.app` / `vqAY88Ym7aJ7xwQM` · instructor test: `instructor-test@tutor.app`
- Deploy VPS2: `git pull && npm install && npx prisma migrate deploy && NODE_OPTIONS=--max-old-space-size=4096 npm run build && pm2 restart tutor --update-env` (backup DB `pg_dump` întâi)
- Prod: etutor.ro (VPS2 :3013, local PG). Guardian real în DB = contul user (`alexdanciulescu@gmail.com`) — NU muta date reale de familie; pt F2 UI folosește fixture parent+child test.

## Active rules
Fără „AI" în copy · Legal NO-TOUCH · NU deploy rafală (L19) · pm2 --err întâi (L20) · deploy doar cu COD (L21) · migrații LIVE = propose-confirm · RO plain · mockup-first · verifică efect real nu claims · Prisma comentarii `//` nu `/** */` · `next build` nu type-check testele — folosește build-ul ca gate real (L22).

## Follow-ups deschise (non-blocker)
- Fix pre-existent mock `tests/unit/exam-engine.test.ts` (`passage: null` + eventual `tags: []`) — scos la iveală de prisma generate; nu blochează deploy.
- Opțional user: template Meta „parent-alert" (WhatsApp fiabil pe alerte părinte).
- F2 write-path UI pe parent+child real neexercitat pe prod (acoperit de teste) — exercită cu fixture la nevoie.
