-- Add missing indexes identified during audit round 8 retest
-- Improves query performance on commonly filtered columns

-- Account: queries by userId (find all accounts for a user)
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- ContentSource: queries by domainId (list sources for a domain)
CREATE INDEX "ContentSource_domainId_idx" ON "ContentSource"("domainId");

-- ExamSimulation: queries by domainId (list formats for a domain)
CREATE INDEX "ExamSimulation_domainId_idx" ON "ExamSimulation"("domainId");

-- StudySession: queries by userId+domainId and by startTime for calendar views
CREATE INDEX "StudySession_userId_domainId_idx" ON "StudySession"("userId", "domainId");
CREATE INDEX "StudySession_startTime_idx" ON "StudySession"("startTime");
