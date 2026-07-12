-- Feature 1 (Batch 3): the parent's OWN re-alert cadence while a child isn't
-- reacting. STANDARD_30 = every 30 min (the pre-feature behaviour), EVERY_H = every
-- selfAlertEveryH hours, FIXED_AT = once a day at selfAlertAt (local), ONCE = first
-- alert only. Additive + non-null with defaults, so every existing parent keeps the
-- 30-min cadence with zero behavioural change. Read only by parent monitoring.
ALTER TABLE "NotificationPreference" ADD COLUMN "selfAlertMode" TEXT NOT NULL DEFAULT 'STANDARD_30';
ALTER TABLE "NotificationPreference" ADD COLUMN "selfAlertEveryH" INTEGER NOT NULL DEFAULT 6;
ALTER TABLE "NotificationPreference" ADD COLUMN "selfAlertAt" TEXT NOT NULL DEFAULT '20:00';

-- Feature 2 (Batch 3): parent-set custom escalation cascade for THIS child — an
-- ordered list of { channel, delayMinutes } that overrides channelOrder AND the
-- window grace. Nullable — NULL means "use the simple channelOrder-based ladder",
-- so every existing row is unchanged.
ALTER TABLE "NotificationPreference" ADD COLUMN "escalationSteps" JSONB;
