-- Canalul TELEGRAM exista in enum-ul EscalationChannel si in scara de escaladare din 2026-06,
-- dar nu a avut niciodata un comutator aici. Motorul cauta preferinta dupa numele canalului in
-- litere mici; lipsa coloanei intorcea `undefined`, iar `undefined` se citea ca "dezactivat" ->
-- treapta Telegram era sarita pentru TOTI utilizatorii, la fiecare declansare, tacut.
-- Aditiv, cu implicit `true`: comportamentul dorit pentru randurile existente.
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "telegram" BOOLEAN NOT NULL DEFAULT true;
