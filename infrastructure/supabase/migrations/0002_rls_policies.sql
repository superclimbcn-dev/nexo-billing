-- RLS policies: each tenant can only see their own rows
-- The JWT must include a "tenant_id" claim (set in Supabase Auth hooks)

-- tenants: a user can only see the tenant they belong to
DROP POLICY IF EXISTS "tenants_select" ON tenants;
CREATE POLICY "tenants_select" ON tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "tenants_update" ON tenants;
CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE USING (
    id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- users: members of the same tenant
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- clients
DROP POLICY IF EXISTS "clients_all" ON clients;
CREATE POLICY "clients_all" ON clients
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- products
DROP POLICY IF EXISTS "products_all" ON products;
CREATE POLICY "products_all" ON products
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- invoices
DROP POLICY IF EXISTS "invoices_all" ON invoices;
CREATE POLICY "invoices_all" ON invoices
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- invoice_lines: inherited via invoice join; no direct tenant_id, use invoice ownership
DROP POLICY IF EXISTS "invoice_lines_all" ON invoice_lines;
CREATE POLICY "invoice_lines_all" ON invoice_lines
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_lines.invoice_id
        AND invoices.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_lines.invoice_id
        AND invoices.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- invoice_records
DROP POLICY IF EXISTS "invoice_records_select" ON invoice_records;
CREATE POLICY "invoice_records_select" ON invoice_records
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Only service role can insert/update invoice_records (done via admin client)
DROP POLICY IF EXISTS "invoice_records_insert" ON invoice_records;
CREATE POLICY "invoice_records_insert" ON invoice_records
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- recurring_contracts
DROP POLICY IF EXISTS "recurring_contracts_all" ON recurring_contracts;
CREATE POLICY "recurring_contracts_all" ON recurring_contracts
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
