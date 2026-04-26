-- AlterTable: add sector_metadata JSON column to tenants (nullable, no default)
ALTER TABLE "tenants" ADD COLUMN "sector_metadata" JSONB;
