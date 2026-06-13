# 🔗 Linkuri campanii Tutor (etutor.ro)

> Linkuri directe pentru reclame / mesaje / postări. Forțează româna, pre-selectează materiile corecte și aplică automat voucherul (acces gratuit complet, fără pas de plată).
> **Ultima actualizare:** 2026-06-12

---

## 🎓 Evaluarea Națională (clasa a VIII-a)

```
https://etutor.ro/evaluare
```

- **Voucher:** `EVALUARE100` (100%, nelimitat, fără expirare) — auto-aplicat
- **Materii:** Română cl. VIII + Matematică cl. VIII (ambele pre-bifate)
- **Limbă:** RO forțat
- **Efect:** la crearea contului → abonament activ 1 an + înscriere automată la ambele materii, fără plată

---

## 🎓 Bacalaureat

```
https://etutor.ro/bac
```

- **Voucher:** `BAC2026FREE` (100%, nelimitat, fără expirare) — auto-aplicat
- **Materii:** 8 materii BAC (Română IX-XII pre-bifată — obligatorie; Matematică M1/M2/M3 + Istorie/Geografie/Biologie/Chimie de bifat în funcție de profil)
- **Limbă:** RO forțat
- **Efect:** la crearea contului → abonament activ 1 an + înscriere la materiile bifate, fără plată

---

## ⚙️ Administrare

- **Schimbare voucher fără redeploy:** editezi `EVALUARE_VOUCHER` / `BAC_VOUCHER` în `/var/www/tutor/.env` pe VPS2 (oglindite și în `Master/credentials/tutor.env`), apoi `pm2 restart tutor --update-env`.
- **Voucher ad-hoc pe link:** `https://etutor.ro/evaluare?voucher=ALTCOD` (override fără să atingi serverul).
- **Din panou:** Superadmin → Vouchers — poți dezactiva, pune limită de utilizări sau dată de expirare. Acum ambele sunt nelimitate, fără expirare.
- **Cod relevant:** preset materii în `src/app/[locale]/auth/register/page.tsx` (`CAMPAIGNS`); rutele scurte în `src/app/evaluare/route.ts` + `src/app/bac/route.ts`; aplicare voucher la signup în `src/app/api/auth/register/route.ts`.

---

## 📋 Tabel rapid

| Campanie | Link | Voucher | Materii pre-bifate |
|---|---|---|---|
| Evaluarea Națională | `etutor.ro/evaluare` | EVALUARE100 | Română + Mate cl. VIII |
| Bacalaureat | `etutor.ro/bac` | BAC2026FREE | Română IX-XII (restul de bifat) |
