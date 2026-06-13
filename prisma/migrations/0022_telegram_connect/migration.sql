-- Telegram opt-in channel: bind a Telegram chat to a user + single-use connect tokens.

ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramLinkedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

CREATE TABLE "TelegramConnectToken" (
    "nonce" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramConnectToken_pkey" PRIMARY KEY ("nonce")
);

CREATE INDEX "TelegramConnectToken_expiresAt_idx" ON "TelegramConnectToken"("expiresAt");

ALTER TABLE "TelegramConnectToken" ADD CONSTRAINT "TelegramConnectToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
