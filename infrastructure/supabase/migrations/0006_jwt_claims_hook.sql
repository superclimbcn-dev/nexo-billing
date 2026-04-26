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
  claims      jsonb;
  user_record record;
BEGIN
  claims := event -> 'claims';

  -- Only inject custom claims if the user has completed onboarding
  -- (i.e. a row exists in public.users with their tenant assignment).
  -- If onboarding is not complete yet, return claims unchanged so Supabase
  -- does not reject the JWT for a null/missing required claim.
  SELECT tenant_id, role
  INTO   user_record
  FROM   public.users
  WHERE  id = (event ->> 'user_id')::uuid;

  IF FOUND THEN
    -- Promote to top-level claims consumed by RLS policies.
    -- Use "user_role" (not "role") to avoid collision with Supabase's
    -- internal "role" claim (authenticated / anon / service_role).
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_record.tenant_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_record.role::text));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute to the Supabase auth admin role; revoke from all others.
GRANT  EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
