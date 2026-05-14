-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vertical_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ud',
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_items_vertical_id_name_key" ON "catalog_items"("vertical_id", "name");

-- AddForeignKey
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_vertical_id_fkey" FOREIGN KEY ("vertical_id") REFERENCES "verticals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
