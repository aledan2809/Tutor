-- The reminder chains run every minute and look for each child's latest sent rung of the last two
-- weeks. Without this index that is a scan of every sent rung ever, once a minute.
CREATE INDEX "EscalationEvent_status_sentAt_idx" ON "EscalationEvent"("status", "sentAt");
