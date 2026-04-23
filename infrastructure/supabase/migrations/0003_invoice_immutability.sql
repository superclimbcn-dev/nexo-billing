-- Invoice immutability trigger
-- Fiscal fields (series, number, issued_at, client_id, tenant_id) cannot be
-- modified once an invoice leaves DRAFT status.
-- Required by RD 1007/2023 (Verifactu / RRSIF).

CREATE OR REPLACE FUNCTION check_invoice_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'draft' THEN
    IF NEW.series       IS DISTINCT FROM OLD.series       OR
       NEW.number       IS DISTINCT FROM OLD.number       OR
       NEW.issued_at    IS DISTINCT FROM OLD.issued_at    OR
       NEW.client_id    IS DISTINCT FROM OLD.client_id    OR
       NEW.tenant_id    IS DISTINCT FROM OLD.tenant_id    OR
       NEW.type         IS DISTINCT FROM OLD.type
    THEN
      RAISE EXCEPTION
        'Cannot modify fiscal fields on invoice % (status: %). Use a rectification invoice (R1-R5) instead.',
        OLD.id, OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_immutability_check ON invoices;
CREATE TRIGGER invoice_immutability_check
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_immutability();
