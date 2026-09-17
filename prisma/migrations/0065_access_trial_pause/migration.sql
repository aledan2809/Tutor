-- Proba de 7 zile și pauza din ziua 8 (decizii Alex 16.09.2026).
-- „Gratuit permanent" pe cont: prieteni și testeri bifați din administrare nu intră în probă și nici în
-- pauză. Coloană nouă, false pentru toți → nimic din ce există nu se schimbă.
ALTER TABLE "User" ADD COLUMN "freeForever" BOOLEAN NOT NULL DEFAULT false;

-- Setări ale platformei. Pauza pornește abia când administratorul scrie rândul `accessTrial`;
-- până atunci tabela e goală și comportamentul rămâne cel de azi.
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);
