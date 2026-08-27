-- AlterTable
ALTER TABLE "expenses"
ADD COLUMN "vat_deductible_percent" DECIMAL(5,2),
ADD COLUMN "irpf_deductible_percent" DECIMAL(5,2);

-- Keep legacy expenses undefined and reject percentages outside the valid range.
ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_vat_deductible_percent_check"
CHECK ("vat_deductible_percent" IS NULL OR "vat_deductible_percent" BETWEEN 0 AND 100),
ADD CONSTRAINT "expenses_irpf_deductible_percent_check"
CHECK ("irpf_deductible_percent" IS NULL OR "irpf_deductible_percent" BETWEEN 0 AND 100);
