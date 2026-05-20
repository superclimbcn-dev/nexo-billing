-- Performance indexes for app navigation and recurring invoice checks.
-- These are safe to run repeatedly in Supabase/Postgres.

CREATE INDEX IF NOT EXISTS invoice_records_tenant_created_at_idx
  ON invoice_records (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS invoice_records_tenant_invoice_id_idx
  ON invoice_records (tenant_id, invoice_id);

CREATE INDEX IF NOT EXISTS invoice_records_invoice_id_idx
  ON invoice_records (invoice_id);

CREATE INDEX IF NOT EXISTS recurring_contracts_tenant_status_next_billing_idx
  ON recurring_contracts (tenant_id, status, next_billing_at);

CREATE INDEX IF NOT EXISTS items_tenant_is_active_idx
  ON items (tenant_id, is_active);
