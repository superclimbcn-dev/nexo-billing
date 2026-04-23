-- InvoiceRecord immutability trigger
-- The hash chain fields (hash, previous_hash, canonical_xml) are write-once.
-- Modifying them would break Verifactu chain integrity and violate RD 1007/2023.

CREATE OR REPLACE FUNCTION check_invoice_record_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hash          IS DISTINCT FROM OLD.hash         OR
     NEW.previous_hash IS DISTINCT FROM OLD.previous_hash OR
     NEW.canonical_xml IS DISTINCT FROM OLD.canonical_xml OR
     NEW.tenant_id     IS DISTINCT FROM OLD.tenant_id    OR
     NEW.invoice_id    IS DISTINCT FROM OLD.invoice_id
  THEN
    RAISE EXCEPTION
      'InvoiceRecord % is immutable: hash chain fields cannot be modified after creation.',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_record_immutability ON invoice_records;
CREATE TRIGGER invoice_record_immutability
  BEFORE UPDATE ON invoice_records
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_record_immutability();

-- Helper: get the last hash for a tenant (used when building the chain)
CREATE OR REPLACE FUNCTION get_last_invoice_hash(p_tenant_id uuid)
RETURNS text AS $$
  SELECT hash
  FROM invoice_records
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
