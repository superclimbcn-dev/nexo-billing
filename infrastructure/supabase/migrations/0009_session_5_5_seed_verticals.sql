-- ════════════════════════════════════════════════════════════════════════════
-- 0009 — Seed inicial de Verticales (v2 — fixed timestamps)
-- ════════════════════════════════════════════════════════════════════════════
-- 6 verticales seed según ADR-002.
-- Idempotente vía ON CONFLICT (slug) DO UPDATE.
--
-- IMPORTANTE: nombres de columna deben coincidir EXACTAMENTE con schema.prisma
--
-- NOTA TÉCNICA sobre timestamps:
-- - created_at tiene @default(now()) en Prisma → genera DEFAULT en Postgres
-- - updated_at tiene @updatedAt en Prisma → NO genera DEFAULT en Postgres
--   (Prisma lo gestiona desde el cliente TS, no a nivel BD)
-- Por eso ambos se incluyen explícitamente con NOW() para SQL puro.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.verticals (
  slug,
  name,
  description,
  status,
  modules_enabled,
  cnae_mapping,
  icon_name,
  color,
  sort_order,
  created_at,
  updated_at
) VALUES
  -- GENÉRICO — escape hatch
  (
    'generic',
    'Genérico',
    'Configuración estándar para cualquier negocio. Núcleo de facturación completo.',
    'active'::"VerticalStatus",
    ARRAY[]::text[],
    ARRAY[]::text[],
    '📦',
    '#71717a',
    99,
    NOW(),
    NOW()
  ),

  -- LIMPIEZA
  (
    'cleaning',
    'Limpieza y mantenimiento',
    'Contratos recurrentes, partes de operario, planificación de turnos, rutas.',
    'active'::"VerticalStatus",
    ARRAY['recurring_contracts', 'service_sheets', 'route_planning']::text[],
    ARRAY['8121', '8122', '8129', '8130']::text[],
    '🧽',
    '#4ade80',
    1,
    NOW(),
    NOW()
  ),

  -- SERVICIOS PROFESIONALES
  (
    'services_pro',
    'Servicios profesionales',
    'Consultoría, asesoría, agencias, autónomos. Horas facturables, minutas.',
    'active'::"VerticalStatus",
    ARRAY['hourly_billing', 'project_tracking']::text[],
    ARRAY['6920', '7022', '7311', '7312', '7320', '7410', '7420']::text[],
    '⚖',
    '#3b82f6',
    2,
    NOW(),
    NOW()
  ),

  -- CONSTRUCCIÓN — beta
  (
    'construction',
    'Construcción y reformas',
    'Certificaciones de obra, partidas, subcontratas, retención de garantía.',
    'beta'::"VerticalStatus",
    ARRAY['certifications', 'bill_of_quantities', 'subcontractors']::text[],
    ARRAY['4110', '4120', '4211', '4212', '4213', '4221', '4222', '4291', '4299', '4311', '4312', '4313', '4321', '4322', '4329', '4331', '4332', '4333', '4334', '4339', '4391', '4399']::text[],
    '🔨',
    '#f59e0b',
    3,
    NOW(),
    NOW()
  ),

  -- MÉDICOS — coming soon
  (
    'medical',
    'Salud y bienestar',
    'Exención IVA art. 20, RGPD reforzado, gestión de pacientes y citas.',
    'coming_soon'::"VerticalStatus",
    ARRAY['vat_exemption', 'patient_records', 'appointments']::text[],
    ARRAY['8610', '8621', '8622', '8623', '8690']::text[],
    '⚕',
    '#ec4899',
    4,
    NOW(),
    NOW()
  ),

  -- RETAIL — coming soon
  (
    'retail',
    'Comercio y retail',
    'TPV, tickets, facturas simplificadas, control de inventario.',
    'coming_soon'::"VerticalStatus",
    ARRAY['pos', 'simplified_invoices', 'inventory']::text[],
    ARRAY['4711', '4719', '4721', '4722', '4729', '4730', '4741', '4742', '4743', '4751', '4752', '4753', '4754', '4759', '4761', '4762', '4763', '4764', '4765', '4771', '4772', '4773', '4774', '4775', '4776', '4777', '4778', '4779']::text[],
    '🛍',
    '#a855f7',
    5,
    NOW(),
    NOW()
  )

ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  description      = EXCLUDED.description,
  status           = EXCLUDED.status,
  modules_enabled  = EXCLUDED.modules_enabled,
  cnae_mapping     = EXCLUDED.cnae_mapping,
  icon_name        = EXCLUDED.icon_name,
  color            = EXCLUDED.color,
  sort_order       = EXCLUDED.sort_order,
  updated_at       = NOW();
