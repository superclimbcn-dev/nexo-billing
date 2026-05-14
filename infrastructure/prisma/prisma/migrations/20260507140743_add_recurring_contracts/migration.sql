/*
  Warnings:

  - You are about to drop the column `active` on the `recurring_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `recurring_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `vat_rate` on the `recurring_contracts` table. All the data in the column will be lost.
  - Added the required column `series_code` to the `recurring_contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `recurring_contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax_amount` to the `recurring_contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `recurring_contracts` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `frequency` on the `recurring_contracts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `start_date` on table `recurring_contracts` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'FINISHED');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "recurring_contract_id" UUID;

-- AlterTable
ALTER TABLE "recurring_contracts" DROP COLUMN "active",
DROP COLUMN "amount",
DROP COLUMN "vat_rate",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "series_code" TEXT NOT NULL,
ADD COLUMN     "status" "RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "tax_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "total" DECIMAL(10,2) NOT NULL,
DROP COLUMN "frequency",
ADD COLUMN     "frequency" "RecurringFrequency" NOT NULL,
ALTER COLUMN "start_date" SET NOT NULL;

-- CreateTable
CREATE TABLE "recurring_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "recurring_lines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_recurring_contract_id_fkey" FOREIGN KEY ("recurring_contract_id") REFERENCES "recurring_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_lines" ADD CONSTRAINT "recurring_lines_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "recurring_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
