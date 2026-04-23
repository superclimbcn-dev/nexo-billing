# packages/core-billing/verifactu — Reglas inviolables

> Este módulo es el corazón del cumplimiento legal de Nexo Billing. Un bug aquí puede suponer sanciones de 150.000€ para el fabricante (Elias / Nexo) y 50.000€ para cada cliente. **Cero tolerancia a hacks, atajos o "ya lo arreglo luego"**.

---

## 1. Responsabilidades de este módulo

1. Generar el **RegistroFacturacionAlta** XML al emitir una factura.
2. Generar el **RegistroFacturacionAnulacion** XML al anular una factura.
3. Calcular y encadenar los **hashes SHA-256** por tenant.
4. Firmar los registros con el certificado electrónico del fabricante.
5. Generar el **código QR** con URL de verificación AEAT.
6. Enviar los registros al provider configurado (Verifacti en V1, AEAT nativo en futuro).
7. Registrar **eventos del sistema** (arranque, parada, incidencias, exportaciones).
8. Detectar ruptura de cadena y detener emisión con alerta.

**Lo que NO hace este módulo**:
- No genera PDFs (eso es `packages/core-billing/pdf-generator`).
- No calcula IVA (eso es `packages/core-billing/tax-calculator`).
- No gestiona series de facturación (eso es `packages/core-billing/invoice-engine`).
- No conoce verticales. Es puramente Verifactu/AEAT.

---

## 2. Estructura del paquete

```
packages/core-billing/verifactu/
├── src/
│   ├── index.ts
│   ├── providers/
│   │   ├── interface.ts          # IVerifactuProvider — contrato público
│   │   ├── verifacti.ts          # Implementación Verifacti (V1)
│   │   ├── aeat-native.ts        # Integración directa AEAT (futuro)
│   │   └── mock.ts               # Para tests
│   ├── records/
│   │   ├── alta.ts               # Generación RegistroFacturacionAlta
│   │   ├── anulacion.ts          # Generación RegistroFacturacionAnulacion
│   │   └── schemas.ts            # Zod schemas
│   ├── crypto/
│   │   ├── hash.ts               # SHA-256 + encadenamiento
│   │   ├── sign.ts               # Firma XAdES
│   │   └── chain-validator.ts    # Validación de la cadena
│   ├── qr/
│   │   ├── generator.ts          # Generación del QR con URL AEAT
│   │   └── legal-text.ts         # Texto legal "VERI*FACTU" / "Factura verificable..."
│   ├── events/
│   │   └── logger.ts             # Registro de eventos del SIF
│   └── errors.ts                 # Errores tipados específicos de Verifactu
├── CLAUDE.md                     # Este archivo
├── package.json
└── tsconfig.json
```

---

## 3. Reglas inviolables

### 3.1 Sobre la inmutabilidad

- Una vez que `submitInvoice()` devuelve éxito, el registro **no se puede regenerar** con datos distintos. Cualquier corrección genera una factura rectificativa nueva.
- La tabla `invoice_records` tiene trigger Postgres que bloquea `UPDATE` de campos `xml_content`, `hash`, `previous_hash`, `submitted_at` tras la primera escritura.
- Jamás usar `prisma.invoiceRecord.update()` para campos protegidos. Si aparece un caso que lo necesite, es un bug de diseño: parar y replantear.

### 3.2 Sobre el encadenamiento hash

El algoritmo es:

```
hash_n = SHA256( canonical_xml_n + hash_{n-1} )
```

Donde:
- `canonical_xml_n` es el XML del registro actual, canonicalizado (C14N).
- `hash_{n-1}` es el hash del registro anterior del mismo tenant (string vacío si es el primero).

**Implementación obligatoria** en `crypto/hash.ts`:

```typescript
import { createHash } from 'node:crypto';

export function computeRecordHash(
  canonicalXml: string,
  previousHash: string | null,
): string {
  const input = canonicalXml + (previousHash ?? '');
  return createHash('sha256').update(input, 'utf8').digest('hex').toUpperCase();
}
```

### 3.3 Sobre el orden de operaciones al emitir

El orden es **estricto**:

1. Validar datos de entrada (Zod schema `RegistroAltaSchema`).
2. Obtener `previousHash` de BD para el tenant (SELECT FOR UPDATE para evitar race conditions).
3. Construir XML canonicalizado.
4. Calcular `hash` con `computeRecordHash()`.
5. Firmar el XML (XAdES).
6. Guardar en BD con estado `PENDING`.
7. Enviar al provider.
8. Actualizar estado a `ACCEPTED` o `REJECTED` según respuesta.
9. Si `REJECTED`, marcar factura como inválida y alertar.

