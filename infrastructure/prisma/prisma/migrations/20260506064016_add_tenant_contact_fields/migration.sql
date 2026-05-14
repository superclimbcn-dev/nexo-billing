-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "email" TEXT,
ADD COLUMN     "fiscal_address" TEXT,
ADD COLUMN     "fiscal_city" TEXT,
ADD COLUMN     "fiscal_postal" TEXT,
ADD COLUMN     "fiscal_province" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website_url" TEXT;
