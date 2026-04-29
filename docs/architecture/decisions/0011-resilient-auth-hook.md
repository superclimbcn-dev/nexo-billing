# ADR-0011: Hook JWT resiliente a usuarios sin perfil

**Date:** 2026-04-29
**Status:** Active
**Migration:** 0010_resilient_jwt_hook.sql
**Supersedes:** parte de 0006_jwt_claims_hook.sql

## Context

El hook `custom_access_token_hook` original (0006) fallaba con error si
el usuario en auth.users no tenía perfil correspondiente en public.users.

Casos donde sucede esto:
1. Durante el onboarding: el auth.user existe desde el magic link,
   pero public.users solo se crea al completar el último paso.
2. Tras `prisma migrate reset`: public.users se borra, pero auth.users
   (schema interno de Supabase) NO se toca.
3. Usuarios huérfanos por cualquier otro motivo.

Resultado: login fallaba con
"Error running hook URI: pg-functions://postgres/public/custom_access_token_hook"

Detectado en staging tras Sesión 5.5 Phase 1.

## Decision

Hacer el hook tolerante a fallos:
- Si encuentra perfil → inyecta claims (comportamiento original).
- Si NO encuentra perfil → devuelve `event` sin claims custom.
- Si hay cualquier error en la query → devuelve `event` sin claims custom.

Esto permite al middleware Next.js manejar el caso "no tenant_id" como
ya hace hoy (redirige a /onboarding).

## Consequences

✅ Auth nunca falla por este hook.
✅ Onboarding sigue funcionando (intermedio sin public.users es válido).
✅ Resets de BD no rompen auth.
✅ Backwards-compatible con todo el código actual.
⚠️ Si el hook devuelve event sin tenant_id, las RLS policies actuales
   (que usan `auth.jwt() ->> 'tenant_id'`) bloquean queries — esto es
   el comportamiento DESEADO durante onboarding (no debe ver datos
   de ningún tenant aún).

## References

- 0006_jwt_claims_hook.sql (versión original)
- 0010_resilient_jwt_hook.sql (versión resiliente)
- ARCHITECTURE_SNAPSHOT.md (documentaba la "trampa conocida" del hook)
