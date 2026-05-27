-- AlterTable: add track + cvPath to CreatorWaitlist
ALTER TABLE "CreatorWaitlist" ADD COLUMN "track" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CreatorWaitlist" ADD COLUMN "cvPath" TEXT;

-- CreateIndex
CREATE INDEX "CreatorWaitlist_track_subject_idx" ON "CreatorWaitlist"("track", "subject");
