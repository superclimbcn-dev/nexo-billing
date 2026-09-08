BEGIN;

-- Preserve existing payment states and all fiscal amounts/deductibility fields.
ALTER TABLE "expenses"
  ADD COLUMN "paid_at" TIMESTAMP(3),
  ADD COLUMN "payment_method" "PaymentMethod";

ALTER TABLE "expenses" ALTER COLUMN "status" SET DEFAULT 'paid';

-- Prefer an actual recorded payment; otherwise retain the historic cash date.
UPDATE "expenses" AS e
SET "paid_at" = COALESCE(
  (SELECT MAX(p."paid_at") FROM "payments" p
   WHERE p."expense_id" = e."id" AND p."tenant_id" = e."tenant_id"
     AND p."direction" = 'outbound'), e."issued_at"),
  "payment_method" = (
    SELECT p."method" FROM "payments" p
    WHERE p."expense_id" = e."id" AND p."tenant_id" = e."tenant_id"
      AND p."direction" = 'outbound'
    ORDER BY p."paid_at" DESC, p."id" DESC LIMIT 1)
WHERE e."status" = 'paid';

CREATE INDEX "expenses_tenant_id_status_paid_at_idx"
  ON "expenses"("tenant_id", "status", "paid_at");

COMMIT;
