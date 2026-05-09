-- Verifactu immutability triggers
-- Once an invoice record is sent to AEAT (sent_at IS NOT NULL),
-- it can never be modified or deleted.

-- ── BEFORE UPDATE: block modification of sent records ───────────────────────
CREATE OR REPLACE FUNCTION prevent_invoice_record_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.sent_at IS NOT NULL THEN
    RAISE EXCEPTION 'Factura enviada a AEAT nao pode ser modificada';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_record_prevent_update ON invoice_records;
CREATE TRIGGER invoice_record_prevent_update
  BEFORE UPDATE ON invoice_records
  FOR EACH ROW
  EXECUTE FUNCTION prevent_invoice_record_update();

-- ── BEFORE DELETE: block deletion of any record ─────────────────────────────
CREATE OR REPLACE FUNCTION prevent_invoice_record_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Facturas nao podem ser apagadas. Use anulacao.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_record_prevent_delete ON invoice_records;
CREATE TRIGGER invoice_record_prevent_delete
  BEFORE DELETE ON invoice_records
  FOR EACH ROW
  EXECUTE FUNCTION prevent_invoice_record_delete();

-- ── BEFORE INSERT: ensure hash is present ───────────────────────────────────
CREATE OR REPLACE FUNCTION validate_invoice_record_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hash IS NULL OR NEW.hash = '' THEN
    RAISE EXCEPTION 'Hash do registo Verifactu e obrigatorio antes do insert';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_record_validate_insert ON invoice_records;
CREATE TRIGGER invoice_record_validate_insert
  BEFORE INSERT ON invoice_records
  FOR EACH ROW
  EXECUTE FUNCTION validate_invoice_record_insert();
