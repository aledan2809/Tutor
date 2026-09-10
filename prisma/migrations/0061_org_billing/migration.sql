-- Condițiile comerciale ale unei firme. Toate aditive și opționale: gol = „încă nu
-- s-a stabilit", nu zero. Prețul în bani întregi, ca la `Plan.price`.
CREATE TYPE "RitmFacturare" AS ENUM ('LUNAR', 'TRIMESTRIAL', 'ANUAL');

ALTER TABLE "Organization"
  ADD COLUMN "billingPlan"     TEXT,
  ADD COLUMN "billingAmount"   INTEGER,
  ADD COLUMN "billingCurrency" TEXT NOT NULL DEFAULT 'RON',
  ADD COLUMN "billingPeriod"   "RitmFacturare",
  ADD COLUMN "billingStartsAt" TIMESTAMP(3),
  ADD COLUMN "billingNote"     TEXT;
