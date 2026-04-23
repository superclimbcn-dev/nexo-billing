# Nexo Billing

> Plataforma SaaS de facturación multi-tenant Verifactu-compliant para autónomos y pymes en España.

**Stack**: Next.js 15 · TypeScript · React 19 · Tailwind · shadcn/ui · Supabase · Prisma · Turborepo · pnpm

---

## Arranque rápido

### Requisitos

- Node.js 20+
- pnpm 9+
- Cuenta Supabase
- Cuenta Verifacti (sandbox)

### Setup inicial

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# (editar .env.local con tus claves)

# 3. Generar cliente Prisma
pnpm prisma:generate

# 4. Correr migraciones
pnpm prisma:migrate

# 5. Arrancar en dev
pnpm dev
```

---

## Estructura del monorepo

```
nexo-billing/
├── apps/                       # Aplicaciones Next.js
│   ├── web/                   # App principal multi-tenant
│   ├── admin/                 # Backoffice operador
│   └── docs/                  # Documentación pública
│
├── packages/                   # Paquetes compartidos
│   ├── core-billing/          # Motor de facturación
│   │   ├── verifactu/        # SIF + AEAT (crítico)
│   │   ├── facturae/         # Factura electrónica B2B
│   │   ├── invoice-engine/   # Numeración, series, rectificativas
│   │   ├── tax-calculator/   # IVA, IRPF, retenciones
│   │   └── pdf-generator/    # PDFs con QR
│   ├── core-crm/             # Clientes, productos
│   ├── core-payments/        # Stripe, SEPA, conciliación
│   ├── core-ui/              # Design system
│   ├── core-auth/            # Auth + multi-tenant
│   ├── core-analytics/       # Dashboards, reportes
│   └── core-types/           # TypeScript + Zod compartidos
│
├── verticals/                  # Módulos por sector
│   ├── limpieza/              # (V1) - primer vertical
│   ├── construccion/
│   ├── medicos/
│   ├── servicios-pro/
│   └── retail/
│
├── infrastructure/
│   ├── supabase/              # Migraciones, RLS, edge functions
│   ├── prisma/                # Schema Prisma
│   └── scripts/               # Deployment, seed
│
└── .claude/
    └── commands/              # Slash commands para Claude Code
```

---

## Slash commands disponibles en Claude Code

| Comando | Qué hace |
|---|---|
| `/new-vertical <nombre>` | Crea un vertical completo con estructura estándar |
| `/new-module <paquete> <nombre>` | Crea un módulo dentro de un paquete |
| `/verify-sif` | Audita cumplimiento Verifactu del módulo SIF |
| `/gen-prisma-model <nombre>` | Genera modelo Prisma multi-tenant con RLS |

---

## Scripts

```bash
pnpm dev              # Todos los apps en paralelo
pnpm build            # Build de todo el monorepo
pnpm typecheck        # Typecheck en todos los paquetes
pnpm test             # Tests en todos los paquetes
pnpm test:coverage    # Tests con coverage
pnpm lint             # Lint en todos los paquetes
pnpm format           # Prettier en todo el código
pnpm prisma:studio    # Abrir Prisma Studio
```

---

## Reglas de oro

1. **`packages/core-billing/verifactu/`**: zona crítica. Leer su `CLAUDE.md` antes de tocar nada.
2. **Multi-tenant**: toda tabla tiene `tenantId` y política RLS. Sin excepciones.
3. **Core vs Vertical**: los verticales usan el core, nunca al revés.
4. **UI siempre en español** (es-ES), código siempre en inglés.
5. **Inalterabilidad de facturas**: una vez emitida, no se modifica. Rectificativa o anulación.

---

## Documentación

- Documento maestro de estrategia: `/docs/verifactu-plataforma-estrategia.md`
- `CLAUDE.md` raíz: reglas del proyecto
- `packages/core-billing/verifactu/CLAUDE.md`: reglas del módulo SIF
- `verticals/limpieza/CLAUDE.md`: referencia del patrón de vertical

---

## Fases del roadmap

- **Q2 2026**: Core-billing + Verifacti + motor de facturación + multi-tenant
- **Q3 2026**: Vertical limpieza completo + beta privada
- **Q4 2026**: Vertical construcción + OCR + conciliación bancaria + lanzamiento público
- **Q1 2027**: Vertical médicos + marketing pre-obligatoriedad
- **Q2 2027**: Pico de conversión previo al 1 julio 2027
