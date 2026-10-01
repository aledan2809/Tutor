-- Addresses eTutor's automatic mail no longer goes to (01.10.2026, after the parent-alert loop): a mirror of
-- Resend's per-account suppression list, keyed by a keyed hash of the address. Additive: a new table, nothing else.
CREATE TABLE "EmailSuppression" (
    "emailHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastEventAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("emailHash")
);
