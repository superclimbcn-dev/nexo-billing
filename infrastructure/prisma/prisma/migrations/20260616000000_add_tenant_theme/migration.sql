-- AddColumn: tenant UI theme
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'dark';
