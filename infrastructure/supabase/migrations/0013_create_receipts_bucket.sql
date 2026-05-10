-- Create receipts storage bucket if it doesn't exist
-- This migration documents the bucket creation.
-- Actual bucket creation should be done via Supabase Dashboard or CLI:
--   supabase storage create receipts --public
--
-- After bucket creation, apply these RLS policies via SQL Editor:

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see receipts from their own tenant
CREATE POLICY "receipts_select_tenant"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text
  );

-- Policy: users can only upload receipts to their own tenant folder
CREATE POLICY "receipts_insert_tenant"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text
  );

-- Policy: users can only delete receipts from their own tenant folder
CREATE POLICY "receipts_delete_tenant"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text
  );