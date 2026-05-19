-- Restore DEFAULT gen_random_uuid()::text on invitations.token
-- Was lost during a previous migration; schema requires it.
ALTER TABLE "invitations" ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;
