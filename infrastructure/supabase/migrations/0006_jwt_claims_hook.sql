-- JWT Custom Access Token Hook
-- Promotes app_metadata.tenant_id and app_metadata.role to top-level JWT claims.
-- Required so that RLS policies using (auth.jwt() ->> 'tenant_id') work correctly.
--
-- After running this migration you MUST activate the hook manually:
--
--   DEV (nexo-billing-dev project):
--     Supabase dashboard → Authentication → Hooks
--     → Custom Access Token Hook → Enable
--     → Schema: public   Function: custom_access_token_hook
--
--   PROD (nexo-billing project):
--     Same steps on the production Supabase project.
--
-- The hook fires on EVERY token issuance (login, refresh). If app_metadata does
-- not contain tenant_id yet (user is still in onboarding), the claim will be null
-- and RLS will simply return no rows — which is the correct behaviour.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  v_tenant_id text;
  v_role      text;
BEGIN
  claims      := event -> 'claims';
  v_tenant_id := event -> 'claims' -> 'app_metadata' ->> 'tenant_id';
  v_role      := event -> 'claims' -> 'app_metadata' ->> 'role';

  claims := jsonb_set(claims, '{tenant_id}', COALESCE(to_jsonb(v_tenant_id), 'null'::jsonb));
  claims := jsonb_set(claims, '{role}',      COALESCE(to_jsonb(v_role),      'null'::jsonb));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute to the Supabase auth admin role; revoke from all others.
GRANT  EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
