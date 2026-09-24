-- The option the second opinion found correct, kept next to the marked one so the person deciding
-- sees both. Additive only: one nullable column.
ALTER TABLE "QuestionFeedback" ADD COLUMN IF NOT EXISTS "secondOpinionAnswer" TEXT;
