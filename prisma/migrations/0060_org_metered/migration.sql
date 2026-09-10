-- Canalele contorizate incluse pentru o firmă facturată separat (B2B). Aditiv.
ALTER TABLE "Organization" ADD COLUMN "meteredIncluded" BOOLEAN NOT NULL DEFAULT false;
