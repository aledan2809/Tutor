-- Atribuirea actorului pe bifele programei: cine anume a atins rândul, nu doar
-- rolul. Aditiv, nullable — rândurile existente rămân fără actor (istorie
-- pre-audit, onest necunoscută).
ALTER TABLE "CurriculumCheck" ADD COLUMN "markedById" TEXT;
