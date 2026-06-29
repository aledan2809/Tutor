-- Per-event idempotency for broker subscription.renewed callbacks.
-- The Stripe Checkout Broker (v2 callback) now sends `eventId` = Stripe event.id,
-- stable across Stripe webhook + broker dispatch retries. Renewals reuse the
-- original sessionId, so without this a broker retry created a duplicate Payment.
-- Additive + nullable: zero effect on existing rows (Postgres allows many NULLs
-- under a UNIQUE constraint), no recurring subscriptions live yet.
ALTER TABLE "Payment" ADD COLUMN "stripeEventId" TEXT;
CREATE UNIQUE INDEX "Payment_stripeEventId_key" ON "Payment"("stripeEventId");
