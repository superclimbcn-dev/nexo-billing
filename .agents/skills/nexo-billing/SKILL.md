---
name: nexo-billing
description: Contexto completo de Nexo Billing — arquitectura, reglas del proyecto, stack, integración Verifactu/AEAT validada en producción, errores documentados y flujo de diagnóstico. Usar en cualquier tarea relacionada con el proyecto, facturación española, AEAT, Verifacti, o cuando el usuario mencione Nexo Billing, Superclim, verticales, o cualquier módulo del monorepo.
---

# Nexo Billing — Contexto del Proyecto

## Estado Actual
- **Fase:** Beta activa (smoke test completo, PROD ready)
- **Arquitectura:** Monorepo Turborepo + pnpm workspaces
- **Branch principal:** `main` (develop → main tras smoke test)
- **Subdominio DEV:** `dev.billing.nexo-digital.app` (Vercel project `nexo-billing-dev`)
- **Subdominio PROD (próximo):** `billing.nexo-digital.app` (Vercel project `nexo-billing`)

## Estructura del Monorepo
```
nexo-billing/
├── apps/web/                    ← Next.js 15 App Router (frontend + server actions)
├── packages/
│   ├── core-billing/
│   │   ├── verifactu/           ← Integración Verifactu/AEAT
│   │   ├── pdf-generator/       ← PDFs con @react-pdf/renderer
│   │   ├── tax-calculator/      ← Cálculo IVA
│   │   └── invoice-engine/      ← Series de facturación
│   ├── core-ui/                 ← Design system propio (NO shadcn/ui)
│   ├── core-auth/               ← Supabase Auth helpers
│   └── core-types/              ← Zod schemas compartidos
├── verticals/                   ← Módulos por sector (limpieza, construcción...)
├── infrastructure/
│   ├── prisma/                  ← Schema único (schema.prisma)
│   └── supabase/migrations/     ← Migraciones SQL
├── CLAUDE.md                    ← Reglas inviolables del proyecto
├── turbo.json
└── pnpm-workspace.yaml
```

## Stack Técnico
| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 App Router |
| Lenguaje | TypeScript strict (zero `any`) |
| UI | React 19 + Tailwind CSS v4 (design system propio en `core-ui`) |
| BD | Supabase (PostgreSQL + RLS multi-tenant) |
| ORM | Prisma |
| Auth | Supabase Auth |
| Email | Resend |
| Pagos | Stripe + GoCardless (SEPA) |
| Verifactu | Verifacti API → `packages/core-billing/verifactu/` |
| PDFs | @react-pdf/renderer |
| Tests | Vitest |
| Deploy | Vercel (DEV + PROD separados) |

**Importante:** No se usa shadcn/ui, Radix, ni ninguna librería de componentes externa. Todo es handmade en `core-ui`.

## Reglas Obligatorias
1. TypeScript STRICT — sin `any`. Si es necesario, `unknown` + narrowing.
2. UI en **español** siempre. Código y comentarios en inglés.
3. Server Components por defecto — `'use client'` solo con justificación.
4. Multi-tenant: toda query filtra por `tenant_id`. RLS en todas las tablas.
5. Commits con `git push` requieren autorización explícita de Elias.
6. Nunca modificar `packages/core-billing/verifactu/` sin leer su `CLAUDE.md`.
7. No crear carpetas `utils/` o `helpers/` genéricos.

---

## Integración Verifactu / AEAT

Verifactu es el sistema de la AEAT (Agencia Estatal de Administración Tributaria) que obliga a registrar cada factura en tiempo real con un hash encadenado (SHA-256). El proveedor intermediario es **Verifacti** (`app.verifacti.com`), que gestiona la comunicación con la AEAT.

### Endpoint correcto (validado ✅)
```
POST https://api.verifacti.com/verifactu/create
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

### Payload mínimo funcional
```json
{
  "serie": "A",
  "numero": "1",
  "fecha_expedicion": "16-05-2026",
  "tipo_factura": "F1",
  "descripcion": "Factura normal",
  "nif": "A15022510",
  "nombre": "Nombre cliente",
  "lineas": [
    {
      "base_imponible": "200",
      "tipo_impositivo": "21",
      "cuota_repercutida": "42"
    }
  ],
  "importe_total": "242"
}
```

> Todos los valores numéricos van como **string**. La fecha es `DD-MM-YYYY` (no ISO 8601).

### Respuesta exitosa (estado `"Correcta"` = registrada en AEAT ✅)
```json
{
  "uuid": "1c348852-d5a5-4b53-a67f-99d901dbd405",
  "nif_emisor": "B75777847",
  "num_serie": "99d4_A2026-0009",
  "estado": "Correcta",
  "huella": "56C0A362C0773683C14AF5C2A60358A6B86870558CB045B15D23FF9D5EDD0192",
  "encadenamiento": { ... }
}
```

### Errores críticos documentados

**1. URL incorrecta**
```
❌ https://app.verifactuapi.es/api/alta-registro-facturacion  ← dominio viejo
✅ https://api.verifacti.com/verifactu/create
```

**2. Estructura de payload incorrecta**
```
❌ Destinatarios: [{ NIF, NombreRazon }]           ← estructura XML heredada
✅ nif + nombre                                     ← campos planos snake_case

