# ADR-0002: Session 5.5 Phase 2 — RLS Policies & Vertical Seeds

**Date:** 2026-04-29
**Status:** Implemented (Phase 2 of 6)
**Branch:** develop
**Migrations:** infrastructure/supabase/migrations/0008_session_5_5_rls_new_models.sql
              infrastructure/supabase/migrations/0009_session_5_5_seed_verticals.sql

## Context

Phase 1 creó 12 nuevas tablas sin políticas RLS ni datos de catálogo.
Phase 2 cubre:
1. RLS para las 12 tablas nuevas (mismo patrón que tablas existentes)
2. Seed de los 6 verticales iniciales en la tabla `verticals`

## Decision

### RLS — Estrategia por tipo de tabla

**Tablas tenant-scoped directas** (tienen `tenant_id` propio):
- `vertical_requests`, `branding_configs`, `invoice_series`, `items`, `quotes`, `suppliers`, `expenses`, `payments`, `audit_logs`
- Política: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`
- SELECT + INSERT + UPDATE para `authenticated`
- DELETE solo donde tiene sentido semántico (items, quotes, suppliers, expenses)
- `payments`: no DELETE (se revierten con nuevo registro — inalterabilidad)
- `audit_logs`: no UPDATE ni DELETE (trazabilidad inmutable)

**Tablas line-items** (sin `tenant_id` propio, acceso vía join):
- `quote_lines` → join a `quotes.tenant_id`
- `expense_lines` → join a `expenses.tenant_id`
- Política con subquery EXISTS para evitar columna redundante

**Tabla catálogo global** (`verticals`):
- SELECT para todos los usuarios `authenticated`
- INSERT/UPDATE/DELETE solo para `service_role` (catálogo gestionado por operador)
- Sin `tenant_id` — es un catálogo de plataforma

### Seeds — 6 verticales iniciales

| slug | nombre | estado |
|---|---|---|
| generic | Genérico | ACTIVE |
| limpieza | Limpieza | ACTIVE |
| servicios_pro | Servicios Profesionales | ACTIVE |
| construccion | Construcción | COMING_SOON |
| medicos | Médicos y Clínicas | COMING_SOON |
| retail | Comercio y Retail | COMING_SOON |

`limpieza` y `servicios_pro` son ACTIVE porque son los primeros verticales con dogfooding real (Superclim + clientes alpha). Los demás quedan en COMING_SOON hasta que se implementen sus módulos sectoriales.

Seed usa `ON CONFLICT (slug) DO NOTHING` → idempotente (se puede re-ejecutar sin error).

## Consequences

✅ **RLS completa** — las 12 tablas nuevas protegidas con el mismo patrón multi-tenant
✅ **Catálogo de verticales** poblado — onboarding puede mostrar la selección real
✅ **Idempotencia** — ambos scripts son re-ejecutables sin efectos secundarios
⚠️ **NO aplicado a BD todavía** — aplicar manualmente desde Supabase SQL Editor
⚠️ **Código aún no compila** — 3 errores typecheck pendientes (se arreglan en Fase 3)

## Validation

- [x] Archivos SQL creados y revisados
- [ ] 0008 ejecutado en Supabase DEV SQL Editor
- [ ] 0009 ejecutado en Supabase DEV SQL Editor
- [ ] Verificar: `SELECT COUNT(*) FROM public.verticals` → 6 filas
- [ ] Verificar: policies visibles en Supabase Dashboard → Authentication → Policies
- [ ] typecheck limpio (Fase 3)

## How to Apply

1. Abrir: https://supabase.com/dashboard/project/ooozdnqgiylqluktgpmc/sql/new
2. Ejecutar `0008_session_5_5_rls_new_models.sql` completo → "Success"
3. Nueva pestaña SQL → Ejecutar `0009_session_5_5_seed_verticals.sql` → "Success"
4. Verificar en Table Editor → verticals → 6 filas
5. Verificar en Authentication → Policies → las 12 tablas tienen políticas

## Notes

- `quote_lines` y `expense_lines` usan subquery EXISTS en lugar de `tenant_id` directo
  para mantener el schema normalizado (sin columna redundante en tablas de detalle).
- El campo `features` en `verticals` es `jsonb[]` — almacena los feature flags del vertical
  para que el frontend pueda renderizar módulos condicionalmente sin hardcodear la lógica.
- `payments` no tiene política DELETE por diseño: los pagos mal registrados se anulan
  creando un nuevo payment con dirección inversa (REFUND), preservando el audit trail.

## References

- ADR-0001 — Session 5.5 Phase 1 (Schema foundations)
- `docs/architecture/ARCHITECTURE_DESIGN.md` — Sección 3 (Schema), Sección 5 (RLS)
- `infrastructure/supabase/migrations/0002_rls_policies.sql` — patrón RLS existente
