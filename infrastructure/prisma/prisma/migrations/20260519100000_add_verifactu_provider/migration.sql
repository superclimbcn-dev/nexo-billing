-- Add per-tenant Verifactu provider fields
ALTER TABLE "tenants" ADD COLUMN "verifactu_provider" TEXT NOT NULL DEFAULT 'mock';
ALTER TABLE "tenants" ADD COLUMN "verifactu_nif_registered" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: tenants already ACTIVE activate the verifacti provider automatically
UPDATE "tenants"
SET "verifactu_provider" = 'verifacti', "verifactu_nif_registered" = true
WHERE "subscription_status" = 'ACTIVE';
