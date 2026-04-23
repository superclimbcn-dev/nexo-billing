# Nexo Billing — Instrucciones para Claude Code

> Este archivo se lee automáticamente al inicio de cada sesión. Contiene las reglas inviolables del proyecto. Si algo aquí entra en conflicto con instrucciones puntuales del usuario, pregunta antes de romper estas reglas.

---

## 1. Qué es este proyecto

**Nexo Billing** es una suite SaaS de facturación multi-tenant para autónomos y pymes en España, adaptada al sistema **Verifactu** (RD 1007/2023, Orden HAC/1177/2024) y a la **factura electrónica B2B** (Ley Crea y Crece, RD 238/2026).

**Fechas obligatorias en el mercado**:
- 1 enero 2027: obligatorio para sociedades
- 1 julio 2027: obligatorio para autónomos
- Factura electrónica B2B: Jul 2027 (empresas >8M€), Jul 2028 (resto)

**Objetivo de producto**: plataforma única, multi-tenant, con un **core compartido** (motor de facturación Verifactu-compliant) y **verticales especializados** (limpieza, construcción, médicos, etc.) que reutilizan el core sin duplicar código.

**Propietario del proyecto**: Elias — también operador de Superclim Servicios (Barcelona). El primer vertical es **limpieza** porque se hace dogfooding con Superclim como cliente alpha real.

---

## 2. Stack obligatorio — NO cambiar sin consultar

| Capa | Tecnología | Razón |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, server actions, familiar al owner |
| Lenguaje | TypeScript (strict) | Zero `any` salvo justificación explícita |
| UI | React 19 + Tailwind CSS | Design system propio construido a mano en `packages/core-ui` (ver sección 2.1) |
| BD | Supabase (Postgres) | Auth + Storage + RLS multi-tenant nativo |
| ORM | Prisma | Schema único en `infrastructure/prisma` |
| Validación | Zod | Schemas compartidos en `packages/core-types` |
| Pagos | Stripe + GoCardless (SEPA) | Stripe para cards, GoCardless para domiciliación española |
| Verifactu | Provider pattern (ver sección 4) | Abstracción desde día 1 |
| Monorepo | Turborepo + pnpm workspaces | Definido en `turbo.json` y `pnpm-workspace.yaml` |
| Deploy | Vercel (frontend) + Supabase (BD) | Hetzner para workers pesados (ya existe infra) |
| PDFs | `@react-pdf/renderer` | Consistencia entre preview y export |

**Idioma del código**: inglés para código, nombres de variables, funciones, tipos.
**Idioma del usuario final (UI, mensajes, errores)**: **español (es)** siempre. Sin excepciones.
**Idioma de comentarios en código**: inglés (para mantenibilidad internacional futura).

### 2.1 Design system — `packages/core-ui`

**No usar ninguna librería de componentes externa** (shadcn/ui, Radix, HeadlessUI, Material, Chakra, etc.). Todo componente de UI se construye a mano en `packages/core-ui` con Tailwind CSS. Esto es lo que da la identidad visual diferenciada del producto.

Reglas del design system:
- **Tailwind CSS v4** (CSS-first, sin `tailwind.config.js`). CSS variables declaradas en `globals.css`.
- **CSS variables exactas**: `--bg`, `--surface`, `--surface-raised`, `--surface-hover`, `--border`, `--border-strong`, `--text`, `--text-dim`, `--text-subtle`, `--accent`, `--accent-dim`, `--accent-glow`, `--success`, `--warning`, `--danger`.
- **Fuentes** vía `next/font/google`: Geist (`--font-sans`), Geist Mono (`--font-mono`), Instrument Serif (`--font-serif`).
- **Clases Tailwind** con valores arbitrarios referenciando las CSS variables: `bg-[var(--surface)]`, `text-[var(--text)]`, `[font-family:var(--font-serif)]`, etc.
- **Server Components** por defecto. `'use client'` solo cuando hay interactividad real.
- Helper `cn()` (clsx + tailwind-merge) en `packages/core-ui/src/primitives/cn.ts`.
- Barrel export público en `packages/core-ui/src/index.ts`. Orden alfabético por categoría.

Estructura de `packages/core-ui/src/`:
```
tokens/           # colors.ts, typography.ts
primitives/       # cn.ts, button.tsx, form-input.tsx
layout/           # app-shell, sidebar, nav-item, nav-section-label, tenant-selector, compliance-badge, top-bar
data-display/     # panel, kpi-card, invoice-row, client-avatar, status-chip, verifactu-chip
invoice/          # line-item-row, line-items-table, invoice-totals, invoice-pdf-preview
mobile/           # phone-frame, phone-service-item, phone-action-card
onboarding/       # vertical-card, progress-dots
marketing/        # whatsapp-promo-card
```

