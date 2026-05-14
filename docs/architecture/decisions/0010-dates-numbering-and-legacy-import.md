# ADR-0010: Fechas, numeración legal y soporte de import histórico

**Date:** 2026-04-29
**Status:** Active
**Decided by:** Elias (founder) + arquitecto

## Context

España tiene normativa estricta sobre numeración y fechas de facturas
(Reglamento de Facturación RD 1619/2012 + normativa Verifactu).

Casos de negocio detectados:

1. **Migración desde otro sistema:** un autónomo viene de Holded con
   última factura "FAC-2026-0247". La gestoría exige continuidad numérica:
   próxima factura debe ser 0248, no 0001.

2. **Fecha de emisión retroactiva:** servicios facturados con retraso,
   cierres de mes, o emisión a petición del cliente con fecha pasada.

3. **Histórico de auditoría:** las facturas anteriores deben aparecer en
   el libro registro de Nexo Billing aunque NO se envíen a Verifactu
   (ya fueron declaradas en su momento por el sistema anterior).

## Reglas legales aplicables

### Numeración

- Debe ser **correlativa y sin huecos** dentro de cada serie.
- Cada empresa puede tener múltiples series simultáneas
  (ej: A para nacional, B para intracomunitario, R para rectificativas).
- El formato (prefijo, sufijo, padding) es libre.
- El número de inicio es libre **al crear la serie**, pero una vez
  emitida la primera factura de la serie, NO se puede retroceder.

### Fechas

- **Fecha de operación** (issuedAt en nuestro modelo): cuándo ocurrió el
  hecho económico. Editable mientras factura en `draft`.
- **Plazo legal de emisión** (Art. 11 Reglamento Facturación):
  - B2B (empresarios): hasta el día 16 del mes siguiente al de la operación.
  - B2C (particulares): en el momento del cobro o entrega.
- Una factura emitida fuera de plazo NO es nula, pero AEAT puede sancionar
  al emisor.

### Verifactu (vigente desde 1 enero 2027 sociedades, 1 julio 2027 autónomos)

- Una vez la factura se envía a AEAT (status `sent`), tiene un hash en
  cadena y es **inmutable**.
- Cualquier corrección requiere emitir factura **rectificativa** (R1-R5).
- AEAT registra timestamp del servidor en el momento de recepción.

## Decision

### 1. Numeración heredada — SOPORTADA por schema actual

El modelo `InvoiceSeries.nextNumber` permite definir el siguiente número
a emitir. Al crear/editar la serie en Settings, el OWNER puede establecer
`nextNumber = 248` para continuar desde donde dejó el sistema anterior.

**Validaciones de UI (Fase 6):**
- Una serie con facturas existentes NO puede retroceder `nextNumber`
  (impedir editar a un valor menor que el último número emitido).
- Una serie nueva (0 facturas) puede empezar en cualquier número >= 1.

### 2. Fecha editable — SOPORTADA por schema + trigger

El campo `Invoice.issuedAt` es editable. El trigger
`0003_invoice_immutability.sql` ya bloquea cambios post-envío a Verifactu.

**Validaciones de UI (Fase 6):**
- `issuedAt` es libremente editable cuando `Invoice.status = 'draft'`.
- Calcular plazo legal: `issuedAt + 1 mes natural` y comparar con `now()`.
  Si `now() > plazo legal` → mostrar warning blando (no bloqueo):
  "⚠️ Esta factura está fuera del plazo legal de emisión. Procede solo
   si tienes justificación."
- Tras envío a Verifactu (status `sent`) → campo no editable, deshabilitado en UI.

### 3. Import histórico — REQUIERE 3 CAMPOS NUEVOS

Para soportar facturas heredadas del sistema anterior se añaden:

- `imported: boolean (default false)` — true si fue importada (no emitida en Nexo).
- `importedFromSystem: string?` — origen: "Holded", "Quipu", "Excel", etc.
- `importedAt: DateTime?` — cuándo se importó (auditoría).

Comportamiento:
- Facturas con `imported = true`:
  - NO se envían a Verifactu (no se crea `InvoiceRecord`).
  - SÍ aparecen en libro registro de facturas emitidas.
  - SÍ se incluyen en reportes fiscales históricos.
  - Pueden tener cualquier número/serie/fecha (sin validación de correlatividad
    contra series activas, porque preservan la lógica del sistema antiguo).
  - El status default es `paid` (asumimos que ya fueron cobradas, salvo
    indicación contraria).

### 4. Reglas combinadas Verifactu

| Estado | issuedAt editable | número editable | enviar a Verifactu |
|--------|------------------|----------------|-------------------|
| draft | ✓ | ✗ (asignado al guardar) | ✗ |
| sent (no Verifactu) | ✗ | ✗ | manual |
| sent (Verifactu OK) | ✗ | ✗ | ya enviada |
| imported | ✗ (snapshot legacy) | ✗ | ✗ NUNCA |
| cancelled | ✗ | ✗ | requiere rectificativa |

## Consequences

✅ Producto vendible a autónomos con histórico desde día 1.
✅ Cumplimiento legal correcto sin bloquear UX.
✅ Distinción clara entre datos legacy (informativos) y datos vivos
   (sujetos a Verifactu).
⚠️ Fase 6 (UI facturas) debe implementar las validaciones de UX descritas.
⚠️ Importador (Fase 7+) debe poder bulk-insert con `imported = true`.
⚠️ Reportes fiscales (Fase 8+) deben filtrar imported vs no imported
   según contexto (libro registro = todos; envío Verifactu = solo no imported).

## Migration plan

Migración aditiva sobre Invoice — añade 3 columnas nullable:
- `imported BOOLEAN NOT NULL DEFAULT false`
- `imported_from_system TEXT NULL`
- `imported_at TIMESTAMP(3) NULL`

Sin riesgo: facturas existentes (ninguna en producción) reciben default
`imported = false`. Backwards compatible.

## References

- ARCHITECTURE_DESIGN.md (sección 3, modelo Invoice)
- ADR-004 (InvoiceSeries con counter atómico)
- ADR-005 (AuditLog para trazabilidad)
- 0003_invoice_immutability.sql (trigger bloqueo post-envío)
- RD 1619/2012 (Reglamento de Facturación)
- Real Decreto 1007/2023 (Verifactu / SIF)