**Cualquier desviación de este orden rompe la cadena.**

### 3.4 Sobre las transacciones

Toda la secuencia `obtener previousHash → calcular hash → guardar` debe ocurrir dentro de una **transacción Postgres** con nivel de aislamiento `SERIALIZABLE` para prevenir dos emisiones concurrentes que usen el mismo `previousHash`.

```typescript
await prisma.$transaction(async (tx) => {
  // ... lógica ...
}, { isolationLevel: 'Serializable' });
```

### 3.5 Sobre los providers

- Cualquier nuevo provider debe implementar `IVerifactuProvider` **completo**, sin métodos opcionales.
- Cualquier provider debe tener su suite de tests contra un mock del servicio externo.
- **Nunca** leer `process.env.VERIFACTU_PROVIDER` fuera de `providers/factory.ts`. La elección del provider se hace en un solo lugar.

### 3.6 Sobre los errores

Errores tipados en `errors.ts`. Prohibido lanzar `Error` genéricos. Mínimo:

- `VerifactuValidationError` — datos inválidos antes de enviar
- `VerifactuChainBrokenError` — cadena hash rota (PARADA DE EMERGENCIA)
- `VerifactuProviderError` — error del provider externo
- `VerifactuAEATRejectionError` — AEAT rechazó el registro
- `VerifactuTimeoutError` — timeout esperando respuesta

### 3.7 Sobre los tests

- Cobertura mínima: **90%**.
- Tests obligatorios:
  - Generación de hash con vectores de prueba conocidos.
  - Encadenamiento correcto en secuencia de 100+ facturas.
  - Detección de ruptura de cadena.
  - Rollback correcto ante fallo del provider.
  - Concurrencia: dos emisiones simultáneas no deben usar el mismo `previousHash`.

---

## 4. Interfaz pública del módulo

Solo se exporta desde `src/index.ts` lo siguiente:

```typescript
export type { IVerifactuProvider, VerifactuResult, VerifactuStatus } from './providers/interface';
export { createVerifactuService } from './service';
export * from './errors';
```

**Todo lo demás es privado**. Si un módulo consumidor necesita algo que no está exportado, se evalúa si añadirlo a la interfaz pública, no se hace `import` de paths internos.

---

## 5. Campos obligatorios del RegistroFacturacionAlta

Lista mínima según Orden HAC/1177/2024. El Zod schema completo está en `records/schemas.ts`. Nunca relajar estas validaciones:

- `IDEmisorFactura`: NIF del emisor, 9 caracteres, validación algorítmica.
- `NumSerieFactura`: máximo 60 caracteres, no puede contener espacios ni caracteres especiales que rompan el canonical XML.
- `FechaExpedicionFactura`: formato `dd-mm-yyyy`, no futura, no anterior a 2020.
- `TipoFactura`: `F1` (completa), `F2` (simplificada), `F3` (sustitutiva), `R1`-`R5` (rectificativas).
- `DescripcionOperacion`: 1-500 caracteres.
- `ImporteTotal`: con 2 decimales, puede ser negativo (abono).
- `Desglose`: array con tipo IVA, base imponible, cuota. Obligatorio al menos un elemento.
- `Huella`: hash calculado según §3.2.
- `FechaHoraHusoGenRegistro`: timestamp UTC con zona horaria explícita.

---

## 6. Checklist al añadir una feature a este paquete

Antes de considerar una feature "hecha":

- [ ] Tipos TypeScript estrictos, sin `any`.
- [ ] Zod schema de validación de entrada.
- [ ] Tests unitarios cubriendo happy path + al menos 3 casos de error.
- [ ] Test de concurrencia si la feature toca BD.
- [ ] Documentación JSDoc en funciones públicas.
- [ ] Si añade campo al XML: actualizado el schema XSD de referencia en `docs/`.
- [ ] Si cambia el hash: actualizados los vectores de prueba en `crypto/hash.test.ts`.
- [ ] Ejecutado `pnpm typecheck && pnpm test --coverage` y pasado.

---

## 7. Qué hacer si algo huele mal

Si durante una tarea detectas una de estas situaciones, **PARA** y consulta con Elias antes de continuar:

- Un test necesita un workaround para pasar.
- El schema Prisma pide `UPDATE` en campos protegidos.
- Aparece un caso donde el hash "no debería" validarse.
- El provider responde con un código de error no documentado.
- La cadena hash está rota en producción.

Estos son los casos donde un atajo hoy = multa de seis cifras mañana.
