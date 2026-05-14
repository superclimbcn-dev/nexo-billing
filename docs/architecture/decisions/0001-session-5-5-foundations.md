# ADR-0001: Session 5.5 Phase 1 — Schema Foundations

**Date:** 2026-04-28
**Status:** Implemented (Phase 1 of 6)
**Branch:** develop
**Migration:** infrastructure/prisma/prisma/migrations/20260428000000_session_5_5_foundations/

## Context

Schema Prisma reemplazado completo según `docs/architecture/ARCHITECTURE_DESIGN.md` Sección 3.
Migración fresh aplicada en BD DEV (Supabase project: ooozdnqgiylqluktgpmc).

## Decision

Implementados en una sola migración fresh:

### Modelos nuevos
- Vertical, VerticalRequest
- BrandingConfig
- InvoiceSeries
- Item (reemplaza Product)
- Quote, QuoteLine
- Supplier
- Expense, ExpenseLine
- Payment
- AuditLog

### Modelos ampliados
- Tenant (legalName, cnae, businessType, verticalId, country, currency, vatRegime, fiscalYearStart)
- Client (clientType, vatRegime, legalName, contactPerson, city, postalCode, province, country, paymentTerms, defaultVatRate, isActive)
- Invoice (seriesId, fullNumber, type→enum, status→enum, subtotal, vatAmount, totalAmount, paidAmount, pendingAmount, currency, fromQuoteId, internalNotes, paymentTerms, paymentMethod, rectificationReason)
- InvoiceLine (itemId reemplaza productId, discountPercent, claveOperacion, subtotal, vatAmount, totalAmount)
- InvoiceRecord (qrUrl)
- User (avatarUrl)
- Invitation (invitedBy)
- RecurringContract (vatRate, startDate, endDate)

### Modelos eliminados
- Product → reemplazado por Item

### Enums nuevos
- VerticalStatus, ItemType, InvoiceStatus, InvoiceType, QuoteStatus
- ExpenseStatus, PaymentMethod, PaymentDirection, AuditAction, ClientType, VatRegime

## Consequences

✅ **Cimientos completos** para Verifactu, Quote, Expenses, Branding, Audit
✅ **prisma generate** exitoso — cliente regenerado
✅ **migrate status** → Database schema is up to date
⚠️ **Código actual no compila** (3 errores typecheck esperados) → Fase 3 los arregla
⚠️ **RLS policies para nuevos modelos pendientes** (Fase 2)
⚠️ **Seeds de Vertical pendientes** (Fase 2)
⚠️ **Server Actions pendientes de actualizar** (Fase 3)
⚠️ **Paquete core-utils pendiente** (Fase 4)

## Validation

- [x] BD DEV reseteada y migración SQL aplicada (prisma db execute)
- [x] Las 4 migraciones registradas en _prisma_migrations (prisma migrate resolve)
- [x] `prisma migrate status` → Database schema is up to date
- [x] `prisma generate` exitoso
- [ ] typecheck limpio (correcciones en Fase 3)
- [ ] RLS aplicada (Fase 2)
- [ ] Seeds de verticales (Fase 2)
- [ ] Tests multi-tenant (Fase 5)

## Notes

- `prisma migrate dev` requiere TTY interactivo — incompatible con el entorno Claude Code.
  Workaround usado: `prisma migrate diff --script` → `prisma db execute` → `prisma migrate resolve --applied`.
  En futuras sesiones usar directamente este workflow o ejecutar `migrate dev` desde terminal de VS Code.
- Las 3 migraciones previas necesitaron `resolve --applied` manual porque `migrate reset` en Supabase
  no registra correctamente en `_prisma_migrations` cuando se ejecuta sin TTY.

## References

- `docs/architecture/ARCHITECTURE_DESIGN.md` — fuente de verdad del schema
- ADRs 001-008 documentados en sección 2 del documento de diseño
- ADR-009 (Localización con Intl + paquete core-utils) — añadido post-Fase 1, implementación en Fase 4
