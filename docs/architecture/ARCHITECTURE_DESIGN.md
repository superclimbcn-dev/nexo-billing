# 🏛️ Architecture Design — Nexo Billing

**Versión:** 1.0 — Sesión 5.5 "Cimientos definitivos"
**Fecha:** 28 abril 2026
**Estado:** PROPUESTA — Pendiente de aprobación de Elias antes de implementar

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Architecture Decision Records (ADRs)](#2-adrs)
3. [Schema Prisma completo propuesto](#3-schema-prisma-completo)
4. [Estrategia RLS para nuevos modelos](#4-estrategia-rls)
5. [Cambios en el flujo de onboarding](#5-cambios-onboarding)
6. [Estructura de carpetas final](#6-estructura-carpetas)
7. [Migración de datos](#7-migracion-datos)
8. [Checklist de validación](#8-checklist-validacion)

---

## 1. Resumen ejecutivo

Esta sesión completa los cimientos de Nexo Billing antes de empezar a construir Verifactu y módulos verticales. **No es nueva funcionalidad visible al usuario**, es la base que soporta TODO lo que viene después.

### Decisiones clave que tomamos

| # | Decisión | Por qué |
|---|---|---|
| ADR-001 | Modelo `Item` unificado (productos + servicios) | Mercado mixto; Stripe/Shopify lo hacen así |
| ADR-002 | Tabla `Vertical` + `VerticalRequest` | Datos de demanda, escape hatch, expansión gradual |
| ADR-003 | `BrandingConfig` 1:1 con Tenant desde día 1 | Verifactu hace facturas inmutables; el branding debe existir antes |
| ADR-004 | `InvoiceSeries` con counter atómico | Verifactu exige correlativos sin huecos; race condition real |
| ADR-005 | `AuditLog` global desde día 1 | Verifactu exige trazabilidad legal |
| ADR-006 | `Quote`, `Supplier`, `Expense`, `Payment` desde ahora | Núcleo de facturación completo, no parcheado |
| ADR-007 | CNAE como sistema de categorización | Estándar oficial España |
| ADR-008 | Branding con CSS variables inyectadas | Tailwind v4 ya lo soporta nativamente |
| ADR-009 | Localización con `Intl` + paquete `core-utils` | Mercado ES espera `2.375,00 €`; preparar i18n futuro |

---

## 2. ADRs (Architecture Decision Records)

### ADR-001 — Modelo unificado `Item` para productos y servicios

**Contexto:** El modelo actual `Product` está sesgado a productos físicos. El mercado real español incluye negocios mixtos (climatización, peluquería, veterinaria, Superclim) que venden ambas cosas. Servicios recurrentes ya se gestionan en `RecurringContract`, pero servicios puntuales no tienen dónde ir.

**Decisión:** Crear modelo `Item` con campo discriminador `type` que admite `product`, `service`, `subscription`, `kit`, `digital`. Campos comunes (precio, IVA, descripción) más campos específicos del tipo (stock para producto, duración para servicio, ciclo para suscripción).

**Consecuencias:**
- ✅ Una factura puede mezclar productos y servicios en líneas (ya pasa hoy en facturas reales).
- ✅ Stock control opcional por item.
- ✅ Margen comercial (precio coste vs precio venta).
- ⚠️ Migración necesaria si hubiera datos en `Product` (no los hay todavía → cero coste).

**Alternativas rechazadas:**
- Modelos `Product` y `Service` separados → duplicación de líneas, joins complejos en facturas mixtas.
- `Product` con flag `isService` → no escala a 5+ tipos.

---

### ADR-002 — Tabla `Vertical` + sistema de demanda con `VerticalRequest`

**Contexto:** El campo `Tenant.vertical` es un string libre con comentario. Sin metadata. Sin estado (activo/beta/coming_soon). No permite registrar demanda de mercado para verticales no construidos.

**Decisión:**
- Tabla `Vertical` con: slug, nombre, descripción, status, modulesEnabled, cnaeMapping, color, icon.
- Tabla `VerticalRequest` que registra cada vez que un tenant elige "Otro sector" durante onboarding (tenantId, businessTypeRequested, cnae, createdAt).
- `Tenant.verticalId` (FK nullable) reemplaza el campo string.
- 5 verticales seed: `generic` (active), `cleaning` (active), `construction` (beta), `medical` (coming_soon), `retail` (coming_soon), `services_pro` (active).

**Consecuencias:**
- ✅ Datos para decidir qué vertical construir según demanda real.
- ✅ Status permite mostrar "próximamente" en onboarding sin romper.
- ✅ CNAE mapping permite sugerir vertical automáticamente.
- ✅ Cambio de slug = UPDATE en una sola fila (no en miles).

**Alternativas rechazadas:**
- Mantener string libre → no escalable, no medible.
- Hardcodear en código → no permite añadir verticales sin deploy.

---

### ADR-003 — `BrandingConfig` desde día 1 con valores default

**Contexto:** Las facturas Verifactu son inmutables tras envío a AEAT. Si una factura se genera sin branding y luego el tenant activa branding, esa factura ya nunca podrá re-emitirse con su marca. Además, el plan Pro/Enterprise va a vender "white-label" como feature.

**Decisión:** Crear modelo `BrandingConfig` 1:1 obligatorio con Tenant. Al crear tenant en onboarding, se crea automáticamente con valores default sensatos (logo de Nexo Billing, colores marca por defecto, tipografía Inter). El tenant puede personalizar desde Settings cuando quiera.

**Consecuencias:**
- ✅ Toda factura generada incluye branding (default o custom).
- ✅ Activar branding personalizado es un UPDATE, no migración.
- ✅ Sistema de planes (free/starter/pro/enterprise) puede gatear features de branding sin tocar el modelo.
- ⚠️ Almacenar logos requiere Supabase Storage bucket `branding-assets`.

**Alternativas rechazadas:**
- Branding como JSON en Tenant → se infla, queries lentas, sin tipado.
- Branding solo cuando el tenant lo activa → riesgo de facturas sin branding.

---

### ADR-004 — `InvoiceSeries` con counter atómico

**Contexto:** Verifactu exige numeración correlativa sin huecos por serie. Hoy `Invoice.series + Invoice.number` con UNIQUE puede sufrir race condition: dos requests simultáneos calculan `MAX(number)+1 = 42`, ambos intentan insertar 42, uno falla. Error en producción + número saltado = problema legal.

**Decisión:** Tabla `InvoiceSeries` con campo `nextNumber` y bloqueo a nivel fila. Al crear factura:
```sql
SELECT next_number FROM invoice_series WHERE id = ? FOR UPDATE;
UPDATE invoice_series SET next_number = next_number + 1 WHERE id = ?;
```
Dentro de transacción Prisma forma array. Garantiza atomicidad y elimina huecos.

**Series seed por tenant:**
- `A` — Facturas estándar (default)
- `R` — Facturas rectificativas
- `S` — Simplificadas (tickets)

**Consecuencias:**
- ✅ Sin race conditions.
- ✅ Múltiples series por tenant (legal/práctico).
- ✅ Configurable: prefijo, año, formato (`A-2026-0001`).
- ⚠️ Requiere Sequelize-style locking en cada creación de factura.

**Alternativas rechazadas:**
- Secuencias PostgreSQL nativas → no se reinician por año por tenant fácilmente.
- UUID en factura → ilegal en España (debe ser correlativo numérico).
- Random + retry → fea solución, sigue dejando huecos.

---

### ADR-005 — `AuditLog` global desde día 1

**Contexto:** Verifactu exige trazabilidad: qué usuario hizo qué acción y cuándo. Sin AuditLog, cualquier inspección AEAT es problemática. Además, debugging multi-tenant es imposible sin logs.

**Decisión:** Modelo `AuditLog` con: tenantId, userId, action (enum), entityType, entityId, before (JSON), after (JSON), ip, userAgent, createdAt. Inmutable (sin UPDATE/DELETE policies). Se escribe vía middleware/wrapper en Server Actions críticos.

**Acciones a loguear (mínimo):**
- `INVOICE_CREATED`, `INVOICE_SENT`, `INVOICE_CANCELLED`, `INVOICE_RECTIFIED`
- `USER_INVITED`, `USER_REMOVED`, `ROLE_CHANGED`
- `TENANT_BRANDING_UPDATED`, `TENANT_VERTICAL_CHANGED`
- `LOGIN_SUCCESS`, `LOGIN_FAILED`

**Consecuencias:**
- ✅ Cumplimiento legal Verifactu.
- ✅ Debug de incidentes en producción.
- ✅ Reportes "actividad del equipo" para el OWNER.
- ⚠️ Puede crecer mucho → política de retención (90 días en base, archivo después).

---

### ADR-006 — Núcleo de facturación completo: Quote, Supplier, Expense, Payment

**Contexto:** Un sistema de facturación profesional en España necesita cuatro flujos:
1. **Ventas:** Presupuesto → Factura → Cobro
2. **Compras:** Proveedor → Gasto → Pago
3. **Tesorería:** Movimientos bancarios + conciliación
4. **Reportes fiscales:** Libro registro de facturas emitidas + recibidas

Hoy solo tienes (1) parcialmente. Verifactu **exige libro registro de facturas recibidas** (no solo emitidas). Sin Supplier+Expense, no puedes cumplir.

**Decisión:** Añadir desde ahora:
- `Quote` + `QuoteLine` (presupuestos, convertibles a factura)
- `Supplier` (proveedores, paralelo a Client)
- `Expense` + `ExpenseLine` (facturas recibidas)
- `Payment` (cobros y pagos, polimórfico: invoiceId O expenseId)

**Consecuencias:**
- ✅ Núcleo completo desde día 1.
- ✅ Verifactu compliance completo (libro registro emitidas + recibidas).
- ✅ Conciliación bancaria viable (futuro).
- ⚠️ Más modelos = más superficie de RLS = más tests.

---

### ADR-007 — CNAE como sistema de categorización oficial

**Contexto:** Necesitamos categorizar negocios. Inventarnos categorías es trabajo perdido y no oficial. El CNAE-2009 es la clasificación oficial española de actividades económicas, conocida por todos los autónomos/empresas (lo declaran en modelo 036/037).

**Decisión:**
- Campo `Tenant.cnae` (string, 4 dígitos).
- Campo `Tenant.businessType` (string libre, lo que escribe el usuario, ej: "Fontanería").
- Tabla `Vertical.cnaeMapping` (array de prefijos CNAE que mapean a ese vertical).

**Onboarding:** El usuario elige primero "vertical especializado" (Limpieza, Construcción) o "Otro sector". Si "Otro", se le pide CNAE (con buscador) + descripción libre del negocio.

**Consecuencias:**
- ✅ Estándar oficial, cero invención.
- ✅ Compatibilidad con futuras integraciones AEAT/Seguridad Social.
- ✅ Reportes oficiales correctos.
- ⚠️ Necesitamos cargar tabla CNAE seed (~700 entradas, fuente oficial INE).

---

### ADR-008 — Branding con CSS variables inyectadas runtime

**Contexto:** Tailwind v4 CSS-first ya usa CSS variables (`--accent`, `--bg`, etc.). El branding personalizado simplemente sobreescribe esas variables a nivel `<html>` o `<body>` cuando se carga el tenant.

**Decisión:**
- En el Server Layout `(app)/layout.tsx`, leer `BrandingConfig` del tenant y generar `<style>` inline con las variables custom.
- CSS variables soportadas: `--brand-primary`, `--brand-secondary`, `--brand-accent`, `--brand-text-on-primary`.
- Logos via `<img>` con URL a Supabase Storage.
- Plantillas de factura PDF usan las mismas variables (componentes React → `react-pdf` o `puppeteer`).

**Consecuencias:**
- ✅ Cero JavaScript adicional para theming.
- ✅ Server-side render del color correcto desde primera pintura (no flicker).
- ✅ Compatible con dark mode (definimos variables para light y dark).
- ⚠️ El sidebar actual (`var(--accent)`) debe migrar a `var(--brand-accent)` para que sea overrideable por tenant.

---

### ADR-009 — Localización (números, fechas, moneda) en formato español

**Contexto:** Los usuarios españoles esperan ver `2.375,00 €` (punto de miles, coma decimal). El formato anglosajón `2,375.00` es confuso y genera quejas de clientes (experiencia previa del usuario en otros productos). Además, el sistema debe soportar futuras expansiones a Portugal (`pt-PT`), Francia (`fr-FR`), etc.

**Decisión:**

Separar estrictamente capa de almacenamiento (técnico, canónico) de capa de presentación (localizada):

- **BD (Prisma `Decimal`):** siempre `2375.00` — formato técnico, calculable, válido para Verifactu XML.
- **UI (web + emails + PDFs):** `2.375,00 €` — formato `es-ES` por defecto, configurable por tenant.
- **XML AEAT (Verifactu):** `2375.00` — formato técnico estricto exigido por la AEAT, NUNCA localizado.

Crear nuevo paquete `@nexo/core-utils` con:

```
packages/core-utils/
├── package.json
└── src/
    ├── index.ts
    ├── format/
    │   ├── currency.ts      → formatCurrency(2375) → "2.375,00 €"
    │   ├── number.ts        → formatNumber(15.5) → "15,50"
    │   ├── date.ts          → formatDate(date) → "28/04/2026"
    │   ├── datetime.ts      → formatDateTime(date) → "28/04/2026 14:30"
    │   ├── nif.ts           → formatNif("B12345678") → "B-12345678"
    │   ├── iban.ts          → formatIban("ES12...") → "ES12 3456 7890..."
    │   └── phone.ts         → formatPhone("+34666...") → "+34 666 12 34 56"
    └── parse/
        ├── currency.ts      → parseCurrency("2.375,00 €") → 2375
        └── number.ts        → parseNumber("15,50") → 15.5
```

Implementación con `Intl.NumberFormat` y `Intl.DateTimeFormat` nativos (cero dependencias externas).

Inputs flexibles en formularios: aceptar `2375`, `2375,50`, `2.375,50`, `2375.50`, `2,375.50` y normalizar al guardar.

Locale por tenant: campo futuro `Tenant.locale` (default `es-ES`). Por ahora hardcoded `es-ES`.

**Consecuencias:**
- ✅ Resuelve queja real de clientes (separador de miles).
- ✅ i18n preparado para futuros mercados (PT, FR, IT).
- ✅ Verifactu XML siempre en formato técnico correcto.
- ✅ Tests unitarios fáciles de escribir (paquete aislado, sin BD ni Supabase).
- ⚠️ Toda UI futura debe usar estos helpers — no hardcodear formatos.
- ⚠️ Migrar progresivamente las pantallas existentes (dashboard, settings/team) a los helpers.

**Alternativas rechazadas:**
- Guardar números formateados en BD → imposible calcular, imposible Verifactu.
- Librerías externas (numeral.js, dinero.js) → `Intl` nativo es suficiente y cero peso.
- Formato hardcodeado en cada componente → escala fatal a 5 países.

---

## 3. Schema Prisma completo propuesto

> 📌 Este es el schema TARGET. Comparado con el actual: 8 modelos nuevos, 4 modelos ampliados.

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ════════════════════════════════════════════════════════════════════════════
//                                  ENUMS
// ════════════════════════════════════════════════════════════════════════════

enum UserRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
  ACCOUNTANT
}

enum VerticalStatus {
  active
  beta
  coming_soon
  deprecated
}

enum ItemType {
  product
  service
  subscription
  kit
  digital
}

enum InvoiceStatus {
  draft
  sent
  paid
  partially_paid
  overdue
  cancelled
  rectified
}

enum InvoiceType {
  F1   // Factura completa estándar
  F2   // Factura simplificada (ticket)
  R1   // Rectificativa por error fundado en derecho
  R2   // Rectificativa por concurso
  R3   // Rectificativa por deudas
  R4   // Rectificativa otros
  R5   // Rectificativa simplificada
}

enum QuoteStatus {
  draft
  sent
  accepted
  rejected
  expired
  converted
}

enum ExpenseStatus {
  pending
  paid
  partially_paid
  overdue
  cancelled
}

enum PaymentMethod {
  cash
  bank_transfer
  card
  bizum
  direct_debit
  cheque
  other
}

enum PaymentDirection {
  inbound   // cobro de cliente
  outbound  // pago a proveedor
}

enum AuditAction {
  // Tenant
  TENANT_CREATED
  TENANT_UPDATED
  TENANT_BRANDING_UPDATED
  TENANT_VERTICAL_CHANGED

  // Users & team
  USER_INVITED
  USER_JOINED
  USER_REMOVED
  USER_ROLE_CHANGED

  // Invoices
  INVOICE_CREATED
  INVOICE_UPDATED
  INVOICE_SENT
  INVOICE_VERIFACTU_SUBMITTED
  INVOICE_CANCELLED
  INVOICE_RECTIFIED
  INVOICE_PAID

  // Quotes
  QUOTE_CREATED
  QUOTE_SENT
  QUOTE_ACCEPTED
  QUOTE_CONVERTED

  // Expenses
  EXPENSE_CREATED
  EXPENSE_PAID

  // Auth
  LOGIN_SUCCESS
  LOGIN_FAILED
}

enum ClientType {
  individual         // Particular
  business           // Empresa
  freelancer         // Autónomo
  public_entity      // Administración pública
}

enum VatRegime {
  general            // Régimen general
  simplified         // Simplificado
  recargo_equivalencia
  exempt             // Exento
  reverse_charge     // Inversión sujeto pasivo
  intra_eu           // Intracomunitario
  export             // Exportación
}

// ════════════════════════════════════════════════════════════════════════════
//                              CORE — TENANT
// ════════════════════════════════════════════════════════════════════════════

model Tenant {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  legalName      String?  @map("legal_name")           // Razón social
  nif            String   @unique
  cnae           String?                                // Código CNAE (ej: "8121")
  businessType   String?  @map("business_type")        // Lo que escribe el usuario ("Fontanería")
  verticalId     String?  @map("vertical_id") @db.Uuid // FK a Vertical (nullable = genérico)
  plan           String   @default("free")             // free | starter | pro | enterprise
  country        String   @default("ES")               // ISO 3166-1 alpha-2
  currency       String   @default("EUR")              // ISO 4217
  vatRegime      VatRegime @default(general) @map("vat_regime")
  fiscalYearStart Int     @default(1) @map("fiscal_year_start") // mes (1-12)
  sectorMetadata Json?    @map("sector_metadata")      // metadata custom por vertical
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  // Relations
  vertical            Vertical?            @relation(fields: [verticalId], references: [id])
  branding            BrandingConfig?
  users               User[]
  invitations         Invitation[]
  clients             Client[]
  suppliers           Supplier[]
  items               Item[]
  invoiceSeries       InvoiceSeries[]
  invoices            Invoice[]
  quotes              Quote[]
  expenses            Expense[]
  payments            Payment[]
  recurringContracts  RecurringContract[]
  auditLogs           AuditLog[]
  verticalRequests    VerticalRequest[]

  @@map("tenants")
}

// ════════════════════════════════════════════════════════════════════════════
//                          BRANDING (1:1 con Tenant)
// ════════════════════════════════════════════════════════════════════════════

model BrandingConfig {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId            String   @unique @map("tenant_id") @db.Uuid

  // Logos
  logoUrl             String?  @map("logo_url")            // Logo principal (light bg)
  logoUrlDark         String?  @map("logo_url_dark")       // Logo para fondo oscuro
  faviconUrl          String?  @map("favicon_url")
  logoIconUrl         String?  @map("logo_icon_url")       // Solo isotipo para sidebar

  // Colores (hex)
  primaryColor        String   @default("#d4ff3f") @map("primary_color")
  secondaryColor      String   @default("#0a0a0b") @map("secondary_color")
  accentColor         String   @default("#a3cc2c") @map("accent_color")
  textOnPrimary       String   @default("#0a0a0b") @map("text_on_primary")

  // Tipografía
  fontFamily          String   @default("Inter") @map("font_family")
  fontFamilyHeading   String?  @map("font_family_heading")

  // Plantilla de factura
  invoiceTemplate     String   @default("minimal") @map("invoice_template") // minimal | corporate | modern | classic
  invoiceFooterText   String?  @map("invoice_footer_text")
  invoiceShowLogo     Boolean  @default(true) @map("invoice_show_logo")
  invoiceShowQr       Boolean  @default(true) @map("invoice_show_qr")        // QR Verifactu

  // White-label (Enterprise)
  customDomain        String?  @map("custom_domain")
  hideNexoBranding    Boolean  @default(false) @map("hide_nexo_branding")
  emailSenderName     String?  @map("email_sender_name")
  emailSenderAddress  String?  @map("email_sender_address")

  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  tenant              Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("branding_configs")
}

// ════════════════════════════════════════════════════════════════════════════
//                              VERTICALES
// ════════════════════════════════════════════════════════════════════════════

model Vertical {
  id              String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug            String         @unique                          // generic, cleaning, construction, medical
  name            String                                          // "Limpieza y mantenimiento"
  description     String?
  status          VerticalStatus @default(coming_soon)
  modulesEnabled  String[]       @map("modules_enabled")          // ["recurring_contracts", "service_sheets"]
  cnaeMapping     String[]       @map("cnae_mapping")             // ["8121", "8122"]
  iconName        String?        @map("icon_name")                // emoji o nombre de icono
  color           String?                                          // color principal del vertical (UI)
  sortOrder       Int            @default(0) @map("sort_order")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  tenants         Tenant[]

  @@map("verticals")
}

model VerticalRequest {
  id                     String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId               String   @map("tenant_id") @db.Uuid
  businessTypeRequested  String   @map("business_type_requested")  // "Fontanería"
  cnae                   String?
  description            String?                                    // Descripción libre del negocio
  email                  String?                                    // Para notificar cuando se lance
  notifyOnLaunch         Boolean  @default(true) @map("notify_on_launch")
  createdAt              DateTime @default(now()) @map("created_at")

  tenant                 Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("vertical_requests")
}

// ════════════════════════════════════════════════════════════════════════════
//                              USERS & TEAM
// ════════════════════════════════════════════════════════════════════════════

model User {
  id        String   @id @db.Uuid // matches Supabase auth.users.id
  tenantId  String   @map("tenant_id") @db.Uuid
  email     String
  name      String?
  avatarUrl String?  @map("avatar_url")
  role      UserRole @default(MEMBER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  auditLogs AuditLog[]

  @@unique([tenantId, email])
  @@map("users")
}

model Invitation {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  email     String
  role      UserRole @default(MEMBER)
  token     String   @unique @default(dbgenerated("gen_random_uuid()::text"))
  invitedBy String?  @map("invited_by") @db.Uuid
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, email])
  @@map("invitations")
}

// ════════════════════════════════════════════════════════════════════════════
//                          CLIENTS & SUPPLIERS
// ════════════════════════════════════════════════════════════════════════════

model Client {
  id             String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String     @map("tenant_id") @db.Uuid

  // Identificación
  name           String                                   // Nombre comercial
  legalName      String?    @map("legal_name")            // Razón social
  nif            String                                   // NIF/CIF/NIE
  clientType     ClientType @default(business) @map("client_type")
  vatRegime      VatRegime  @default(general) @map("vat_regime")

  // Contacto
  email          String?
  phone          String?
  contactPerson  String?    @map("contact_person")

  // Dirección fiscal
  address        String?
  city           String?
  postalCode     String?    @map("postal_code")
  province       String?
  country        String     @default("ES")               // ISO 3166-1

  // Configuración comercial
  paymentTerms   Int        @default(30) @map("payment_terms")    // días
  defaultVatRate Decimal?   @map("default_vat_rate") @db.Decimal(5, 2)
  notes          String?
  isActive       Boolean    @default(true) @map("is_active")

  sectorMetadata Json?      @map("sector_metadata")
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")

  tenant             Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoices           Invoice[]
  quotes             Quote[]
  recurringContracts RecurringContract[]

  @@unique([tenantId, nif])
  @@map("clients")
}

model Supplier {
  id             String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String     @map("tenant_id") @db.Uuid

  name           String
  legalName      String?    @map("legal_name")
  nif            String
  clientType     ClientType @default(business) @map("client_type")

  email          String?
  phone          String?
  contactPerson  String?    @map("contact_person")

  address        String?
  city           String?
  postalCode     String?    @map("postal_code")
  province       String?
  country        String     @default("ES")

  paymentTerms   Int        @default(30) @map("payment_terms")
  notes          String?
  isActive       Boolean    @default(true) @map("is_active")

  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")

  tenant         Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  expenses       Expense[]

  @@unique([tenantId, nif])
  @@map("suppliers")
}

// ════════════════════════════════════════════════════════════════════════════
//                              CATALOG (ITEMS)
// ════════════════════════════════════════════════════════════════════════════

model Item {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String   @map("tenant_id") @db.Uuid

  // Tipo (DISCRIMINATOR)
  type           ItemType @default(product)

  // Comunes
  name           String
  description    String?
  sku            String?                                       // Code/referencia (común a productos y servicios)
  unitPrice      Decimal  @map("unit_price") @db.Decimal(12, 2)
  vatRate        Decimal  @map("vat_rate") @db.Decimal(5, 2)
  unit           String   @default("ud")                       // ud, hora, día, m², kg
  category       String?
  isActive       Boolean  @default(true) @map("is_active")

  // Solo PRODUCT (nullable)
  barcode        String?
  stockEnabled   Boolean  @default(false) @map("stock_enabled")
  currentStock   Decimal? @map("current_stock") @db.Decimal(12, 3)
  minStock       Decimal? @map("min_stock") @db.Decimal(12, 3)
  purchasePrice  Decimal? @map("purchase_price") @db.Decimal(12, 2)
  weightKg       Decimal? @map("weight_kg") @db.Decimal(8, 3)

  // Solo SERVICE (nullable)
  durationMin    Int?     @map("duration_min")
  isRecurring    Boolean  @default(false) @map("is_recurring")
  recurringCycle String?  @map("recurring_cycle")              // monthly | yearly | etc

  // Custom por vertical
  sectorMetadata Json?    @map("sector_metadata")
  imageUrls      String[] @default([]) @map("image_urls")

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoiceLines   InvoiceLine[]
  quoteLines     QuoteLine[]
  expenseLines   ExpenseLine[]

  @@unique([tenantId, sku])
  @@map("items")
}

// ════════════════════════════════════════════════════════════════════════════
//                              INVOICE SERIES
// ════════════════════════════════════════════════════════════════════════════

model InvoiceSeries {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid

  code         String                                   // "A", "R", "S"
  name         String                                   // "Facturas estándar"
  prefix       String?                                  // ej "FAC-"
  suffix       String?                                  // ej "/2026"
  numberFormat String   @default("0000") @map("number_format")  // padding
  nextNumber   Int      @default(1) @map("next_number")
  isDefault    Boolean  @default(false) @map("is_default")
  isActive     Boolean  @default(true) @map("is_active")
  resetYearly  Boolean  @default(true) @map("reset_yearly")
  yearOfNumbering Int?  @map("year_of_numbering")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  tenant       Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoices     Invoice[]

  @@unique([tenantId, code])
  @@map("invoice_series")
}

// ════════════════════════════════════════════════════════════════════════════
//                              INVOICES
// ════════════════════════════════════════════════════════════════════════════

model Invoice {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String        @map("tenant_id") @db.Uuid
  clientId       String        @map("client_id") @db.Uuid
  seriesId       String        @map("series_id") @db.Uuid

  number         Int                                            // numérico del contador
  fullNumber     String        @map("full_number")              // "A-2026-0001" formateado

  type           InvoiceType   @default(F1)
  status         InvoiceStatus @default(draft)

  issuedAt       DateTime      @map("issued_at")
  dueAt          DateTime?     @map("due_at")

  // Importes (calculados, materializados para queries rápidas)
  subtotal       Decimal       @db.Decimal(12, 2) @default(0)   // suma sin IVA
  vatAmount      Decimal       @map("vat_amount") @db.Decimal(12, 2) @default(0)
  totalAmount    Decimal       @map("total_amount") @db.Decimal(12, 2) @default(0)
  paidAmount     Decimal       @map("paid_amount") @db.Decimal(12, 2) @default(0)
  pendingAmount  Decimal       @map("pending_amount") @db.Decimal(12, 2) @default(0)

  currency       String        @default("EUR")

  // Rectificación
  rectifiedId    String?       @map("rectified_id") @db.Uuid
  rectificationReason String?  @map("rectification_reason")

  // Comercial
  notes          String?
  internalNotes  String?       @map("internal_notes")           // visible solo equipo
  paymentTerms   Int?          @map("payment_terms")            // días
  paymentMethod  PaymentMethod? @map("payment_method")

  // Origen
  fromQuoteId    String?       @map("from_quote_id") @db.Uuid

  sectorMetadata Json?         @map("sector_metadata")
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client         Client         @relation(fields: [clientId], references: [id])
  series         InvoiceSeries  @relation(fields: [seriesId], references: [id])
  lines          InvoiceLine[]
  records        InvoiceRecord[]
  payments       Payment[]
  rectifiedBy    Invoice?       @relation("Rectification", fields: [rectifiedId], references: [id])
  rectifications Invoice[]      @relation("Rectification")
  fromQuote      Quote?         @relation(fields: [fromQuoteId], references: [id])

  @@unique([tenantId, seriesId, number])
  @@map("invoices")
}

model InvoiceLine {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  invoiceId       String   @map("invoice_id") @db.Uuid
  itemId          String?  @map("item_id") @db.Uuid               // nullable: línea libre permitida

  description     String
  quantity        Decimal  @db.Decimal(10, 3)
  unitPrice       Decimal  @map("unit_price") @db.Decimal(12, 2)
  discountPercent Decimal  @default(0) @map("discount_percent") @db.Decimal(5, 2)

  vatRate         Decimal  @map("vat_rate") @db.Decimal(5, 2)
  claveOperacion  String   @default("01") @map("clave_operacion") // requisito Verifactu

  // Materializados (calculados al guardar)
  subtotal        Decimal  @db.Decimal(12, 2)                    // (qty * price) - discount
  vatAmount       Decimal  @map("vat_amount") @db.Decimal(12, 2)
  totalAmount     Decimal  @map("total_amount") @db.Decimal(12, 2)

  sortOrder       Int      @default(0) @map("sort_order")

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  item    Item?   @relation(fields: [itemId], references: [id])

  @@map("invoice_lines")
}

model InvoiceRecord {
  // Verifactu submission log — immutable after creation
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId     String    @map("tenant_id") @db.Uuid
  invoiceId    String    @map("invoice_id") @db.Uuid
  type         String    @default("Alta") // Alta | Anulacion | Rectificacion
  hash         String
  previousHash String?   @map("previous_hash")
  canonicalXml String    @map("canonical_xml") @db.Text
  qrUrl        String?   @map("qr_url")
  sentAt       DateTime? @map("sent_at")
  aeatResponse Json?     @map("aeat_response")
  status       String    @default("pending") // pending | accepted | rejected | error
  createdAt    DateTime  @default(now()) @map("created_at")

  invoice Invoice @relation(fields: [invoiceId], references: [id])

  @@map("invoice_records")
}

// ════════════════════════════════════════════════════════════════════════════
//                              QUOTES (PRESUPUESTOS)
// ════════════════════════════════════════════════════════════════════════════

model Quote {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String       @map("tenant_id") @db.Uuid
  clientId       String       @map("client_id") @db.Uuid

  number         String                                          // libre, no fiscal: "PRE-2026-0001"
  status         QuoteStatus  @default(draft)

  issuedAt       DateTime     @map("issued_at")
  validUntil     DateTime     @map("valid_until")

  subtotal       Decimal      @db.Decimal(12, 2) @default(0)
  vatAmount      Decimal      @map("vat_amount") @db.Decimal(12, 2) @default(0)
  totalAmount    Decimal      @map("total_amount") @db.Decimal(12, 2) @default(0)
  currency       String       @default("EUR")

  notes          String?
  termsConditions String?     @map("terms_conditions")
  acceptedAt     DateTime?    @map("accepted_at")
  rejectedAt     DateTime?    @map("rejected_at")
  convertedAt    DateTime?    @map("converted_at")

  sectorMetadata Json?        @map("sector_metadata")
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  tenant         Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client         Client       @relation(fields: [clientId], references: [id])
  lines          QuoteLine[]
  invoices       Invoice[]                                       // si convertida

  @@unique([tenantId, number])
  @@map("quotes")
}

model QuoteLine {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  quoteId         String   @map("quote_id") @db.Uuid
  itemId          String?  @map("item_id") @db.Uuid

  description     String
  quantity        Decimal  @db.Decimal(10, 3)
  unitPrice       Decimal  @map("unit_price") @db.Decimal(12, 2)
  discountPercent Decimal  @default(0) @map("discount_percent") @db.Decimal(5, 2)
  vatRate         Decimal  @map("vat_rate") @db.Decimal(5, 2)

  subtotal        Decimal  @db.Decimal(12, 2)
  vatAmount       Decimal  @map("vat_amount") @db.Decimal(12, 2)
  totalAmount     Decimal  @map("total_amount") @db.Decimal(12, 2)

  sortOrder       Int      @default(0) @map("sort_order")

  quote Quote @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  item  Item? @relation(fields: [itemId], references: [id])

  @@map("quote_lines")
}

// ════════════════════════════════════════════════════════════════════════════
//                              EXPENSES (FACTURAS RECIBIDAS)
// ════════════════════════════════════════════════════════════════════════════

model Expense {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String        @map("tenant_id") @db.Uuid
  supplierId     String        @map("supplier_id") @db.Uuid

  externalNumber String        @map("external_number")          // número que viene en la factura del proveedor
  status         ExpenseStatus @default(pending)
  category       String?                                         // alquiler, suministros, profesionales, etc.

  issuedAt       DateTime      @map("issued_at")
  dueAt          DateTime?     @map("due_at")

  subtotal       Decimal       @db.Decimal(12, 2) @default(0)
  vatAmount      Decimal       @map("vat_amount") @db.Decimal(12, 2) @default(0)
  totalAmount    Decimal       @map("total_amount") @db.Decimal(12, 2) @default(0)
  paidAmount     Decimal       @map("paid_amount") @db.Decimal(12, 2) @default(0)
  pendingAmount  Decimal       @map("pending_amount") @db.Decimal(12, 2) @default(0)
  currency       String        @default("EUR")

  notes          String?
  attachmentUrl  String?       @map("attachment_url")           // PDF de la factura del proveedor

  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  supplier       Supplier       @relation(fields: [supplierId], references: [id])
  lines          ExpenseLine[]
  payments       Payment[]

  @@unique([tenantId, supplierId, externalNumber])
  @@map("expenses")
}

model ExpenseLine {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  expenseId       String   @map("expense_id") @db.Uuid
  itemId          String?  @map("item_id") @db.Uuid

  description     String
  quantity        Decimal  @db.Decimal(10, 3)
  unitPrice       Decimal  @map("unit_price") @db.Decimal(12, 2)
  vatRate         Decimal  @map("vat_rate") @db.Decimal(5, 2)

  subtotal        Decimal  @db.Decimal(12, 2)
  vatAmount       Decimal  @map("vat_amount") @db.Decimal(12, 2)
  totalAmount     Decimal  @map("total_amount") @db.Decimal(12, 2)

  sortOrder       Int      @default(0) @map("sort_order")

  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  item    Item?   @relation(fields: [itemId], references: [id])

  @@map("expense_lines")
}

// ════════════════════════════════════════════════════════════════════════════
//                              PAYMENTS (COBROS Y PAGOS)
// ════════════════════════════════════════════════════════════════════════════

model Payment {
  id           String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId     String           @map("tenant_id") @db.Uuid

  direction    PaymentDirection                                  // inbound | outbound
  amount       Decimal          @db.Decimal(12, 2)
  currency     String           @default("EUR")
  method       PaymentMethod    @default(bank_transfer)
  paidAt       DateTime         @map("paid_at")

  // Polimórfico: una de las dos
  invoiceId    String?          @map("invoice_id") @db.Uuid     // si es cobro
  expenseId    String?          @map("expense_id") @db.Uuid     // si es pago

  reference    String?                                           // ref. transferencia, etc.
  notes        String?

  createdAt    DateTime         @default(now()) @map("created_at")

  tenant       Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoice      Invoice?         @relation(fields: [invoiceId], references: [id])
  expense      Expense?         @relation(fields: [expenseId], references: [id])

  @@map("payments")
}

// ════════════════════════════════════════════════════════════════════════════
//                          RECURRING CONTRACTS
// ════════════════════════════════════════════════════════════════════════════

model RecurringContract {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String   @map("tenant_id") @db.Uuid
  clientId       String   @map("client_id") @db.Uuid

  name           String
  frequency      String   @default("monthly")                    // weekly | biweekly | monthly | quarterly | yearly
  nextBillingAt  DateTime @map("next_billing_at")
  amount         Decimal  @db.Decimal(12, 2)
  vatRate        Decimal  @map("vat_rate") @db.Decimal(5, 2) @default(21)
  active         Boolean  @default(true)

  startDate      DateTime? @map("start_date")
  endDate        DateTime? @map("end_date")

  sectorMetadata Json?    @map("sector_metadata")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client Client @relation(fields: [clientId], references: [id])

  @@map("recurring_contracts")
}

// ════════════════════════════════════════════════════════════════════════════
//                              AUDIT LOG
// ════════════════════════════════════════════════════════════════════════════

model AuditLog {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String      @map("tenant_id") @db.Uuid
  userId      String?     @map("user_id") @db.Uuid
  action      AuditAction
  entityType  String      @map("entity_type")                   // "Invoice", "User", etc.
  entityId    String?     @map("entity_id")
  before      Json?
  after       Json?
  ipAddress   String?     @map("ip_address")
  userAgent   String?     @map("user_agent")
  createdAt   DateTime    @default(now()) @map("created_at")

  tenant      Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User?  @relation(fields: [userId], references: [id])

  @@index([tenantId, createdAt])
  @@index([entityType, entityId])
  @@map("audit_logs")
}
```

---

## 4. Estrategia RLS para nuevos modelos

Patrón estándar (mismo que ya tienes):

```sql
-- Para tablas con tenant_id directo
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY <table>_select ON <table> FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY <table>_insert ON <table> FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY <table>_update ON <table> FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY <table>_delete ON <table> FOR DELETE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

### Tablas con tenant_id directo (RLS estándar):
- `branding_configs`, `vertical_requests`
- `suppliers`, `items`, `invoice_series`
- `quotes`, `expenses`, `payments`
- `audit_logs`

### Tablas SIN tenant_id directo (RLS por relación):
- `quote_lines` → vía Quote
- `expense_lines` → vía Expense
- (Igual que `invoice_lines` ya tiene)

### Casos especiales:

**`verticals`:** PÚBLICA en SELECT (todos los tenants ven los verticales disponibles), NO writable desde app (solo via migration/seed).

```sql
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;
CREATE POLICY verticals_select_all ON verticals FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies → bloqueado para todos los usuarios
```

**`audit_logs`:** SELECT solo OWNER/ADMIN del tenant, sin UPDATE/DELETE para nadie (inmutable).

```sql
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('OWNER', 'ADMIN')
  );

CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Sin UPDATE, sin DELETE → inmutable
```

**`invoice_records`:** ya está bien (solo SELECT, INSERT via service role).

### Restricciones por rol (a aplicar también):
- Solo OWNER/ADMIN pueden hacer DELETE en `clients`, `suppliers`, `items`.
- Solo OWNER puede actualizar `branding_configs`.
- VIEWER solo SELECT en todo.
- ACCOUNTANT solo SELECT + INSERT en `payments`, `expenses`.

---

## 5. Cambios en el flujo de onboarding

### Paso `/onboarding/vertical` — REDISEÑO

```
┌─────────────────────────────────────────────────┐
│  ¿A qué se dedica tu empresa?                   │
│                                                 │
│  ━━━ Verticales especializados ━━━              │
│                                                 │
│  🧹 Limpieza y mantenimiento     [active]       │
│     Contratos recurrentes, partes de operario   │
│                                                 │
│  🏗️  Construcción y reformas      [beta]        │
│     Certificaciones, partidas, subcontratas     │
│                                                 │
│  💼 Servicios profesionales       [active]      │
│     Consultorías, agencias, autónomos           │
│                                                 │
│  ━━━ Próximamente ━━━                            │
│                                                 │
│  ⚕️  Salud y bienestar            [coming_soon] │
│  🛍️  Comercio y retail            [coming_soon] │
│                                                 │
│  ━━━ ¿Otro sector? ━━━                           │
│                                                 │
│  📦 Mi sector no está en la lista               │
│     Empezarás con el sistema genérico           │
│     y registraremos tu interés                  │
└─────────────────────────────────────────────────┘
```

Si elige "Otro sector":

```
┌─────────────────────────────────────────────────┐
│  Cuéntanos sobre tu negocio                     │
│                                                 │
│  ¿A qué te dedicas? *                           │
│  [______________________________]               │
│  Ej: Fontanería, Veterinaria, Consultoría...    │
│                                                 │
│  Código CNAE (si lo conoces)                    │
│  [____]  [Buscar mi CNAE →]                     │
│                                                 │
│  Descripción breve (opcional)                   │
│  [______________________________]               │
│  [______________________________]               │
│                                                 │
│  ☑ Avísame por email cuando lancéis             │
│    funciones específicas para mi sector         │
│                                                 │
│  [Continuar →]                                  │
└─────────────────────────────────────────────────┘
```

→ Guarda en `VerticalRequest`. El tenant se crea con `verticalId = generic`.

### `completeOnboarding()` — cambios

```typescript
await prisma.$transaction([
  // 1. Tenant
  prisma.tenant.create({
    data: {
      id: tenantId,
      name, legalName, nif, cnae, businessType,
      verticalId: chosenVerticalId, // null si "otro"
      vatRegime, fiscalYearStart, plan: 'free'
    }
  }),

  // 2. User OWNER
  prisma.user.create({
    data: { id: user.id, tenantId, email, name, role: UserRole.OWNER }
  }),

  // 3. Branding default
  prisma.brandingConfig.create({
    data: {
      tenantId,
      // resto de campos toman defaults del schema
    }
  }),

  // 4. Series por defecto
  prisma.invoiceSeries.createMany({
    data: [
      { tenantId, code: 'A', name: 'Facturas estándar', isDefault: true, prefix: 'A-', suffix: '/2026' },
      { tenantId, code: 'R', name: 'Rectificativas', prefix: 'R-', suffix: '/2026' },
    ]
  }),

  // 5. VerticalRequest si "otro sector"
  ...(verticalRequestData ? [prisma.verticalRequest.create({ data: { tenantId, ...verticalRequestData } })] : []),

  // 6. AuditLog inicial
  prisma.auditLog.create({
    data: {
      tenantId,
      userId: user.id,
      action: 'TENANT_CREATED',
      entityType: 'Tenant',
      entityId: tenantId,
      after: { name, nif, vertical: chosenVerticalSlug }
    }
  }),
])
```

---

## 6. Estructura de carpetas final (después de Sesión 5.5)

```
infrastructure/prisma/prisma/
├── schema.prisma                    # Actualizado completo
└── migrations/
    ├── 20260423110213_initial/
    ├── 20260425120000_add_user_role_enum_and_invitation/
    ├── 20260425130000_add_tenant_sector_metadata/
    └── 20260428_session_5_5_foundations/   # ← NUEVA migración grande

infrastructure/supabase/migrations/
├── 0001_enable_rls.sql
├── 0002_rls_policies.sql
├── 0003_invoice_immutability.sql
├── 0004_hash_chain_constraint.sql
├── 0005_utility_functions.sql
├── 0006_jwt_claims_hook.sql
├── 0007_invitations_rls.sql
├── 0008_session_5_5_rls_new_models.sql     # ← NUEVA: RLS para todos los modelos nuevos
└── 0009_session_5_5_seed_verticals.sql     # ← NUEVA: Seed de verticales

apps/web/src/scripts/
└── test-rls.ts                              # ← NUEVA: script test:rls

docs/
├── architecture/
│   ├── ARCHITECTURE.md                      # ← NUEVA: visión técnica general
│   ├── ROADMAP.md                           # ← NUEVA: ideas premium guardadas
│   └── decisions/
│       ├── 0001-item-unified.md
│       ├── 0002-verticals-table.md
│       ├── 0003-branding-from-day-one.md
│       ├── 0004-invoice-series-atomic.md
│       ├── 0005-audit-log-from-day-one.md
│       ├── 0006-quote-supplier-expense-payment.md
│       ├── 0007-cnae-categorization.md
│       └── 0008-branding-css-variables.md
└── security/
    └── (existente)
```

---

## 7. Migración de datos

**Buenas noticias:** estamos en pre-producción real. No hay tenants de pago todavía. La migración es destructiva sin riesgo:

```sql
-- 1. Drop products (lo recreamos como items)
-- 2. Recrear todo según nuevo schema
-- 3. Seed de verticales (5 entradas)
-- 4. Seed de tabla CNAE (~700 entradas, fuente: INE)
```

**Si tienes algún tenant real de prueba en producción** (necesito que confirmes), seguimos plan más cuidadoso:
- Migración aditiva (añade tablas y columnas sin tocar las existentes)
- Backfill: cada Tenant existente → crear BrandingConfig default + Series default
- Renombrar tabla `products` → `items` con ALTER TABLE + añadir campos nuevos
- Cero downtime

---

## 8. Checklist de validación

Antes de aprobar el diseño, revisa que:

- [ ] Entiendes qué es cada uno de los 8 modelos nuevos
- [ ] Estás de acuerdo con renombrar `Product` → `Item`
- [ ] Estás de acuerdo con CNAE como sistema de categorización
- [ ] Estás de acuerdo con tener `BrandingConfig` desde el día 1
- [ ] Estás de acuerdo con `Quote`, `Supplier`, `Expense`, `Payment` desde ahora
- [ ] Estás de acuerdo con el rediseño del paso `/onboarding/vertical`
- [ ] Confirmas si hay tenants reales en PROD (necesario para plan de migración)

---

## Próximo paso

Una vez aprobado este diseño:

1. Genero **Prompt 1 para Claude Code** → modifica `schema.prisma` + crea migración
2. Tú lo ejecutas en VS Code, revisas el diff, y pegas el resultado aquí
3. Validamos
4. Pasamos a Prompt 2 (RLS)
5. Y así sucesivamente

**Fases planificadas:**
- Fase 1 — Schema Prisma + migración fresh ✅ (completada sesión 5.5)
- Fase 2 — RLS policies para nuevos modelos (0008_session_5_5_rls.sql) + seed verticales
- Fase 3 — Actualizar Server Actions y páginas existentes al nuevo schema
- Fase 4 — Paquete `@nexo/core-utils` con utilidades de localización (basado en ADR-009)
- Fase 5 — Tests multi-tenant
- Fase 6 — Nuevas rutas UI (Facturas, Clientes, Items, Presupuestos, Gastos)

**Total de prompts:** ~6-8 prompts pequeños y focalizados, en vez de 1 prompt gigante. Cada uno verificable independientemente.
