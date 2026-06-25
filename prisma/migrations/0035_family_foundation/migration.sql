-- AlterTable: distinguish a real parent from a paid tutor on each guardian link.
ALTER TABLE "Guardian" ADD COLUMN "relation" TEXT NOT NULL DEFAULT 'PARENT';

-- CreateTable
CREATE TABLE "FamilyInvite" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "code" TEXT,
    "targetRole" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'PARENT',
    "email" TEXT,
    "phone" TEXT,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilyInvite_token_key" ON "FamilyInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyInvite_code_key" ON "FamilyInvite"("code");

-- CreateIndex
CREATE INDEX "FamilyInvite_inviterId_status_idx" ON "FamilyInvite"("inviterId", "status");

-- CreateIndex
CREATE INDEX "FamilyInvite_status_expiresAt_idx" ON "FamilyInvite"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "FamilyInvite" ADD CONSTRAINT "FamilyInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyInvite" ADD CONSTRAINT "FamilyInvite_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
