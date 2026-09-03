-- Ce ESTE contul, declarat la inscriere — distinct de EnrollmentRole, care e per
-- domeniu si da acces.
--
-- Pana acum un parinte nu avea nicio reprezentare: inscrierea cu o materie acorda
-- intotdeauna STUDENT, deci parintele primea meniul de elev; iar un parinte fara
-- materie n-avea niciun enrollment si cadea in onboarding-ul de elev, care apoi
-- il inscria ca elev.
--
-- Aditiv si NULL implicit: fiecare cont existent pastreaza exact comportamentul de
-- azi (dedus din enrollments) pana cand e reclasificat explicit.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountRole') THEN
    CREATE TYPE "AccountRole" AS ENUM ('STUDENT', 'PARENT', 'TUTOR');
  END IF;
END$$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountRole" "AccountRole";
