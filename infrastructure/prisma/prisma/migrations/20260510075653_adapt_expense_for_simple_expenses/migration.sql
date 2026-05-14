/*
  Warnings:

  - The `category` column on the `expenses` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ALIMENTACION', 'TRANSPORTE', 'MATERIAL', 'SERVICIOS', 'OTROS');

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_supplier_id_fkey";

-- DropIndex
DROP INDEX "expenses_tenant_id_supplier_id_external_number_key";

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "vendor" TEXT,
ALTER COLUMN "supplier_id" DROP NOT NULL,
ALTER COLUMN "external_number" DROP NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "ExpenseCategory";

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;

-- CreateIndex
CREATE INDEX "expenses_tenant_id_issued_at_idx" ON "expenses"("tenant_id", "issued_at");

-- CreateIndex
CREATE INDEX "expenses_tenant_id_category_idx" ON "expenses"("tenant_id", "category");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