❌ Sujeta.NoExenta.TipoNoExenta.DesgloseIVA...     ← 4 niveles anidados
✅ lineas: [{ base_imponible, tipo_impositivo, cuota_repercutida }]

❌ FechaExpedicionFactura (PascalCase)
✅ fecha_expedicion (snake_case)

❌ importe_total: 242    ← number
✅ importe_total: "242"  ← string (TODOS los valores numéricos van como string)
```

**3. API devuelve HTTP 200 aunque haya error**
Verifacti no usa códigos HTTP de error. Siempre responde 200. El error va en el body:
```json
{ "error": "Verifacti API error (401): Token inválido" }
```
El código DEBE comprobar el campo `error` en el body, no solo `response.ok`.

**4. API key corrompida en Vercel**
Las keys tienen caracteres especiales (`/`, `+`, `=`). Al guardar en Vercel puede truncarse o corromperse. Si hay 401 persistente: borrar y re-pegar la variable manualmente en el dashboard o vía CLI.

**5. Componente `use client` dentro de carpeta dinámica `[id]`**
Next.js 15 no registra correctamente Client Components en `[id]/_components/` (React Client Manifest error, digest 1758866866).
**Fix:** Mover siempre a la carpeta padre estática: `facturas/_components/`.

### Variables de entorno requeridas
```bash
VERIFACTU_PROVIDER=verifacti        # o "mock" para deshabilitar
VERIFACTU_API_KEY=vf_test_xxx...    # key de Verifacti (sandbox o producción)
# VERIFACTU_API_URL no hace falta — DEFAULT_BASE_URL en factory.ts ya apunta a api.verifacti.com
```

**Entornos separados:**
- DEV/Staging → Vercel `nexo-billing-dev` → team `superclimbcn-devs-projects` → API key sandbox
- PROD → Vercel `nexo-billing` → team `superclimbcn-devs-projects` → API key producción

### Puntos clave de implementación
- Importes: `String(value.toFixed(2))` — nunca pasar número directamente
- Fecha: `DD-MM-YYYY` — helper `formatDateDMY(date: Date)`
- Leer body completo antes de evaluar éxito/error (no usar `response.json()` directamente)
- Encadenamiento hash lo gestiona Verifacti automáticamente — no hay que calcularlo en el cliente
- `calificacion_operacion: "S1"` y `clave_regimen: "01"` son los valores estándar (Verifacti los añade)

### Flujo de diagnóstico (cuando algo falla)

```
1. ¿HTTP 405?
   → URL incorrecta. Verificar VERIFACTU_API_URL en Vercel.
     Debe ser https://api.verifacti.com (no app.verifactuapi.es)

2. ¿HTTP 401 / "Unauthorized"?
   → a) API key corrompida en Vercel → re-pegar manualmente
   → b) Key incorrecta → copiar del dashboard app.verifacti.com

3. ¿HTTP 200 pero error en UI?
   → Verifacti devuelve error en el body. Revisar parseo: comprobar campo `error`.

4. ¿Error 400 o payload rechazado?
   → Verificar: tipos string, fecha DD-MM-YYYY, estructura plana de lineas.

5. ¿Build falla con "Client Manifest" error?
   → Componente use client dentro de [id]/_components/. Mover a carpeta padre estática.

6. ¿Facturas anteriores en error?
   → Reenviar manualmente una a una desde su página de detalle → "Reenviar a AEAT"
```

### Dashboard de verificación
Acceder a `app.verifacti.com` para ver las facturas registradas.
- Estado `Correcta` = registrada en AEAT ✅
- Estado `Error` = revisar JSON de solicitud en el modal de "Datos completos"

---

## Comandos Útiles
```bash
pnpm install                                    # Instalar deps
pnpm dev                                        # Dev mode
pnpm build                                      # Build completo
pnpm test                                       # Tests (Vitest)
pnpm typecheck                                  # TypeScript check
pnpm --filter @nexo/prisma exec prisma generate # Regenerar Prisma client
```
