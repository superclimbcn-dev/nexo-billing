-- 0012_fix_rls_original_tables.sql
--
-- ROOT CAUSE: When session 5.5 replaced the Prisma schema (fresh migration),
-- all tables were dropped and recreated. Migration 0001_enable_rls.sql
-- referenced the `products` table (now replaced by `items`), causing it to
-- fail silently. Tables listed after `products` in 0001 never received
-- ENABLE ROW LEVEL SECURITY, so their rows are readable by anyone with
-- a valid authenticated JWT regardless of tenant.
--
-- Tables affected:
--   clients, invoices, invoice_lines, invoice_records, recurring_contracts,
--   tenants, users, invitations
--
-- items is NOT affected: it was enabled in 0008_session_5_5_rls_new_models.sql
--
-- This migration:
-- 1. Enables RLS on all original tables (idempotent — safe to re-run).
-- 2. Re-applies policies for affected tables (DROP IF EXISTS first).
--
-- Detected by: apps/web/scripts/test-rls.ts (ADR-0013).
-- Apply in: Supabase Dashboard → SQL Editor → run this file.

-- ─── 1. Enable RLS on original tables ────────────────────────────────────────
-- (ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent)

ALTER TABLE public.tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_contracts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations          ENABLE ROW LEVEL SECURITY;

-- ─── 2. Re-apply policies (DROP IF EXISTS → CREATE) ──────────────────────────

-- tenants: a user can only see/update their own tenant
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
CREATE POLICY "tenants_select" ON public.tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
CREATE POLICY "tenants_update" ON public.tenants
  FOR UPDATE USING (
    id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

-- users: members of the same tenant
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- clients
DROP POLICY IF EXISTS "clients_all" ON public.clients;
CREATE POLICY "clients_all" ON public.clients
  USING   (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- invoices
DROP POLICY IF EXISTS "invoices_all" ON public.invoices;
CREATE POLICY "invoices_all" ON public.invoices
  USING   (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- invoice_lines: access via parent invoice's tenant_id (no direct tenant_id column)
DROP POLICY IF EXISTS "invoice_lines_all" ON public.invoice_lines;
CREATE POLICY "invoice_lines_all" ON public.invoice_lines
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_lines.invoice_id
        AND invoices.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_lines.invoice_id
        AND invoices.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- invoice_records: SELECT only for authenticated (INSERT/UPDATE via service_role)
DROP POLICY IF EXISTS "invoice_records_select" ON public.invoice_records;
CREATE POLICY "invoice_records_select" ON public.invoice_records
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- recurring_contracts
DROP POLICY IF EXISTS "recurring_contracts_all" ON public.recurring_contracts;
CREATE POLICY "recurring_contracts_all" ON public.recurring_contracts
  USING   (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- invitations (re-apply idempotently from 0007)
DROP POLICY IF EXISTS "invitations_select" ON public.invitations;
CREATE POLICY "invitations_select" ON public.invitations
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "invitations_delete" ON public.invitations;
CREATE POLICY "invitations_delete" ON public.invitations
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('OWNER', 'ADMIN')
  );
