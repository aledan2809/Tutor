-- Vouchere parțiale (cu plată pe card), pentru campania flyer „cât o cafea” (V126S):
--   recurring   = reducerea rămâne pe fiecare plată a abonamentului, nu doar pe prima;
--   oncePerUser = o singură folosire pe cont, ținută minte în VoucherRedemption;
--   planKey     = codul merge doar pe planul acesta (null = pe orice plan).
-- Implicit false/null → voucherele existente se comportă exact ca până acum.

-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "oncePerUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planKey" TEXT,
ADD COLUMN     "recurring" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VoucherRedemption" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoucherRedemption_userId_idx" ON "VoucherRedemption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherRedemption_voucherId_userId_key" ON "VoucherRedemption"("voucherId", "userId");

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

