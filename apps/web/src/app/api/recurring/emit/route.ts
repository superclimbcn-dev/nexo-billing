import { NextResponse } from 'next/server'
import { createServerClient } from '@nexo/core-auth'
import { emitDueInvoices } from '@/lib/recurring/emit-due-invoices'
import { revalidatePath } from 'next/cache'

export async function POST() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 403 })
  }

  const result = await emitDueInvoices(tenantId)

  revalidatePath('/facturas')
  revalidatePath('/recurrentes')

  return NextResponse.json(result)
}
