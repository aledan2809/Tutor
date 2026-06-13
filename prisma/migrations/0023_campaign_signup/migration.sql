-- Marketing campaign attribution (UTM + per-voucher conversion tracking).
-- One row per signed-up user; isTest keeps synthetic/seed accounts out of stats.
-- Additive; FK cascades on user delete.
CREATE TABLE "CampaignSignup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaign" TEXT,
    "voucherCode" TEXT,
    "landingPath" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignSignup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignSignup_userId_key" ON "CampaignSignup"("userId");
CREATE INDEX "CampaignSignup_campaign_idx" ON "CampaignSignup"("campaign");
CREATE INDEX "CampaignSignup_voucherCode_idx" ON "CampaignSignup"("voucherCode");

ALTER TABLE "CampaignSignup" ADD CONSTRAINT "CampaignSignup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
