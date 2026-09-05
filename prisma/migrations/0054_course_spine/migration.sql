-- Course → CourseModule → Lesson: the ordered path a course needs.
--
-- Additive. Nothing existing changes: every current lesson gets moduleId = NULL
-- (a standalone lesson, which is what it already was), the 4.179 questions are not
-- touched, and a subject without a course behaves exactly as before.
--
-- The join between a module and its test is `CourseModule.questionTopic` matched
-- against `Question.topic` — the key the practice engine already filters on. It is
-- stored rather than derived from the module title on purpose: a match by title
-- would break silently on an edit or a stray diacritic.

CREATE TABLE IF NOT EXISTS "Course" (
  "id"          TEXT NOT NULL,
  "domainId"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CourseModule" (
  "id"            TEXT NOT NULL,
  "courseId"      TEXT NOT NULL,
  "order"         INTEGER NOT NULL,
  "title"         TEXT NOT NULL,
  "summary"       TEXT,
  "questionTopic" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "moduleId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Course_slug_key"              ON "Course"("slug");
CREATE INDEX        IF NOT EXISTS "Course_domainId_isPublished_idx" ON "Course"("domainId", "isPublished");
CREATE UNIQUE INDEX IF NOT EXISTS "CourseModule_courseId_order_key" ON "CourseModule"("courseId", "order");
CREATE INDEX        IF NOT EXISTS "CourseModule_courseId_idx"    ON "CourseModule"("courseId");
CREATE INDEX        IF NOT EXISTS "Lesson_moduleId_order_idx"    ON "Lesson"("moduleId", "order");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Course_domainId_fkey') THEN
    ALTER TABLE "Course" ADD CONSTRAINT "Course_domainId_fkey"
      FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CourseModule_courseId_fkey') THEN
    ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lesson_moduleId_fkey') THEN
    ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey"
      FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
