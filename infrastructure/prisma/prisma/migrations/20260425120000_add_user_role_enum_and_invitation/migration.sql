-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER', 'ACCOUNTANT');

-- Normalize existing lowercase values (owner/admin/member) to uppercase before cast
UPDATE "users" SET "role" = UPPER("role");

-- AlterTable: change role column from TEXT to UserRole enum
-- Must drop default first, alter type with USING, then set new default
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_tenant_id_email_key" ON "invitations"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
