-- Add TELEGRAM as a distinct escalation channel (App -> Telegram -> email -> WhatsApp cascade).
ALTER TYPE "EscalationChannel" ADD VALUE IF NOT EXISTS 'TELEGRAM' BEFORE 'WHATSAPP';
