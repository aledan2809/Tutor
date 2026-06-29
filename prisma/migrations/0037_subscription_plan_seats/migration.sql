-- Family-plan seat composition on SubscriptionPlan.
-- Additive + nullable: zero effect on existing rows / billing. A null
-- familyPlanKey keeps the legacy name-string derivation (src/lib/family.ts);
-- a null seat column falls back to the key's canonical composition.
ALTER TABLE "SubscriptionPlan" ADD COLUMN "familyPlanKey" TEXT;
ALTER TABLE "SubscriptionPlan" ADD COLUMN "maxParents" INTEGER;
ALTER TABLE "SubscriptionPlan" ADD COLUMN "maxChildren" INTEGER;
ALTER TABLE "SubscriptionPlan" ADD COLUMN "maxTutors" INTEGER;

-- Backfill familyPlanKey for existing rows from the plan name (same precedence
-- as src/lib/family.ts resolveFamilyPlanKey: most specific name first). Only
-- touches rows where it's still NULL — idempotent. Seat columns stay NULL so
-- each plan inherits its key's canonical composition (no override).
UPDATE "SubscriptionPlan" SET "familyPlanKey" = 'FAMILY_TRIO'
  WHERE "familyPlanKey" IS NULL AND lower(name) LIKE '%family%' AND lower(name) LIKE '%trio%';
UPDATE "SubscriptionPlan" SET "familyPlanKey" = 'FAMILY_DUO'
  WHERE "familyPlanKey" IS NULL AND lower(name) LIKE '%family%' AND lower(name) LIKE '%duo%';
UPDATE "SubscriptionPlan" SET "familyPlanKey" = 'TRIO'
  WHERE "familyPlanKey" IS NULL AND lower(name) LIKE '%trio%';
UPDATE "SubscriptionPlan" SET "familyPlanKey" = 'FAMILY'
  WHERE "familyPlanKey" IS NULL AND lower(name) LIKE '%family%';
UPDATE "SubscriptionPlan" SET "familyPlanKey" = 'ELEV'
  WHERE "familyPlanKey" IS NULL AND (lower(name) LIKE '%elev%' OR lower(name) LIKE '%individual%' OR lower(name) LIKE '%student%');
