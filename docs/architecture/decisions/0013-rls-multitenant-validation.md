# ADR-0013: Validación RLS multi-tenant

**Date:** 2026-04-30
**Status:** Active
**Tests:** apps/web/scripts/test-rls.ts
**Comando:** pnpm --filter @nexo/web test:rls

## Context

Antes de pasar a producción debemos validar que las RLS policies
realmente aíslan los datos entre tenants. Si un tenant pudiera ver
o modificar datos de otro, sería violación GDPR + pérdida de
confianza del producto.

## Decision

Script automatizado que crea 2 tenants programáticamente (Prisma admin,
bypass RLS), intenta operaciones cruzadas entre ellos usando clientes
Supabase con JWTs firmados, y verifica que cada acceso ilegítimo es
rechazado o silenciado por RLS.

Ejecutar tras cualquier cambio de schema o policies que afecten
tablas multi-tenant.

## Coverage

Modelos validados (express — los 3 críticos del scope actual):

| Modelo | SELECT | SELECT-by-ID | INSERT | UPDATE | DELETE |
|--------|--------|-------------|--------|--------|--------|
| Client    | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invoice   | ✓ | ✓ | — | — | — |
| Item      | ✓ | ✓ | ✓ | — | — |

Modelos pendientes (Sesión 6 cuando entren en UI):
- Quote, QuoteLine
- Supplier
- Expense, ExpenseLine
- Payment
- InvoiceSeries

## Resultados

Pendiente de primera ejecución — requiere SUPABASE_JWT_SECRET en .env.local.

Ver README de ejecución en la sección "How to run".

## How to run

1. Añadir a `apps/web/.env.local`:
   ```
   SUPABASE_JWT_SECRET=<JWT Secret del dashboard>
   ```
   Dashboard → Settings → API → JWT Settings → JWT Secret

2. Ejecutar:
   ```bash
   pnpm --filter @nexo/web test:rls
   ```

3. Esperado: N/N checks en verde, exit 0.

## Consequences

✅ Aislamiento multi-tenant validado para los 3 modelos críticos.
✅ Evidencia reproducible de cumplimiento RLS/GDPR.
✅ Test idempotente (limpia sus datos al terminar).
✅ Exit code 1 si algún check falla → apto para CI futuro.
⚠️ Cobertura express: 4 modelos secundarios pendientes (ver Coverage).
⚠️ Requiere SUPABASE_JWT_SECRET — no commitear, solo en .env.local.

## References

- ADR-0002 — RLS policies para los 12 modelos nuevos (Session 5.5 Phase 2)
- infrastructure/supabase/migrations/0008_session_5_5_rls_new_models.sql
- apps/web/scripts/test-rls.ts
