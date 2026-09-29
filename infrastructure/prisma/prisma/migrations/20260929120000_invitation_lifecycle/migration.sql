BEGIN;

-- Prevent invitations from changing between the duplicate precheck and index replacement.
LOCK TABLE public.invitations IN SHARE ROW EXCLUSIVE MODE;

-- Before this migration every existing invitation is implicitly pending.
-- Fail before any DDL instead of silently choosing between case-variant emails.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.invitations
    GROUP BY tenant_id, LOWER(email)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Case-insensitive duplicate pending invitations must be resolved before migration';
  END IF;
END $$;

-- Add an auditable invitation lifecycle without changing the one-tenant-per-user model.
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

ALTER TABLE public.invitations
  ADD COLUMN "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "accepted_at" TIMESTAMP(3),
  ADD COLUMN "accepted_by" UUID,
  ADD COLUMN "revoked_at" TIMESTAMP(3),
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP INDEX public."invitations_tenant_id_email_key";

ALTER TABLE public.invitations
  ADD CONSTRAINT "invitations_accepted_by_fkey"
  FOREIGN KEY ("accepted_by") REFERENCES public.users("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "invitations_pending_tenant_email_key"
  ON public.invitations ("tenant_id", LOWER("email"))
  WHERE "status" = 'PENDING';

CREATE INDEX "invitations_tenant_id_email_status_idx"
  ON public.invitations ("tenant_id", "email", "status");

CREATE INDEX "invitations_token_status_idx"
  ON public.invitations ("token", "status");

CREATE INDEX "invitations_email_status_idx"
  ON public.invitations (LOWER("email"), "status");

COMMIT;
