-- A referral's earnings outlive the referred account (Alex, 29.09.2026 — accounts erased after a parent's
-- „no”, after no answer, or after 12 months unused): the commission owed or paid to the person who
-- recommended the family stays when the family's account is erased. Additive: nothing is dropped, and the
-- code already running never writes a null here.
ALTER TABLE "ReferralEarning" ALTER COLUMN "referralId" DROP NOT NULL;
ALTER TABLE "ReferralEarning" DROP CONSTRAINT "ReferralEarning_referralId_fkey";
ALTER TABLE "ReferralEarning" ADD CONSTRAINT "ReferralEarning_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
