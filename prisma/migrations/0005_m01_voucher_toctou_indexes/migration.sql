-- M01: Add composite index for atomic voucher redemption (TOCTOU fix)
-- Supports: WHERE code = ? AND isActive = true AND (maxUses IS NULL OR usedCount < maxUses)
CREATE INDEX "Voucher_code_isActive_idx" ON "Voucher"("code", "isActive");

-- M01: Add check constraint to prevent usedCount going negative
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_usedCount_non_negative" CHECK ("usedCount" >= 0);

-- M01: Add check constraint to prevent discountPercent out of range
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_discountPercent_range" CHECK ("discountPercent" >= 0 AND "discountPercent" <= 100);
