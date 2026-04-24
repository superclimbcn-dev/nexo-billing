import { NextRequest } from 'next/server'
import { prisma } from '@nexo/prisma'
import { createAdminClient } from '@nexo/core-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HEALTH_TOKEN = process.env.HEALTH_CHECK_TOKEN

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const token = req.nextUrl.searchParams.get('token')
    if (!HEALTH_TOKEN || token !== HEALTH_TOKEN) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const result: { db: string; supabase: string; env: string; errors?: string[] } = {
    db: 'unknown',
    supabase: 'unknown',
    env: process.env.NODE_ENV ?? 'unknown',
    errors: [],
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    result.db = 'ok'
  } catch (e) {
    result.db = 'error'
    result.errors!.push(`db: ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) throw error
    result.supabase = 'ok'
  } catch (e) {
    result.supabase = 'error'
    result.errors!.push(`supabase: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (result.errors!.length === 0) delete result.errors

  const allOk = result.db === 'ok' && result.supabase === 'ok'
  return Response.json(result, { status: allOk ? 200 : 500 })
}
