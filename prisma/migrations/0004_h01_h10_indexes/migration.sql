-- H02: Add composite index for instructor threshold lookups by domain
CREATE INDEX "EscalationThreshold_instructorId_domainId_idx" ON "EscalationThreshold"("instructorId", "domainId");

-- H02: Prevent duplicate thresholds for same instructor+student+domain+metric
CREATE UNIQUE INDEX "EscalationThreshold_instructorId_studentId_domainId_metric_key" ON "EscalationThreshold"("instructorId", "studentId", "domainId", "metric");

-- H01: Add index for recipient validation queries on Enrollment (roles + isActive)
CREATE INDEX "Enrollment_userId_isActive_idx" ON "Enrollment"("userId", "isActive");

-- H01/H10: Add index for InstructorMessage domain lookups
CREATE INDEX "InstructorMessage_senderId_domainId_idx" ON "InstructorMessage"("senderId", "domainId");
