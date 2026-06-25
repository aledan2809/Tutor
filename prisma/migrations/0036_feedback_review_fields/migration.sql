-- Structured decision + admin-override fields on question feedback.
ALTER TABLE "QuestionFeedback" ADD COLUMN "reviewAction" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN "reviewIssue" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN "correctedAnswer" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN "overriddenById" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN "overrideNote" TEXT;
ALTER TABLE "QuestionFeedback" ADD COLUMN "overriddenAt" TIMESTAMP(3);
