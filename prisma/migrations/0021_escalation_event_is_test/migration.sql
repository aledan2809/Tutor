-- Notification cost-metrics flag: true when the escalation recipient is a
-- synthetic (journey-audit / seed) account, per @aledan/notify-ladder
-- isTestAccount (incl. @tutor.app / @demo.tutor.app). Keeps escalation/WhatsApp
-- cost stats free of test traffic. Additive, defaulted.
ALTER TABLE "EscalationEvent" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
