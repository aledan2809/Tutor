# Verificare: HTML neescapat în invitația pe email + lipsă plafon (2026-10-05, QA :3113)
- probe.sh = scriptul rulat; RESULT.txt = ieșirea brută; 01-invite-mail.json = mailul capturat din sinkul QA.
- Cont PARENT nou, nume `<a href="https://rau.example">Banca ta</a>` (acceptat de /api/auth/register, doar min 2/max 80).
- Mailul trimis conține numele ca link activ (src/lib/family-invite.ts:665 + :675, fără escapeHtml).
- 5 invitații CHILD către 5 adrese diferite → 5×201 delivered, 5 rânduri pending; checkSeat numără copii legați, nu invitații.
- Corecție față de raport: un cont cu parolă NU poate intra cu emailul neconfirmat (src/lib/auth.ts:282,330); am confirmat emailul direct în DB-ul QA. Intrarea cu Google ocolește oricum verificarea.
- Rândurile QA (User + FamilyInvite) șterse la final.
