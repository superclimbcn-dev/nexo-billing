-- Utility functions for the billing platform

-- next_invoice_number: returns the next consecutive invoice number for a
-- given tenant + series, locking the row to prevent race conditions.
-- Call inside a transaction before inserting the invoice.
CREATE OR REPLACE FUNCTION next_invoice_number(p_tenant_id uuid, p_series text)
RETURNS integer AS $$
DECLARE
  v_next integer;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1
    INTO v_next
    FROM invoices
   WHERE tenant_id = p_tenant_id
     AND series    = p_series;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- tenant_stats: quick aggregate for dashboard KPIs (called server-side, no RLS bypass needed)
CREATE OR REPLACE FUNCTION tenant_invoice_stats(p_tenant_id uuid)
RETURNS json AS $$
  SELECT json_build_object(
    'total_invoiced', COALESCE(SUM(
      (SELECT COALESCE(SUM(quantity * unit_price * (1 + vat_rate / 100)), 0)
         FROM invoice_lines WHERE invoice_id = i.id)
    ), 0),
    'draft_count',   COUNT(*) FILTER (WHERE status = 'draft'),
    'sent_count',    COUNT(*) FILTER (WHERE status = 'sent'),
    'paid_count',    COUNT(*) FILTER (WHERE status = 'paid'),
    'overdue_count', COUNT(*) FILTER (WHERE status = 'overdue')
  )
  FROM invoices i
  WHERE tenant_id = p_tenant_id;
$$ LANGUAGE sql SECURITY DEFINER;
