---
description: Ejecuta la checklist de cumplimiento Verifactu/SIF del proyecto
---

# Verificación de cumplimiento SIF

Ejecuta una auditoría técnica del módulo `packages/core-billing/verifactu` y genera un reporte en consola.

## Tareas

1. **Leer** `packages/core-billing/verifactu/CLAUDE.md` para conocer las reglas.

2. **Verificar cada punto** de la checklist:

   ### Arquitectura
   - [ ] `IVerifactuProvider` existe y tiene todos los métodos requeridos
   - [ ] Implementaciones: `VerifactiProvider`, `MockProvider`, (futuro: `NativeAEATProvider`)
   - [ ] Factory en `providers/factory.ts` es el único lugar que lee env vars

   ### Inalterabilidad
   - [ ] Trigger Postgres `invoice_records_immutable_fields_trigger` existe en migraciones
   - [ ] Tests que intentan `UPDATE` de campos protegidos y esperan rechazo

   ### Encadenamiento hash
   - [ ] `computeRecordHash()` implementa SHA-256 con encadenamiento correcto
   - [ ] Tests con vectores conocidos pasan
   - [ ] Test de concurrencia existe (dos emisiones simultáneas)
   - [ ] Transacción Postgres con `SERIALIZABLE` isolation level

   ### Validaciones
   - [ ] Zod schema `RegistroAltaSchema` valida todos los campos de §5 del CLAUDE.md del módulo
   - [ ] NIF validado con algoritmo (no solo regex)
   - [ ] Fechas validadas: no futuras, no anteriores a 2020

   ### QR y legal
   - [ ] Función `generateQR()` existe y produce URL AEAT correcta
   - [ ] Texto legal "VERI*FACTU" o "Factura verificable en la sede electrónica de la AEAT" se incluye

   ### Firma
   - [ ] `sign.ts` implementa firma con certificado cualificado
   - [ ] Certificado cargado desde variable segura, no hardcodeado

   ### Eventos
   - [ ] `events/logger.ts` registra: START, STOP, INCIDENT, EXPORT, BACKUP_RESTORE
   - [ ] Timestamps en UTC con zona horaria explícita

   ### Tests
   - [ ] Cobertura >= 90% en el módulo (correr `pnpm test --coverage`)
   - [ ] Todos los tests de `verifactu/` pasan

   ### Declaración responsable
   - [ ] PDF en `/apps/web/public/legal/declaracion-responsable-sif.pdf` existe
   - [ ] Ruta `/ajustes/cumplimiento` lo muestra

3. **Generar reporte** en formato Markdown con:
   - Resumen: X/Y puntos cumplidos
   - Lista de puntos que fallan con el fix sugerido
   - Prioridad: CRITICAL / HIGH / MEDIUM

4. **No hacer cambios** durante esta verificación. Solo reportar.
