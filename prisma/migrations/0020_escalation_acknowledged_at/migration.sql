-- Push-first cost gate: record when a user taps the push notification for an
-- escalation event. An acknowledged event is not escalated to the next (paid)
-- channel (WhatsApp/SMS), saving template cost.
ALTER TABLE "EscalationEvent" ADD COLUMN "acknowledgedAt" TIMESTAMP(3);
