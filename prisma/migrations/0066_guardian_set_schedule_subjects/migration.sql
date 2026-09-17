-- Părintele are ultimul cuvânt la orele și materiile copilului (decizie Alex 16.09.2026).
-- Cine a stabilit un reminder sau a adăugat/scos o materie. NULL = copilul însuși → tot ce există azi
-- rămâne al copilului și poate fi schimbat de el ca până acum. Fără cheie străină: blocarea ține doar
-- cât timp adultul e încă părinte activ al copilului, iar asta se verifică la citire.
ALTER TABLE "StudyReminder" ADD COLUMN "setById" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN "setById" TEXT;
