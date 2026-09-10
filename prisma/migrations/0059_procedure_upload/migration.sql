-- Procedurile trimise de client din pagina de prezentare. Aditiv: nicio tabelă
-- existentă nu e atinsă.
CREATE TABLE "ProcedureUpload" (
    "id" TEXT NOT NULL,
    "appSlug" TEXT NOT NULL DEFAULT 'posta',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "note" TEXT,
    "files" JSONB NOT NULL,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcedureUpload_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProcedureUpload_appSlug_createdAt_idx" ON "ProcedureUpload"("appSlug", "createdAt");
