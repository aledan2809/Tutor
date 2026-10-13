-- Where a card subscription stands (13.10.2026, from the payment broker's callback contract v3): the end of
-- the paid period / next charge date, a scheduled stop, the price of a period, the bank's next retry and the
-- moment it was last read. Shown to the payer only. Additive: five nullable columns on "User", nothing else.
ALTER TABLE "User" ADD COLUMN "subscriptionPeriodEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "subscriptionCancelAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "subscriptionPrice" INTEGER;
ALTER TABLE "User" ADD COLUMN "subscriptionRetryAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "subscriptionSyncedAt" TIMESTAMP(3);
