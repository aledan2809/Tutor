-- AlterTable: add needsTaxHelp to CreatorWaitlist
ALTER TABLE "CreatorWaitlist" ADD COLUMN "needsTaxHelp" BOOLEAN NOT NULL DEFAULT false;
