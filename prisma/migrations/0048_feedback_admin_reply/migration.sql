-- Verdictul omului asupra reclamatiei elevului + raspunsul scris catre el.
-- Aditive si nullable: randurile existente raman valide.
ALTER TABLE "QuestionFeedback" ADD COLUMN IF NOT EXISTS "adminVerdict" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN IF NOT EXISTS "adminReply" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN IF NOT EXISTS "adminRepliedAt" TIMESTAMP(3);
