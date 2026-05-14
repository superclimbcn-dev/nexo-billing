-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "gocardless_customer_id" TEXT,
ADD COLUMN     "gocardless_mandate_id" TEXT,
ADD COLUMN     "gocardless_subscription_id" TEXT,
ADD COLUMN     "subscription_expires_at" TIMESTAMP(3),
ADD COLUMN     "subscription_status" TEXT;
