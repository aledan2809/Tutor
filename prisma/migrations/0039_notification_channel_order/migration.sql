-- Per-user priority order of the escalation cascade channels (most-preferred first,
-- e.g. {WHATSAPP,EMAIL,TELEGRAM,PUSH}). Additive + non-null with an empty default,
-- so every existing row keeps the code default order (push -> telegram -> email ->
-- whatsapp) with zero behavioural change. On/off gating stays on the boolean columns.
ALTER TABLE "NotificationPreference" ADD COLUMN "channelOrder" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
