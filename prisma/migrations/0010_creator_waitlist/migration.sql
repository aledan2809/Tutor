-- CreateTable
CREATE TABLE "CreatorWaitlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "experience" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ro',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorWaitlist_email_key" ON "CreatorWaitlist"("email");

-- CreateIndex
CREATE INDEX "CreatorWaitlist_subject_idx" ON "CreatorWaitlist"("subject");

-- CreateIndex
CREATE INDEX "CreatorWaitlist_createdAt_idx" ON "CreatorWaitlist"("createdAt");
