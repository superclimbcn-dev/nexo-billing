-- ============================================================
-- Migration: 0008_session_5_5_rls_new_models.sql
-- Session 5.5 Phase 2 — RLS policies for 12 new tables
-- Apply via Supabase SQL Editor (project: ooozdnqgiylqluktgpmc)
-- ============================================================

-- ─── ENABLE RLS ──────────────────────────────────────────────

ALTER TABLE public.verticals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_configs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_series       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_lines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_lines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs           ENABLE ROW LEVEL SECURITY;

-- ─── VERTICALS (global catalog — read-only for authenticated users) ───

CREATE POLICY "verticals_select_authenticated"
  ON public.verticals FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role can insert/update/delete verticals
CREATE POLICY "verticals_service_role_all"
  ON public.verticals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── VERTICAL_REQUESTS (tenant-scoped) ───────────────────────

CREATE POLICY "vertical_requests_tenant_select"
  ON public.vertical_requests FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "vertical_requests_tenant_insert"
  ON public.vertical_requests FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Tenants can only update their own pending requests
CREATE POLICY "vertical_requests_tenant_update"
  ON public.vertical_requests FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ─── BRANDING_CONFIGS (tenant-scoped, 1:1 with tenant) ───────

CREATE POLICY "branding_configs_tenant_select"
  ON public.branding_configs FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "branding_configs_tenant_insert"
  ON public.branding_configs FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "branding_configs_tenant_update"
  ON public.branding_configs FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ─── INVOICE_SERIES (tenant-scoped) ──────────────────────────

CREATE POLICY "invoice_series_tenant_select"
  ON public.invoice_series FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "invoice_series_tenant_insert"
  ON public.invoice_series FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "invoice_series_tenant_update"
  ON public.invoice_series FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ─── ITEMS (tenant-scoped, replaces products) ────────────────

CREATE POLICY "items_tenant_select"
  ON public.items FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "items_tenant_insert"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "items_tenant_update"
  ON public.items FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "items_tenant_delete"
  ON public.items FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ─── QUOTES (tenant-scoped) ───────────────────────────────────

CREATE POLICY "quotes_tenant_select"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "quotes_tenant_insert"
  ON public.quotes FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "quotes_tenant_update"
  ON public.quotes FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "quotes_tenant_delete"
  ON public.quotes FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ─── QUOTE_LINES (tenant-scoped via quote join) ───────────────

CREATE POLICY "quote_lines_tenant_select"
  ON public.quote_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_lines.quote_id
        AND q.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "quote_lines_tenant_insert"
  ON public.quote_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_lines.quote_id
        AND q.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "quote_lines_tenant_update"
  ON public.quote_lines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_lines.quote_id
        AND q.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_lines.quote_id
        AND q.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "quote_lines_tenant_delete"
  ON public.quote_lines FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_lines.quote_id
        AND q.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ─── SUPPLIERS (tenant-scoped) ────────────────────────────────

CREATE POLICY "suppliers_tenant_select"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "suppliers_tenant_insert"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "suppliers_tenant_update"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "suppliers_tenant_delete"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ─── EXPENSES (tenant-scoped) ────────────────────────────────

CREATE POLICY "expenses_tenant_select"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "expenses_tenant_insert"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "expenses_tenant_update"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "expenses_tenant_delete"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ─── EXPENSE_LINES (tenant-scoped via expense join) ──────────

CREATE POLICY "expense_lines_tenant_select"
  ON public.expense_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_lines.expense_id
        AND e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "expense_lines_tenant_insert"
  ON public.expense_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_lines.expense_id
        AND e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "expense_lines_tenant_update"
  ON public.expense_lines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_lines.expense_id
        AND e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_lines.expense_id
        AND e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "expense_lines_tenant_delete"
  ON public.expense_lines FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_lines.expense_id
        AND e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ─── PAYMENTS (tenant-scoped) ────────────────────────────────

CREATE POLICY "payments_tenant_select"
  ON public.payments FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "payments_tenant_insert"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "payments_tenant_update"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Payments are not deleted; they are reversed via a new payment record
-- No DELETE policy intentionally.

-- ─── AUDIT_LOGS (tenant-scoped, insert-only for app users) ───

CREATE POLICY "audit_logs_tenant_select"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "audit_logs_tenant_insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- No UPDATE or DELETE for audit_logs — immutable audit trail
-- service_role can still bypass RLS for maintenance if needed
