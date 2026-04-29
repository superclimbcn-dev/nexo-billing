-- CreateEnum
CREATE TYPE "VerticalStatus" AS ENUM ('active', 'beta', 'coming_soon', 'deprecated');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('product', 'service', 'subscription', 'kit', 'digital');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'rectified');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('F1', 'F2', 'R1', 'R2', 'R3', 'R4', 'R5');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'paid', 'partially_paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'bank_transfer', 'card', 'bizum', 'direct_debit', 'cheque', 'other');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('TENANT_CREATED', 'TENANT_UPDATED', 'TENANT_BRANDING_UPDATED', 'TENANT_VERTICAL_CHANGED', 'USER_INVITED', 'USER_JOINED', 'USER_REMOVED', 'USER_ROLE_CHANGED', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_SENT', 'INVOICE_VERIFACTU_SUBMITTED', 'INVOICE_CANCELLED', 'INVOICE_RECTIFIED', 'INVOICE_PAID', 'QUOTE_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'QUOTE_CONVERTED', 'EXPENSE_CREATED', 'EXPENSE_PAID', 'LOGIN_SUCCESS', 'LOGIN_FAILED');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('individual', 'business', 'freelancer', 'public_entity');

-- CreateEnum
CREATE TYPE "VatRegime" AS ENUM ('general', 'simplified', 'recargo_equivalencia', 'exempt', 'reverse_charge', 'intra_eu', 'export');

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "invoice_lines" DROP CONSTRAINT "invoice_lines_product_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_contracts" DROP CONSTRAINT "recurring_contracts_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey";

-- DropIndex
DROP INDEX "invoices_tenant_id_series_number_key";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "city" TEXT,
ADD COLUMN     "client_type" "ClientType" NOT NULL DEFAULT 'business',
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'ES',
ADD COLUMN     "default_vat_rate" DECIMAL(5,2),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "legal_name" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payment_terms" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "vat_regime" "VatRegime" NOT NULL DEFAULT 'general';

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "invited_by" UUID,
ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "invoice_lines" DROP COLUMN "product_id",
ADD COLUMN     "clave_operacion" TEXT NOT NULL DEFAULT '01',
ADD COLUMN     "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "item_id" UUID,
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "vat_amount" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "invoice_records" ADD COLUMN     "qr_url" TEXT;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "series",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "from_quote_id" UUID,
ADD COLUMN     "full_number" TEXT NOT NULL,
ADD COLUMN     "internal_notes" TEXT,
ADD COLUMN     "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "payment_terms" INTEGER,
ADD COLUMN     "pending_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rectification_reason" TEXT,
ADD COLUMN     "series_id" UUID NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
DROP COLUMN "type",
ADD COLUMN     "type" "InvoiceType" NOT NULL DEFAULT 'F1';

-- AlterTable
ALTER TABLE "recurring_contracts" ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 21;

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "vertical",
ADD COLUMN     "business_type" TEXT,
ADD COLUMN     "cnae" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'ES',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "fiscal_year_start" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "legal_name" TEXT,
ADD COLUMN     "vat_regime" "VatRegime" NOT NULL DEFAULT 'general',
ADD COLUMN     "vertical_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT;

-- DropTable
DROP TABLE "products";

-- CreateTable
CREATE TABLE "branding_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "logo_url" TEXT,
    "logo_url_dark" TEXT,
    "favicon_url" TEXT,
    "logo_icon_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#d4ff3f',
    "secondary_color" TEXT NOT NULL DEFAULT '#0a0a0b',
    "accent_color" TEXT NOT NULL DEFAULT '#a3cc2c',
    "text_on_primary" TEXT NOT NULL DEFAULT '#0a0a0b',
    "font_family" TEXT NOT NULL DEFAULT 'Inter',
    "font_family_heading" TEXT,
    "invoice_template" TEXT NOT NULL DEFAULT 'minimal',
    "invoice_footer_text" TEXT,
    "invoice_show_logo" BOOLEAN NOT NULL DEFAULT true,
    "invoice_show_qr" BOOLEAN NOT NULL DEFAULT true,
    "custom_domain" TEXT,
    "hide_nexo_branding" BOOLEAN NOT NULL DEFAULT false,
    "email_sender_name" TEXT,
    "email_sender_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verticals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "VerticalStatus" NOT NULL DEFAULT 'coming_soon',
    "modules_enabled" TEXT[],
    "cnae_mapping" TEXT[],
    "icon_name" TEXT,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verticals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vertical_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "business_type_requested" TEXT NOT NULL,
    "cnae" TEXT,
    "description" TEXT,
    "email" TEXT,
    "notify_on_launch" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vertical_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "nif" TEXT NOT NULL,
    "client_type" "ClientType" NOT NULL DEFAULT 'business',
    "email" TEXT,
    "phone" TEXT,
    "contact_person" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'ES',
    "payment_terms" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "type" "ItemType" NOT NULL DEFAULT 'product',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ud',
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "barcode" TEXT,
    "stock_enabled" BOOLEAN NOT NULL DEFAULT false,
    "current_stock" DECIMAL(12,3),
    "min_stock" DECIMAL(12,3),
    "purchase_price" DECIMAL(12,2),
    "weight_kg" DECIMAL(8,3),
    "duration_min" INTEGER,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_cycle" TEXT,
    "sector_metadata" JSONB,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_series" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT,
    "suffix" TEXT,
    "number_format" TEXT NOT NULL DEFAULT '0000',
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reset_yearly" BOOLEAN NOT NULL DEFAULT true,
    "year_of_numbering" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
    "issued_at" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "terms_conditions" TEXT,
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "sector_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quote_id" UUID NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "vat_rate" DECIMAL(5,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "vat_amount" DECIMAL(12,2) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "external_number" TEXT NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'pending',
    "category" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "due_at" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pending_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "attachment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expense_id" UUID NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "vat_amount" DECIMAL(12,2) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "expense_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "method" "PaymentMethod" NOT NULL DEFAULT 'bank_transfer',
    "paid_at" TIMESTAMP(3) NOT NULL,
    "invoice_id" UUID,
    "expense_id" UUID,
    "reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branding_configs_tenant_id_key" ON "branding_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "verticals_slug_key" ON "verticals"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenant_id_nif_key" ON "suppliers"("tenant_id", "nif");

-- CreateIndex
CREATE UNIQUE INDEX "items_tenant_id_sku_key" ON "items"("tenant_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_series_tenant_id_code_key" ON "invoice_series"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_tenant_id_number_key" ON "quotes"("tenant_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_tenant_id_supplier_id_external_number_key" ON "expenses"("tenant_id", "supplier_id", "external_number");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_series_id_number_key" ON "invoices"("tenant_id", "series_id", "number");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_vertical_id_fkey" FOREIGN KEY ("vertical_id") REFERENCES "verticals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branding_configs" ADD CONSTRAINT "branding_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vertical_requests" ADD CONSTRAINT "vertical_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_series" ADD CONSTRAINT "invoice_series_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "invoice_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_from_quote_id_fkey" FOREIGN KEY ("from_quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_lines" ADD CONSTRAINT "expense_lines_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_lines" ADD CONSTRAINT "expense_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_contracts" ADD CONSTRAINT "recurring_contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
