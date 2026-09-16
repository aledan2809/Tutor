-- Codul de reducere adus la înscriere (ex. V126S de pe flyer, ONV126S de pe site) sau scris pe
-- pagina Abonament, dar încă neplătit. Ținut în cont, ca părintele care încearcă întâi fără card
-- să nu mai caute flyerul la plată. Se golește când se înregistrează o plată cu acel cod.
-- Coloană nouă, goală pentru toți → nimic din ce există nu se schimbă.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pendingVoucherCode" TEXT;
