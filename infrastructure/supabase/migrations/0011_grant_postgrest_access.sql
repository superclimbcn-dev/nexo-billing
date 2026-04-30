-- 0011_grant_postgrest_access.sql
--
-- CONTEXT: Tables created via Prisma migrations do NOT receive automatic
-- PostgREST grants from Supabase (only tables created via the Supabase
-- dashboard get them). Without USAGE on the schema and SELECT/INSERT/UPDATE/
-- DELETE on tables, the `authenticated` role gets "permission denied" even
-- when valid RLS policies exist.
--
-- This migration:
-- 1. Grants USAGE on schema public to authenticated and anon.
-- 2. Grants table-level permissions to authenticated (RLS policies enforce row-level).
-- 3. Grants SELECT on verticals to anon (needed for onboarding before login).
-- 4. Sets DEFAULT PRIVILEGES so future Prisma-created tables also get grants.
--
-- Detected by: test script apps/web/scripts/test-rls.ts (ADR-0013).
-- Apply in: Supabase dashboard → SQL Editor → run this file.

-- ─── Schema access ────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ─── Default privileges (applies to all future tables in this schema) ─────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

-- ─── Existing tables — authenticated ──────────────────────────────────────────
-- Multi-tenant data tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items                TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.invoices             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_lines        TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.invoice_series       TO authenticated;
GRANT SELECT                         ON public.invoice_records      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_contracts  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_lines          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_lines        TO authenticated;
GRANT SELECT, INSERT                 ON public.payments             TO authenticated;
GRANT SELECT                         ON public.audit_logs           TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.branding_configs     TO authenticated;
GRANT SELECT, INSERT                 ON public.vertical_requests    TO authenticated;

-- Catalog table — readable by all authenticated users and anon (for onboarding)
GRANT SELECT ON public.verticals TO authenticated;
GRANT SELECT ON public.verticals TO anon;

-- ─── Notes ────────────────────────────────────────────────────────────────────
-- invoice_records: INSERT/UPDATE intentionally restricted to service_role only
--   (Verifactu hash chain must be written server-side, never by end users)
-- audit_logs: INSERT intentionally restricted to service_role only
--   (tamper-proof audit trail)
-- payments: no DELETE per ADR-0006 (refunds create new records, not deletions)
-- invoices: no DELETE per Verifactu immutability rules (ADR spec)
