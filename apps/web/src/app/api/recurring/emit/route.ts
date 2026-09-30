import { NextResponse } from 'next/server'
import { emitDueInvoices } from '@/lib/recurring/emit-due-invoices'
import { revalidatePath } from 'next/cache'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

export async function POST() {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { tenantId } = auth

  const result = await emitDueInvoices(tenantId)

  revalidatePath('/facturas')
  revalidatePath('/recurrentes')

  return NextResponse.json(result)
}
