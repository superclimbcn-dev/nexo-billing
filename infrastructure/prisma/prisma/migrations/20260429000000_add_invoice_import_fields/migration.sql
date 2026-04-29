-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "imported" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imported_at" TIMESTAMP(3),
ADD COLUMN     "imported_from_system" TEXT;

