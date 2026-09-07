-- Codul de acces capătă termen, limită și contor.
--
-- Până acum era o cheie care nu se strica niciodată: fără expirare, fără limită de
-- folosiri, iar intrarea cu el nu lăsa nicio urmă. Voucher-ul din aceeași schemă
-- are toate trei de mult.
--
-- Aditiv, fără backfill: la momentul migrării nu era niciun cod în circulație
-- (verificat pe producție), deci nimeni nu pierde accesul. Codurile emise de acum
-- primesc termen implicit din cod, nu din baza de date.
ALTER TABLE "Domain" ADD COLUMN "joinCodeExpiresAt" TIMESTAMP(3);
ALTER TABLE "Domain" ADD COLUMN "joinCodeMaxUses" INTEGER;
ALTER TABLE "Domain" ADD COLUMN "joinCodeUses" INTEGER NOT NULL DEFAULT 0;
