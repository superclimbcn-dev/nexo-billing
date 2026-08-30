-- Allow anonymous simplified invoices while preserving the recipient requirement
-- for complete invoices and non-simplified rectifications.
ALTER TABLE "invoices"
ALTER COLUMN "client_id" DROP NOT NULL,
ADD COLUMN "operation_at" TIMESTAMP(3);

ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_recipient_required_check"
CHECK ("type" IN ('F2', 'R5') OR "client_id" IS NOT NULL);

CREATE INDEX "invoices_tenant_id_operation_at_idx"
ON "invoices"("tenant_id", "operation_at");

-- The operation date is fiscal data and becomes immutable once the invoice
-- leaves draft status. Existing protected fields remain unchanged.
CREATE OR REPLACE FUNCTION check_invoice_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'draft' THEN
    IF NEW.series_id    IS DISTINCT FROM OLD.series_id    OR
       NEW.number       IS DISTINCT FROM OLD.number       OR
       NEW.issued_at    IS DISTINCT FROM OLD.issued_at    OR
       NEW.operation_at IS DISTINCT FROM OLD.operation_at OR
       NEW.client_id    IS DISTINCT FROM OLD.client_id    OR
       NEW.tenant_id    IS DISTINCT FROM OLD.tenant_id    OR
       NEW.type         IS DISTINCT FROM OLD.type         OR
       NEW.subtotal     IS DISTINCT FROM OLD.subtotal     OR
       NEW.vat_amount   IS DISTINCT FROM OLD.vat_amount   OR
       NEW.total_amount IS DISTINCT FROM OLD.total_amount OR
       NEW.payment_method IS DISTINCT FROM OLD.payment_method OR
       (NEW.sector_metadata #> '{simplifiedInvoice,consumerHomeService}')
         IS DISTINCT FROM
       (OLD.sector_metadata #> '{simplifiedInvoice,consumerHomeService}')
    THEN
      RAISE EXCEPTION
        'Cannot modify fiscal fields on invoice % (status: %). Use a rectification invoice (R1-R5) instead.',
        OLD.id, OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Invoice lines are fiscal data. They remain editable only while their parent
-- invoice is a draft. RLS remains unchanged and continues enforcing tenant access.
CREATE OR REPLACE FUNCTION check_invoice_line_immutability()
RETURNS TRIGGER AS $$
DECLARE
  source_invoice_id UUID;
  source_invoice_status TEXT;
  target_invoice_status TEXT;
BEGIN
  source_invoice_id := CASE WHEN TG_OP = 'INSERT' THEN NEW.invoice_id ELSE OLD.invoice_id END;

  SELECT status::text
    INTO source_invoice_status
    FROM invoices
   WHERE id = source_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot modify invoice line: invoice % does not exist.', source_invoice_id;
  END IF;

  IF source_invoice_status != 'draft' THEN
    RAISE EXCEPTION
      'Cannot modify fiscal lines of issued invoice % (status: %). Use a rectification invoice instead.',
      source_invoice_id, source_invoice_status;
  END IF;

  -- Prevent moving a line from a draft to an issued invoice as an UPDATE bypass.
  IF TG_OP = 'UPDATE' AND NEW.invoice_id IS DISTINCT FROM OLD.invoice_id THEN
    SELECT status::text
      INTO target_invoice_status
      FROM invoices
     WHERE id = NEW.invoice_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cannot move invoice line: target invoice % does not exist.', NEW.invoice_id;
    END IF;

    IF target_invoice_status != 'draft' THEN
      RAISE EXCEPTION
        'Cannot move fiscal line to issued invoice % (status: %).',
        NEW.invoice_id, target_invoice_status;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_line_immutability_check ON invoice_lines;
CREATE TRIGGER invoice_line_immutability_check
  BEFORE INSERT OR UPDATE OR DELETE ON invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_line_immutability();
