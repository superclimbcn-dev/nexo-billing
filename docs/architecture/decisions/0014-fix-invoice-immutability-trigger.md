# ADR-0014: Corrección del trigger de inmutabilidad de invoices

**Date:** 2026-07-25
**Status:** Active
**Migration:** infrastructure/supabase/migrations/0003_invoice_immutability.sql
**Fix commit:** 5b21573

## Context

El trigger `invoice_immutability_check` en la tabla `invoices` impedía modificar campos fiscales (series, number, issued_at, etc.) una vez la factura dejara estado `draft`.

El trigger original referenciaba la columna `series`:

```sql
IF NEW.series IS DISTINCT FROM OLD.series OR ...
```

La columna `series` fue eliminada del modelo `Invoice` en la migración `20260428000000_session_5_5_foundations` y reemplazada por `series_id` (UUID con FK a `InvoiceSeries`). El trigger no se actualizó, por lo que todo `UPDATE` sobre `invoices` fallaba en producción con:

```
Error [PrismaClientKnownRequestError]:
Invalid `prisma.invoice.update()` invocation:
The column `new` does not exist in the current database.
```

El error se manifestaba especialmente al intentar cambiar el estado de una factura (por ejemplo, de `sent` a `paid`), ya que la acción `markInvoiceAsPaid` ejecuta `prisma.invoice.update()`.

## Decision

Actualizar el trigger para referenciar `series_id` en lugar de `series`:

```sql
IF NEW.series_id IS DISTINCT FROM OLD.series_id OR ...
```

Se editó el archivo `infrastructure/supabase/migrations/0003_invoice_immutability.sql`. El script `apply-migrations.ts` detecta el cambio de hash y re-aplica la migración automáticamente cuando se ejecuta contra la base de datos.

## Consequences

✅ Los `UPDATE` sobre `invoices` vuelven a funcionar correctamente.
✅ Se puede marcar una factura como pagada sin error.
✅ La protección de inmutabilidad fiscal sigue activa.
⚠️ Lección: cuando se renombra/elimina una columna protegida por un trigger, hay que actualizar el trigger en la misma migración o inmediatamente después.

## References

- `infrastructure/supabase/migrations/0003_invoice_immutability.sql`
- `infrastructure/prisma/prisma/migrations/20260428000000_session_5_5_foundations/`
- Commit `5b21573` — `fix(supabase): update invoice immutability trigger to use series_id`
