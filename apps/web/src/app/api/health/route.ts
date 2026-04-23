import { NextResponse } from 'next/server'

// Dev-only endpoint: returns { db, supabase } status
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const result = {
    db: 'unknown' as string,
    supabase: 'unknown' as string,
    errors: [] as string[],
  }

  // Prisma / Postgres check
  try {
    const { prisma } = await import('@nexo/prisma')
    await prisma.$queryRaw`SELECT 1`
    result.db = 'ok'
  } catch (err) {
    result.db = 'error'
    result.errors.push(`db: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Supabase admin check
  try {
    const { createAdminClient } = await import('@nexo/core-auth')
    const admin = createAdminClient()
    const { error } = await admin.from('tenants').select('id').limit(1)
    if (error) throw new Error(error.message)
    result.supabase = 'ok'
  } catch (err) {
    result.supabase = 'error'
    result.errors.push(`supabase: ${err instanceof Error ? err.message : String(err)}`)
  }

  const status = result.db === 'ok' && result.supabase === 'ok' ? 200 : 500
  return NextResponse.json(result, { status })
}
