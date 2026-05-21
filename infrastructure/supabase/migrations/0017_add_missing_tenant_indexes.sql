-- Tenant-scoped lookups that were missing dedicated indexes.
-- These keep future monitoring/admin screens from scanning across tenants.

CREATE INDEX IF NOT EXISTS vertical_requests_tenant_id_idx
  ON vertical_requests (tenant_id);

CREATE INDEX IF NOT EXISTS payments_tenant_id_idx
  ON payments (tenant_id);
