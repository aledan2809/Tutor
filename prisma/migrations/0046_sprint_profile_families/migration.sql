-- Per-operation-family carry-over for the direct half of the calculation sprint.
-- Additive and nullable: every existing SprintProfile row keeps working, and the
-- reader treats NULL as "no per-family history yet".
ALTER TABLE "SprintProfile" ADD COLUMN IF NOT EXISTS "families" JSONB;
