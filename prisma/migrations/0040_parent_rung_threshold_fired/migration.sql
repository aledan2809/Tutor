-- Parent-alert cascade rung: how many alerts this episode already sent the parent.
-- Indexes into the parent's OWN ordered channel cascade (first alert on their
-- preferred channel, each re-notify moves one rung down, stays on the last).
-- Additive, default 0 = existing open episodes simply start their cascade now.
ALTER TABLE "ParentEscalation" ADD COLUMN "parentAlertRung" INTEGER NOT NULL DEFAULT 0;

-- Threshold evaluator dedup: a breached instructor threshold fires at most once
-- per day. Nullable — existing rows have never fired.
ALTER TABLE "EscalationThreshold" ADD COLUMN "lastFiredOn" TIMESTAMP(3);
