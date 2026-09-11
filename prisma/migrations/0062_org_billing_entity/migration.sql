-- Care dintre firmele noastre emite factura unui client B2B. Implicit Fabulosos:
-- clientul instituțional cere emitent plătitor de TVA; Class RDA rămâne pe B2C.
ALTER TABLE "Organization" ADD COLUMN "billingEntity" TEXT NOT NULL DEFAULT 'fabulosos';
