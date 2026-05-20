-- Add trial end date used by the subscription gate.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP(3);
