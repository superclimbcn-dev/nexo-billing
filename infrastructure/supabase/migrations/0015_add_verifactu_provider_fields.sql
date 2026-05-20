-- Add per-tenant Verifactu provider settings used by the app shell.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS verifactu_provider TEXT NOT NULL DEFAULT 'mock';

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS verifactu_nif_registered BOOLEAN NOT NULL DEFAULT false;

UPDATE public.tenants
SET verifactu_provider = 'verifacti',
    verifactu_nif_registered = true
WHERE subscription_status = 'ACTIVE';
