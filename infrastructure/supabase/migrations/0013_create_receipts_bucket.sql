-- Create receipts storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating to avoid duplicate names on re-runs
DROP POLICY IF EXISTS "receipts_select_tenant" ON storage.objects;
DROP POLICY IF EXISTS "receipts_insert_tenant" ON storage.objects;
DROP POLICY IF EXISTS "receipts_delete_tenant" ON storage.objects;

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