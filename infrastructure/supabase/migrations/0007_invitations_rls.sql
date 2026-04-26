-- RLS for the invitations table created by Prisma migration
-- 20260425120000_add_user_role_enum_and_invitation.

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Members of the same tenant can view pending invitations.
DROP POLICY IF EXISTS "invitations_select" ON invitations;
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Only the service role (admin client) inserts invitations.
-- Enforced at the application layer — no INSERT policy for authenticated users.

-- Only OWNER or ADMIN of the same tenant can delete (revoke) an invitation.
DROP POLICY IF EXISTS "invitations_delete" ON invitations;
CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') IN ('OWNER', 'ADMIN')
  );
