-- Textele paginilor publice, editabile din panou. Aditiv: nicio tabelă existentă
-- nu e atinsă, deci o revenire înseamnă doar a nu mai citi de aici.
CREATE TABLE "PageCopy" (
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "PageCopy_pkey" PRIMARY KEY ("key")
);