---

## 3. Arquitectura: principios inviolables

### 3.1 Separación core vs vertical

- `packages/core-billing/*` **nunca** importa nada de `verticals/*`.
- `verticals/*` importa del core, nunca al revés.
- Si un vertical necesita algo del core que no existe, se añade al core de forma genérica, no se forkea.
- Los verticales extienden datos vía campo `sectorMetadata: Json` en el esquema Prisma, no añadiendo columnas.

### 3.2 Multi-tenant con RLS

- **Cada tabla** con datos de usuario tiene columna `tenant_id uuid NOT NULL`.
- **Cada tabla** tiene política RLS: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`.
- **Nunca** hacer queries sin filtrar por `tenant_id`, incluso cuando RLS lo cubra (defensa en profundidad).
- Migraciones SQL en `infrastructure/supabase/migrations/`.

### 3.3 Feature flags por vertical

Cada tenant tiene `vertical: 'limpieza' | 'construccion' | 'medicos' | 'servicios_pro' | 'retail' | 'generic'`. El frontend renderiza módulos condicionalmente según este valor. Nunca hacer `if (user.email.includes('superclim'))` u otros hacks de identificación.

### 3.4 Server-first

Usar **Server Components** y **Server Actions** por defecto. Solo convertir a Client Component cuando haya interactividad que lo exija (`'use client'` con justificación).

---

## 4. Verifactu: reglas técnicas CRÍTICAS

Estas reglas existen porque el incumplimiento supone multas de hasta 150.000€ para el fabricante (nosotros) y 50.000€ para el usuario. **Son inviolables**.

### 4.1 Provider pattern obligatorio

Toda interacción con Verifactu/AEAT pasa por la interfaz `IVerifactuProvider` definida en `packages/core-billing/verifactu/providers/interface.ts`. Nunca hacer llamadas directas a AEAT o a Verifacti desde código de negocio.

Implementaciones:
- `VerifactiProvider` — API intermediaria Verifacti (inicial, en producción)
- `NativeAEATProvider` — integración directa AEAT (futuro, cuando escalemos)
- `MockProvider` — para tests, devuelve respuestas determinísticas

### 4.2 Inalterabilidad

- **Las facturas emitidas NO se modifican NUNCA**. Correcciones se hacen mediante facturas rectificativas (tipo R1-R5).
- **Las facturas emitidas NO se borran NUNCA**. Para anular se genera `RegistroFacturacionAnulacion`.
- En Prisma, las tablas `Invoice` y `InvoiceRecord` tienen triggers que bloquean `UPDATE` en campos sensibles tras el primer envío a AEAT.

### 4.3 Encadenamiento hash

Cada registro incluye:
- `hash` (SHA-256 del propio registro)
- `previousHash` (hash del registro anterior del mismo `tenant_id`)

La cadena es **por tenant**. Si se rompe, se detiene la emisión y se alerta al operador.

### 4.4 Campos obligatorios en cada factura emitida

Verificables en `packages/core-billing/verifactu/CLAUDE.md`:
- Serie y número consecutivo
- Fecha de expedición
- NIF y razón social emisor + receptor
- Descripción, base imponible, tipo IVA, cuota IVA
- Huella hash + QR (URL sede AEAT) + texto legal

### 4.5 Declaración Responsable

El archivo `/apps/web/public/legal/declaracion-responsable-sif.pdf` debe estar accesible desde la UI en `/ajustes/cumplimiento`. Nunca borrar ni ocultar este enlace.

---

## 5. Convenciones de código

### 5.1 Nomenclatura

- **Archivos**: `kebab-case.ts` (ej: `invoice-service.ts`)
- **Componentes React**: `PascalCase.tsx` (ej: `InvoiceForm.tsx`)
- **Tipos/interfaces**: `PascalCase`, prefijo `I` solo para interfaces de contrato externo (ej: `IVerifactuProvider`). Tipos internos sin prefijo.
- **Variables/funciones**: `camelCase`.
- **Constantes globales**: `SCREAMING_SNAKE_CASE`.
- **BD (Prisma)**: `camelCase` en modelos, mapeado a `snake_case` en SQL (`@@map`).

### 5.2 Estructura de archivos en cada paquete

```
packages/<paquete>/
├── src/
│   ├── index.ts           # Barrel export público
│   ├── <feature>/
│   │   ├── types.ts
│   │   ├── schemas.ts     # Zod schemas
│   │   ├── service.ts     # Lógica de negocio
│   │   └── <feature>.test.ts
├── CLAUDE.md              # Reglas específicas del paquete
├── package.json
└── tsconfig.json
```

### 5.3 Tests

- **Unitarios**: Vitest. Ubicados junto al archivo (`.test.ts`).
- **E2E**: Playwright en `apps/web/e2e/`.
- **Cobertura mínima** en `core-billing/verifactu`: 90%. Sin excusas. Es el módulo que no puede fallar.

### 5.4 Commits

Conventional Commits:
- `feat(verifactu): add hash chaining`
- `fix(limpieza): correct recurring invoice bug`
- `docs(root): update architecture diagram`

Cada commit debe mencionar el paquete afectado en el scope.

---

## 6. Flujo de trabajo con Claude Code

### 6.1 Antes de empezar cualquier tarea

1. Leer este `CLAUDE.md` maestro.
2. Leer el `CLAUDE.md` del paquete en el que vas a trabajar.
3. Leer los archivos relevantes del paquete antes de escribir.
4. Si la tarea afecta al schema Prisma, leer `infrastructure/prisma/schema.prisma` completo.

### 6.2 Orden de operaciones

1. Entender la tarea → pedir clarificación si hay ambigüedad.
2. Proponer enfoque en una línea antes de escribir código si la tarea es no-trivial (>50 líneas).
3. Implementar + tests en la misma sesión.
4. Correr `pnpm test` y `pnpm typecheck` antes de dar por terminada una tarea.
5. Commit con mensaje descriptivo.

### 6.3 Qué NO hacer nunca

- No añadir dependencias npm sin mencionarlo explícitamente con justificación.
- No modificar código en `packages/core-billing/verifactu/` sin leer primero su `CLAUDE.md`.
- No crear un nuevo paquete sin proponerlo antes y recibir aprobación.
- No tocar migraciones SQL históricas. Nuevas migraciones sobre las existentes.
- No usar `any` en TypeScript. Si es necesario, `unknown` + narrowing.
- No crear carpetas `utils/` o `helpers/` genéricos. Todo utility va en un paquete con nombre claro.
- No hardcodear strings que aparezcan en UI. Todo va por el sistema i18n (`packages/core-ui/i18n`).

---

## 7. Slash commands disponibles

Definidos en `.claude/commands/`:

- `/new-vertical <nombre>` — crea un nuevo vertical con estructura estándar
- `/new-module <paquete> <nombre>` — crea un nuevo módulo dentro de un paquete
- `/verify-sif` — ejecuta la checklist de cumplimiento Verifactu
- `/gen-prisma-model <nombre>` — genera un modelo Prisma con los campos multi-tenant estándar

---

## 8. Glosario (acrónimos y términos del dominio)

- **SIF**: Sistema Informático de Facturación (definido en RD 1007/2023)
- **RRSIF**: Reglamento de Requisitos de los SIF
- **AEAT**: Agencia Estatal de Administración Tributaria
- **Verifactu**: modalidad de SIF que envía facturas a AEAT en tiempo real
- **SII**: Suministro Inmediato de Información (sistema distinto, empresas grandes)
- **TicketBAI**: sistema equivalente en País Vasco (fuera de scope V1)
- **Facturae**: formato XML estándar para factura electrónica B2B en España
- **UBL**: Universal Business Language, estándar internacional de e-invoicing
- **Peppol**: red europea de intercambio de facturas electrónicas
- **Tenant**: cliente de la plataforma (un autónomo, una empresa)
- **Vertical**: módulo especializado por sector (limpieza, construcción...)

---

## 9. Contexto del owner

Elias tiene experiencia principalmente en Next.js, TypeScript, React, Tailwind, Prisma, Supabase y Vercel — se autodefine como principiante ambicioso. Cuando expliques algo:
- No asumas conocimiento avanzado de DevOps, criptografía o protocolos SOAP.
- Sí asume conocimiento sólido de React, Next.js y Supabase.
- Si una decisión técnica es compleja, explica brevemente el porqué, no solo el qué.
- Siempre propón la opción con mejor relación calidad/complejidad, no la más sofisticada.

---

## 10. Referencia documental

- Documento de estrategia maestra: `/docs/verifactu-plataforma-estrategia.md`
- FAQs oficiales AEAT: `https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes.html`
- Documentación técnica fabricantes: `https://verifactu-aeat.github.io/`
