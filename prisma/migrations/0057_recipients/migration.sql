-- Lista de destinatari a clientului + numele de utilizator.
--
-- Cu mii de cursanți, un număr de telefon nu spune nimic unui manager. Iar
-- soluția nu e să-i cerem omului să se prezinte: HR-ul clientului știe deja cine
-- e. Identitatea vine de pe lista LOR.
--
-- `token` e miezul: fiecare invitat primește un LINK PROPRIU, nu codul comun al
-- materiei. De-aia se poate spune „Ion Popescu a citit lecția 2" din prima
-- apăsare, fără niciun formular de înscriere pus în calea omului.
--
-- `User.username` există fiindcă oamenii de teren n-au email de serviciu; dacă
-- identificatorul rămâne emailul, jumătate dintre ei nu se pot autentifica a doua
-- oară. Nullable, deci niciun cont de azi nu se schimbă.
--
-- Aditiv: nicio coloană existentă nu se atinge.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE TABLE "Recipient" (
  "id"         TEXT NOT NULL,
  "domainId"   TEXT NOT NULL,
  "lastName"   TEXT NOT NULL,
  "firstName"  TEXT NOT NULL,
  "jobTitle"   TEXT,
  "badgeNo"    TEXT,
  "phone"      TEXT NOT NULL,
  "county"     TEXT,
  "city"       TEXT,
  "postOffice" TEXT,
  "token"      TEXT NOT NULL,
  "invitedAt"  TIMESTAMP(3),
  "openedAt"   TIMESTAMP(3),
  "userId"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Recipient_token_key" ON "Recipient"("token");
CREATE UNIQUE INDEX "Recipient_userId_key" ON "Recipient"("userId");
CREATE UNIQUE INDEX "Recipient_domainId_phone_key" ON "Recipient"("domainId", "phone");
CREATE INDEX "Recipient_domainId_idx" ON "Recipient"("domainId");
CREATE INDEX "Recipient_badgeNo_idx" ON "Recipient"("badgeNo");

ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_domainId_fkey"
  FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
