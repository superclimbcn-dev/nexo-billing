-- AlterTable: add email provider config columns to tenants
ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "email_provider" TEXT DEFAULT 'resend',
  ADD COLUMN IF NOT EXISTS "email_from" TEXT,
  ADD COLUMN IF NOT EXISTS "email_from_name" TEXT,
  ADD COLUMN IF NOT EXISTS "email_reply_to" TEXT,
  ADD COLUMN IF NOT EXISTS "email_api_key" TEXT,
  ADD COLUMN IF NOT EXISTS "smtp_host" TEXT,
  ADD COLUMN IF NOT EXISTS "smtp_port" INTEGER,
  ADD COLUMN IF NOT EXISTS "smtp_user" TEXT,
  ADD COLUMN IF NOT EXISTS "smtp_pass" TEXT,
  ADD COLUMN IF NOT EXISTS "smtp_secure" BOOLEAN DEFAULT true;
