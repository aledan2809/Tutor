-- Batch B money-path: self-service subscription management + per-child add-on seats.
-- stripeSubscriptionId: the main plan's Stripe subscription id, persisted from the
--   broker callback so /api/stripe/portal can open the Customer Portal / cancel.
-- paidExtraChildSeats: child seats purchased as a discounted add-on beyond the plan
--   base (canAddChild honours base + this). Additive with a default → zero change for
--   existing users. Both read only by the billing + family-seat paths.
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "paidExtraChildSeats" INTEGER NOT NULL DEFAULT 0;
