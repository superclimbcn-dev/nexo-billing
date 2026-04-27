# Deployment — Nexo Billing

Guía de referencia para el operador. Cubre entornos, flujo de despliegue, verificación y gestión de migraciones en producción.

---

## Entornos

| | Staging | Production |
|---|---|---|
| **URL** | nexo-billing-web.vercel.app | nexo-billing.vercel.app |
| **Branch** | `develop` | `main` |
| **Vercel project** | `nexo-billing-dev` (prj_diKburo4LvlWAHXLPut4ibQwKEY2) | `nexo-billing` (prj_xeJvmZ8YCK41J2qXyrTChAVO6Vwp) |
| **Supabase project** | Proyecto de desarrollo | Proyecto de producción (jiyisxyqxzblmwxisgpx) |
| **Deploy trigger** | Push a `develop` | Merge `develop → main` (PR) |

---

## Git flow

```
feature/<nombre>
      │
      └──► develop  ──────► PR ──────► main
              │                          │
           (staging)                (production)
         auto-deploy              deploy on merge
```

**Reglas:**
- Nunca hacer commits directos a `main`.
- Todo desarrollo va a `develop` (directamente o via `feature/*` → PR).
- Cuando staging está validado: abrir PR `develop → main` para promover a producción.
- El merge a `main` dispara el deploy de producción automáticamente.

---

## Variables de entorno

Todas las variables están configuradas en cada proyecto de Vercel con `type=encrypted`, `target=["production","preview"]`.

| Variable | Origen | Entorno |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL | Staging + Prod |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → Publishable key (`sb_publishable_...`) | Staging + Prod |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → Secret key (`sb_secret_...`) | Staging + Prod |
| `DATABASE_URL` | Supabase dashboard → Settings → Database → Transaction pooler (port 6543) + `?pgbouncer=true&connection_limit=1` | Staging + Prod |
| `DIRECT_URL` | Supabase dashboard → Settings → Database → Session pooler (port 5432) | Staging + Prod |
| `SUPABASE_PROJECT_REF` | Extraído del Project URL (`https://<ref>.supabase.co`) | Staging + Prod |
| `HEALTH_CHECK_TOKEN` | Generado aleatoriamente (32 chars hex). **El token de cada entorno se custodia en el gestor de contraseñas del operador. NO se documenta aquí.** | Staging + Prod (valores distintos) |

> **Nota de seguridad:** `SUPABASE_ACCESS_TOKEN` (token personal de la Supabase Management API) NO se añade a producción. Solo se usa localmente para scripts de migración.

---

## Verificar un deploy

### Staging

```bash
curl -s "https://nexo-billing-web.vercel.app/api/health?token=<STAGING_TOKEN>" | jq .
```

Respuesta esperada (HTTP 200):
```json
{"db":"ok","supabase":"ok","env":"production"}
```

### Production

```bash
curl -s "https://nexo-billing.vercel.app/api/health?token=<PROD_TOKEN>" | jq .
```

Respuesta esperada (HTTP 200):
```json
{"db":"ok","supabase":"ok","env":"production"}
```

> Los tokens `<STAGING_TOKEN>` y `<PROD_TOKEN>` están en el gestor de contraseñas del operador bajo las entradas `HEALTH_CHECK_TOKEN staging` y `HEALTH_CHECK_TOKEN prod`.

### Qué hacer si falla

| Respuesta | Causa probable | Acción |
|---|---|---|
| HTTP 404 `{"error":"Not found"}` | Token incorrecto o `HEALTH_CHECK_TOKEN` no configurado en Vercel | Verificar variable en Vercel dashboard |
| HTTP 500 `db: error` | `DATABASE_URL` incorrecta, Prisma no puede conectar, o binario engine no desplegado | Ver logs de Vercel → Functions → `/api/health` |
| HTTP 500 `supabase: error` | `SUPABASE_SERVICE_ROLE_KEY` incorrecta o proyecto Supabase no accesible | Verificar key en Supabase dashboard → Settings → API |
| HTTP 200 ambos ok | Deploy correcto ✅ | — |

---

## Aplicar migraciones a producción

Las migraciones tienen dos componentes: el schema Prisma y las migraciones SQL de Supabase (RLS, triggers, funciones).

### 1. Migraciones Prisma (schema + tablas)

```bash
# Desde la raíz del monorepo, con las variables de prod en el entorno:
DIRECT_URL="postgresql://..." pnpm --filter @nexo/prisma prisma:migrate:deploy
```

El comando `prisma migrate deploy` aplica únicamente las migraciones pendientes. Es idempotente y seguro para producción (no ejecuta `migrate dev` ni `migrate reset`).

### 2. Migraciones SQL de Supabase (RLS, triggers, funciones)

```bash
# Desde infrastructure/supabase/:
DIRECT_URL="postgresql://..." pnpm exec tsx apply-migrations.ts
```

El script `apply-migrations.ts` mantiene una tabla `schema_migrations` para idempotencia — solo aplica las migraciones que aún no constan como aplicadas.

### Orden correcto en un release con cambios de schema

1. Deploy del código a `main` (merge PR).
2. Verificar que el deploy Vercel está en estado `READY`.
3. Aplicar migraciones Prisma (`prisma:migrate:deploy`).
4. Aplicar migraciones SQL (`apply-migrations.ts`).
5. Verificar `/api/health` en producción.

> **Regla crítica:** Nunca ejecutar `prisma migrate reset` ni `DROP TABLE` contra producción. Ver sección 11 de `CLAUDE.md` (Comandos PROHIBIDOS).

---

## Plantillas de email de Supabase Auth

Las plantillas HTML para magic link, confirm signup e invite user están versionadas en el repositorio y se aplican a través de la Management API de Supabase.

### Archivos

```
infrastructure/supabase/email-templates/
├── magic-link.html       # Inicio de sesión (signInWithOtp)
├── confirm-signup.html   # Confirmación de cuenta nueva
└── invite-user.html      # Invitación a un equipo
```

Las plantillas usan la variable `{{ .ConfirmationURL }}` que Supabase sustituye automáticamente con la URL de acción.

### Aplicar plantillas a un entorno

Requiere `SUPABASE_PAT` (Personal Access Token de supabase.com) y `SUPABASE_PROJECT_REF` en `.env.local`:

```bash
# Staging (DEV)
SUPABASE_PROJECT_REF=ooozdnqgiylqluktgpmc pnpm supabase:email-templates

# Producción (cambiar REF en .env.local al ref de producción)
SUPABASE_PROJECT_REF=<prod-ref> pnpm supabase:email-templates
```

El script es idempotente: re-ejecutarlo sobreescribe con las mismas plantillas sin efectos secundarios.

### Variables configuradas por el script

| Campo API | Asunto |
|---|---|
| `mailer_subjects_magic_link` | "Inicia sesión en Nexo Billing" |
| `mailer_subjects_confirmation` | "Confirma tu cuenta de Nexo Billing" |
| `mailer_subjects_invite` | "Te han invitado a unirte a Nexo Billing" |

> `SUPABASE_PAT` es un token personal del operador (sbp_...). Se custodia en el gestor de contraseñas. **Nunca** se sube al repositorio ni se añade a Vercel.

---

## Rollback de emergencia

Si un deploy de producción rompe la aplicación:

1. En Vercel dashboard → `nexo-billing` → Deployments → seleccionar el último deploy estable → "Promote to Production".
2. Si hay migraciones de schema aplicadas, evaluar si son reversibles (raramente lo son). Contactar al operador antes de ejecutar cualquier acción destructiva.
3. Abrir incidencia en el repositorio con el SHA del deploy fallido y los logs de error.
