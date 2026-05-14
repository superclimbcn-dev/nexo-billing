-- ════════════════════════════════════════════════════════════════════════════
-- 0010 — Hook custom_access_token_hook resiliente
-- ════════════════════════════════════════════════════════════════════════════
--
-- Fix para evitar fallo de login cuando un usuario auth.users no tiene
-- aún perfil en public.users (caso típico: durante onboarding, tras reset,
-- o usuarios huérfanos).
--
-- Comportamiento:
-- - Si encuentra perfil → inyecta tenant_id + user_role en JWT (igual que antes).
-- - Si NO encuentra perfil → devuelve event sin claims custom (NO falla).
--   El middleware Next.js detecta la ausencia de tenant_id y redirige a
--   /onboarding como ya hace hoy.
--
-- Reemplaza la función original de 0006_jwt_claims_hook.sql.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_record record;
BEGIN
  -- Extract current claims
  claims := event -> 'claims';

  -- Try to find user profile in public.users
  -- IMPORTANT: use BEGIN/EXCEPTION block to never crash auth flow
  BEGIN
    SELECT tenant_id, role
    INTO user_record
    FROM public.users
    WHERE id = (event ->> 'user_id')::uuid;
  EXCEPTION
    WHEN OTHERS THEN
      -- Any error reading public.users → return event unchanged
      -- This ensures auth NEVER fails due to issues here
      RETURN event;
  END;

  -- If found, inject tenant_id and user_role into JWT claims
  IF FOUND THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_record.tenant_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_record.role::text));
    RETURN jsonb_set(event, '{claims}', claims);
  END IF;

  -- No profile yet (onboarding pending, or orphaned auth user)
  -- Return event unchanged → middleware will detect missing tenant_id
  -- and redirect to /onboarding as it already does
  RETURN event;
END;
$$;

-- Re-grant permissions (in case CREATE OR REPLACE drops them)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Add documentation comment
COMMENT ON FUNCTION public.custom_access_token_hook IS
  'JWT custom claims hook. Resilient version (0010): returns event unchanged if user has no public.users profile. Required for users mid-onboarding or orphaned auth.users.';
