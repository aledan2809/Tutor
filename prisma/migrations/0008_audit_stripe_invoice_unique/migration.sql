-- AlterTable: Add unique constraint on stripeInvoiceId to prevent duplicate invoice payments (AUDIT-004)
CREATE UNIQUE INDEX "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");
