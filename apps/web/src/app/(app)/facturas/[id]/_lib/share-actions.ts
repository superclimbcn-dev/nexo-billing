'use server'

import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { signInvoiceToken } from '@/lib/public-invoice-token'

export async function signInvoiceTokenAction(invoiceId: string): Promise<{ token: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) throw new Error('No tenant')

  const inv = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    select: { id: true },
  })
  if (!inv) throw new Error('Invoice not found')

  const token = signInvoiceToken({ invoiceId, tenantId })
  return { token }
}
