-- Intrarea fără cont, cu momentul înscrierii ales de client.
--
-- Cerința: omul care primește linkul pe WhatsApp intră DIRECT în curs, iar contul
-- i se cere abia în faza pe care o hotărăște clientul — imediat, după câteva minute,
-- după a N-a întrebare, sau la final, ca să nu piardă ce a lucrat.
--
-- `isGuest` stă pe User, nu pe o tabelă separată, tocmai ca invitatul să fie un rând
-- de utilizator REAL, doar fără email. Așa „crearea contului" nu mută nimic: pune
-- emailul pe același rând, peste progresul și răspunsurile deja scrise acolo.
--
-- Aditiv, cu valori implicite: niciun rând existent nu se schimbă în comportament
-- (toți utilizatorii de azi rămân ne-invitați, toate materiile rămân pe IMMEDIATE,
-- adică exact regula de dinainte — cont cerut din prima).
ALTER TABLE "User" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Domain" ADD COLUMN "signupGate" TEXT NOT NULL DEFAULT 'IMMEDIATE';
ALTER TABLE "Domain" ADD COLUMN "signupGateValue" INTEGER;
