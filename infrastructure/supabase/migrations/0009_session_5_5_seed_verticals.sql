-- ============================================================
-- Migration: 0009_session_5_5_seed_verticals.sql
-- Session 5.5 Phase 2 — Seed the 6 initial Vertical catalog rows
-- Apply via Supabase SQL Editor (project: ooozdnqgiylqluktgpmc)
-- ============================================================
-- These are global catalog rows (no tenant_id). RLS on verticals
-- allows SELECT for all authenticated users and ALL for service_role.
-- Use INSERT ... ON CONFLICT DO NOTHING for idempotency.
-- ============================================================

INSERT INTO public.verticals (id, slug, name, description, icon, features, status, "createdAt", "updatedAt")
VALUES
  (
    gen_random_uuid(),
    'generic',
    'Genérico',
    'Vertical base para cualquier tipo de negocio. Incluye facturación estándar Verifactu sin módulos sectoriales.',
    'briefcase',
    '["invoicing","clients","items","quotes","expenses","payments"]'::jsonb,
    'ACTIVE',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'limpieza',
    'Limpieza',
    'Especializado para empresas y autónomos de servicios de limpieza. Incluye contratos recurrentes, planificación de servicios y gestión de equipos.',
    'sparkles',
    '["invoicing","clients","items","quotes","expenses","payments","recurring_contracts","service_scheduling","team_management"]'::jsonb,
    'ACTIVE',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'servicios_pro',
    'Servicios Profesionales',
    'Para consultores, abogados, arquitectos y otros profesionales independientes. Incluye gestión por proyectos y seguimiento de horas.',
    'user-tie',
    '["invoicing","clients","items","quotes","expenses","payments","project_tracking","time_tracking"]'::jsonb,
    'ACTIVE',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'construccion',
    'Construcción',
    'Para constructoras, reformistas y empresas del sector CNAE 41-43. Incluye gestión de obra, certificaciones y control de materiales.',
    'hard-hat',
    '["invoicing","clients","items","quotes","expenses","payments","project_tracking","certifications","material_tracking"]'::jsonb,
    'COMING_SOON',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'medicos',
    'Médicos y Clínicas',
    'Para profesionales sanitarios y clínicas privadas. Incluye gestión de pacientes, actos médicos y facturación a aseguradoras.',
    'stethoscope',
    '["invoicing","clients","items","quotes","expenses","payments","patient_management","insurance_billing"]'::jsonb,
    'COMING_SOON',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'retail',
    'Comercio y Retail',
    'Para comercios minoristas y tiendas. Incluye gestión de inventario, punto de venta y facturación simplificada (tickets).',
    'shopping-bag',
    '["invoicing","clients","items","expenses","payments","inventory","pos","simplified_invoicing"]'::jsonb,
    'COMING_SOON',
    now(),
    now()
  )
ON CONFLICT (slug) DO NOTHING;
