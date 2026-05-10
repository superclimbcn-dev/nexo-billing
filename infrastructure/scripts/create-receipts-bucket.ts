import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data: buckets } = await admin.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === 'receipts')

  if (exists) {
    console.log('Bucket "receipts" already exists')
    return
  }

  const { error } = await admin.storage.createBucket('receipts', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  })

  if (error) {
    console.error('Failed to create bucket:', error)
    process.exit(1)
  }

  console.log('Bucket "receipts" created successfully')
}

main()
