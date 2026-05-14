# ADR-0003: Política de internacionalización (i18n)

**Date:** 2026-04-29
**Status:** Active — aplica a TODO el proyecto desde ahora
**Decided by:** Elias (arquitecto/founder)

## Context

El proyecto tenía mezcla de idiomas (slugs en español, código en inglés, carpetas
mezcladas). Necesitamos una regla clara y retroactiva para evitar inconsistencias
y preparar futura expansión a Portugal/Francia.

## Decision

Separación estricta entre capa técnica e interfaz de usuario:

| Capa                                              | Idioma   |
|---------------------------------------------------|----------|
| Código (variables, funciones, types, interfaces)  | INGLÉS   |
| BD (tablas, columnas, enums)                      | INGLÉS   |
| Slugs técnicos (verticals, modules, role keys)    | INGLÉS   |
| Nombres de carpetas/archivos                      | INGLÉS   |
| UI (botones, menús, labels, placeholders)         | ESPAÑOL  |
| Mensajes al usuario (errores, toasts, success)    | ESPAÑOL  |
| Emails (asunto, cuerpo)                           | ESPAÑOL  |
| Documentación técnica (ADRs, READMEs)             | ESPAÑOL o INGLÉS |
| Documentación al usuario (help, tooltips)         | ESPAÑOL  |

### Casos especiales

- **Términos legales fiscales** (NIF, IVA, Verifactu, AEAT, CNAE): se mantienen
  en español/oficiales aunque aparezcan en código. Son nombres propios.
- **Roles de usuario** (OWNER, ADMIN, MEMBER, VIEWER, ACCOUNTANT): UPPERCASE en
  inglés (estándar Supabase / RBAC).
- **Tipos enum técnicos** (InvoiceStatus, ItemType): inglés siempre.
- **Códigos legales españoles** (F1, F2, R1...R5 para tipos de factura): se
  mantienen tal cual están en la normativa AEAT.

## Consequences

✅ Coherencia retroactiva — cualquier dev (presente o futuro) entiende el código
✅ Preparado para PT/FR/IT futuro — solo cambia capa UI vía i18n
✅ Compatible con herramientas estándar (linters, formatters, traducción)
⚠️ Migración necesaria: slugs de verticales (Phase 2 SQL no aplicado todavía)
⚠️ Migración necesaria: carpetas verticals/* mezcladas

## Migration tracking

- [ ] Slugs verticals: `limpieza` → `cleaning`, `construccion` → `construction`,
      `medicos` → `medical`, `servicios_pro` → `services_pro` (este queda igual,
      es palabra compuesta sin equivalente directo + "_pro" estándar)
- [ ] Carpetas: `verticals/limpieza/` → `verticals/cleaning/`, etc.
- [ ] Verificación post-migración: grep -r "limpieza\|construccion\|medicos"
      en todo el código TypeScript, debe devolver vacío.

## References

- ARCHITECTURE_DESIGN.md (sección 2 ADRs)
- ADR-002 (Verticales y CNAE)
