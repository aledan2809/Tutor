-- Second opinion on a student's complaint: an independent re-solve of the question that never sees
-- the first verdict or the student's comment. Additive only: three nullable columns.
ALTER TABLE "QuestionFeedback" ADD COLUMN IF NOT EXISTS "secondOpinion" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN IF NOT EXISTS "secondOpinionNote" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN IF NOT EXISTS "secondOpinionAt" TIMESTAMP(3);
